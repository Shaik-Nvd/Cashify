/**
 * Builds lib/pricing/appleCashifyModel/exact.json: every unambiguous Cashify quotation the testing team recorded, keyed by
 * model + capacity + the answers Cashify prices on (see exact.ts). Sources:
 *   - the 57 quotation archives (data/pricing-evidence/measurements.jsonl, normalised by normalize_cashify_quotes.py)
 *   - scripts/pricing/fixtures/exact-captures-2026-10-10.json            (browser captures, 10 Oct 2026)
 *   - scripts/pricing/fixtures/team-workbook-development-cases-2026-10-02.json   (tester workbook, 2 Oct 2026)
 * The owner has confirmed all of them are real Cashify results; none is second-guessed here. A record is dropped only when
 * it is AMBIGUOUS: two records of the same configuration collected against the same Get Upto that disagree. Those are written
 * to data/pricing-evidence/exact_conflicts.json and priced by the model instead.
 *
 *   npx tsx scripts/pricing-evidence/build-exact-index.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import calibrationJson from '../../lib/pricing/appleCashifyModel/calibration.json';
import { parseAnswers, type Calibration } from '../../lib/pricing/appleCashifyModel/model';
import { chargerMissing, exactKey, type ExactEntry } from '../../lib/pricing/appleCashifyModel/exact';
import { evidenceModelKey, storageGbOf } from '../../lib/pricing/appleCashifyModel/scope';
import { EVIDENCE_DIR, hasUnknownInput, loadMeasurements, toDiagnostics } from './evidenceLib';

const CAL = calibrationJson as unknown as Calibration;
const root = path.resolve(__dirname, '../..');
interface Rec { priority: number; model: string; gb: number; key: string; date: string | null; g0: number; base: number | null; source: string; caseId: string }
const recs: Rec[] = [];

for (const m of loadMeasurements()) {
  if (hasUnknownInput(m)) continue;
  const profile = CAL.models[m.model_key] ?? null;
  const diag = toDiagnostics(m, 'none');
  const a = parseAnswers(diag);
  if (a.unsupported.length) continue;
  if (m.outcome === 'NUMERIC_QUOTE' && m.base == null) continue;
  recs.push({ priority: 2, model: m.model_key, gb: m.storage_gb, key: exactKey(profile, a, m.model_key, m.inputs.charger.value === 'no'), date: m.observed_date, g0: m.variant_get_upto, base: m.outcome === 'NUMERIC_QUOTE' ? m.base : null, source: `${m.archive}::${m.case_id}`, caseId: m.case_id });
}
const FIX = path.join(root, 'scripts/pricing/fixtures');
const exact = JSON.parse(fs.readFileSync(path.join(FIX, 'exact-captures-2026-10-10.json'), 'utf8'));
for (const r of exact.rows) {
  const model = evidenceModelKey(r.model); const gb = storageGbOf(r.storage);
  if (gb == null) continue;
  const a = parseAnswers(r.diagnostics);
  if (a.unsupported.length) continue;
  recs.push({ priority: 2, model, gb, key: exactKey(CAL.models[model] ?? null, a, model, chargerMissing(r.diagnostics)), date: String(r.observedAt).slice(0, 10), g0: r.getUpto, base: r.sellingPrice + 20, source: `exact-captures-2026-10-10::${r.id}`, caseId: r.id });
}
const wb = JSON.parse(fs.readFileSync(path.join(FIX, 'team-workbook-development-cases-2026-10-02.json'), 'utf8'));
for (const r of wb) {
  if (r.brand !== 'Apple') continue;
  const model = evidenceModelKey(r.model); const gb = storageGbOf(r.storage);
  if (gb == null) continue;
  const a = parseAnswers(r.diagnostics);
  if (a.unsupported.length) continue;
  recs.push({ priority: 1, model, gb, key: exactKey(CAL.models[model] ?? null, a, model, chargerMissing(r.diagnostics)), date: '2026-10-02', g0: r.reference, base: r.observed + 20, source: `team-workbook-development-cases-2026-10-02::${r.caseId}`, caseId: r.caseId });
}

// A condition price above the Get Upto of the same flawless variant is self-contradictory (the Get Upto is the highest quote for the variant): such a
// record cannot be served as a price and is reported instead (the tester workbook has one: iPhone 11 Pro Max 256 GB, clean 19,480 against a Get Upto of 18,740).
const inconsistent = recs.filter(r => r.base != null && r.base > r.g0);
const usable = recs.filter(r => !(r.base != null && r.base > r.g0));
// group by model | gb | key | g0 ; same value => one record, different values => ambiguous
const groups = new Map<string, Rec[]>();
for (const r of usable) { const k = `${r.model}|${r.gb}|${r.key}|${r.g0}`; (groups.get(k) ?? groups.set(k, []).get(k)!).push(r); }
const index: Record<string, Record<string, Record<string, ExactEntry[]>>> = {};
const conflicts: any[] = [];
let entries = 0, noOffers = 0;
const demoted: any[] = [];
for (const [, all] of groups) {
  // archives and screenshot captures state every answer per case; the tester workbook is hand-entered. When they disagree on the
  // same configuration at the same Get Upto, the archive record is used and the workbook one is reported as a mismatch.
  const top = Math.max(...all.map(r => r.priority));
  const g = all.filter(r => r.priority === top);
  for (const r of all.filter(r => r.priority < top && !g.some(x => x.base === r.base))) demoted.push({ model: r.model, storageGb: r.gb, key: r.key, getUpto: r.g0, workbookBase: r.base, usedBase: g[0].base, source: r.source, usedSource: g[0].source });
  const values = new Set(g.map(r => r.base));
  if (values.size > 1) { conflicts.push({ model: g[0].model, storageGb: g[0].gb, key: g[0].key, getUpto: g[0].g0, records: g.map(r => ({ base: r.base, date: r.date, source: r.source })) }); continue; }
  const newest = g.map(r => r.date).filter(Boolean).sort().pop() ?? null;
  const e: ExactEntry = [newest, g[0].g0, g[0].base];
  ((index[g[0].model] ??= {})[String(g[0].gb)] ??= {})[g[0].key] ??= [];
  index[g[0].model][String(g[0].gb)][g[0].key].push(e);
  entries++; if (g[0].base == null) noOffers++;
}
for (const m of Object.values(index)) for (const s of Object.values(m)) for (const k of Object.keys(s)) s[k].sort((x, y) => (y[0] ?? '').localeCompare(x[0] ?? '') || y[1] - x[1]);
const out = { version: `exact/${new Date('2026-10-25').toISOString().slice(0, 10)}`, models: index };
fs.writeFileSync(path.join(root, 'lib/pricing/appleCashifyModel/exact.json'), JSON.stringify(out) + '\n');
fs.writeFileSync(path.join(EVIDENCE_DIR, 'exact_conflicts.json'), JSON.stringify({ ambiguous: conflicts, workbookOverruled: demoted, priceAboveOwnGetUpto: inconsistent.map(r => ({ model: r.model, storageGb: r.gb, getUpto: r.g0, base: r.base, source: r.source })) }, null, 1) + '\n');
const keys = Object.values(index).flatMap(m => Object.values(m).flatMap(s => Object.keys(s))).length;
console.log(JSON.stringify({ records: recs.length, priceAboveOwnGetUpto: inconsistent.length, groups: groups.size, entries, noOffers, configurations: keys, conflicts: conflicts.length, models: Object.keys(index).length }, null, 1));
for (const c of conflicts) console.log('CONFLICT', c.model, c.storageGb, c.key, c.getUpto, JSON.stringify(c.records.map((r: any) => [r.base, r.date, r.source.slice(0, 40)])));
