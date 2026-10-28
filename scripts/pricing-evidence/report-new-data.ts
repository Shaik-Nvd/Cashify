/**
 * Coverage and accuracy tables for docs/PRICING_NEW_DATA_2026_10_28.md, from the committed calibration, the catalog, the service replay and
 * the held-out validation summary (validation-2026-10-28/summary.json). No database or network.
 *
 *   npx tsx scripts/pricing-evidence/report-new-data.ts > data/pricing-evidence/validation-2026-10-28/coverage.md
 */
import fs from 'node:fs';
import path from 'node:path';
import calibrationJson from '../../lib/pricing/appleCashifyModel/calibration.json';
import { SCOPE, storageGbOf } from '../../lib/pricing/appleCashifyModel/scope';
import { appleEvidenceQuote } from '../../lib/pricing/appleCashifyModel';
import type { Calibration } from '../../lib/pricing/appleCashifyModel/model';
import { PERFECT_CONDITION_DIAGNOSTICS } from '../../lib/pricing/perfectCondition';
import { SEED_DEVICES } from '../../lib/seed_devices';
import { EVIDENCE_DIR, hasUnknownInput, loadMeasurements } from './evidenceLib';
import { replayService } from './replay-service';

const CAL = calibrationJson as unknown as Calibration;
const VAL = path.join(EVIDENCE_DIR, 'validation-2026-10-28');
const summary = fs.existsSync(path.join(VAL, 'summary.json')) ? JSON.parse(fs.readFileSync(path.join(VAL, 'summary.json'), 'utf8')) : { protocols: {} };
const heldOut = (protocol: string, model: string) => summary.protocols[protocol]?.byModel?.find((g: any) => g.key === model)?.proposed;

(async () => {
  const ms = loadMeasurements().filter(m => !hasUnknownInput(m) && m.outcome === 'NUMERIC_QUOTE' && m.base != null);
  const rows = await replayService(ms);
  const clean = { ...PERFECT_CONDITION_DIAGNOSTICS, accessories: ['box'], box: true } as any;
  const apple = (SEED_DEVICES as any[]).filter(d => d.brand === 'Apple');
  const models = [...new Set(apple.map(d => d.model.replace(/^Apple /, '')))].sort();
  console.log('| Model | Catalog variants | Quoted capacities (GB) | Codes measured / inferred | Clean offset | Floor | In-sample served MAE (n, inspection) | p1 held-out MAE | p2 held-out MAE |');
  console.log('|---|---:|---|---:|---:|---|---|---:|---:|');
  let variants = 0, priced = 0;
  for (const model of models) {
    const p = CAL.models[model];
    const entry = SCOPE.models[model];
    const cat = apple.filter(d => d.model === `Apple ${model}`);
    for (const d of cat) { variants++; if (appleEvidenceQuote(d.model, d.storage, 20000, clean)) priced++; }
    const mine = rows.filter(r => r.m.model_key === model);
    const ok = mine.filter(r => r.ok);
    const mae = ok.length ? Math.round(ok.reduce((a, r) => a + Math.abs(r.error!), 0) / ok.length) : null;
    const codes = Object.values((p ?? CAL.models[entry?.fallbackFrom ?? ''])?.codes ?? {});
    const measured = p ? codes.filter(c => c.support === 'measured').length : 0;
    const quoted = [...new Set(ms.filter(m => m.model_key === model).map(m => m.storage_gb))].sort((a, b) => a - b);
    const p1 = heldOut('p1', model), p2 = heldOut('p2', model);
    console.log(`| ${model}${entry?.fallbackFrom ? ` (from ${entry.fallbackFrom}, inferred)` : ''} | ${cat.length} | ${quoted.join(', ') || '-'} | ${measured} / ${codes.length - measured} | ${p?.cleanOffset?.value ?? 0} | ${p?.floor ? `${(p.floor.value * 100).toFixed(1)}% ${p.floor.basis}` : '-'} | ${mae ?? '-'} (${mine.length}, ${mine.length - ok.length}) | ${p1?.mae ?? '-'} | ${p2?.mae ?? '-'} |`);
  }
  console.log(`\nCatalog iPhone variants priced by the rules for a clean phone: ${priced} of ${variants}; models ${models.length}.`);
  void storageGbOf;
})();
