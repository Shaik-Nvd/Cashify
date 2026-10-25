/**
 * Frozen-rules check against quotes that are NOT part of the 57 archives the model was fitted and validated on.
 *
 * The rules (model.ts, template.json, calibration.json, scope.json) are hashed first; nothing here can change them.
 * Sources, all collected before the fitted archives (2-11 Oct 2026, the fitted data is 16-24 Oct) by other tests:
 *   - exact-captures-2026-10-10.json     screenshot-verified browser captures
 *   - team-workbook-development-cases    tester-reported workbook rows (warranty/age answers entered by hand, eSIM unverified)
 * Only models the shipped scope serves are scored; anything else is reported as out of scope, not as a pass.
 *
 *   npx tsx scripts/pricing-evidence/validate-independent.ts [extra-captures.json ...]
 * Extra files use the shape {"rows":[{id, model, storage, getUpto, sellingPrice, observedAt, diagnostics}]} (fresh browser captures).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { appleEvidenceQuote } from '../../lib/pricing/appleCashifyModel';
import { InspectionRequiredError } from '../../lib/pricing/inspectionRequired';
import { priceDevice } from '../../lib/pricing/engine';
import { EVIDENCE_DIR } from './evidenceLib';

const root = path.resolve(__dirname, '../..');
const FIX = path.join(root, 'scripts/pricing/fixtures');
const frozenFiles = ['lib/pricing/appleCashifyModel/model.ts', 'lib/pricing/appleCashifyModel/template.json', 'lib/pricing/appleCashifyModel/calibration.json', 'lib/pricing/appleCashifyModel/scope.json', 'lib/pricing/appleCashifyModel/index.ts'];
const frozen = Object.fromEntries(frozenFiles.map(f => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex')]));

interface Case { id: string; origin: string; verified: boolean; model: string; storage: string; reference: number; observedSelling: number; date: string; diagnostics: any; label: string }
const cases: Case[] = [];
const stor = (s: string) => s.replace(/\s+/g, '');
const exact = JSON.parse(fs.readFileSync(path.join(FIX, 'exact-captures-2026-10-10.json'), 'utf8'));
for (const r of exact.rows) cases.push({ id: r.id, origin: 'exact-captures-2026-10-10', verified: !!r.provenance?.screenshotVerified, model: r.model, storage: stor(r.storage), reference: r.getUpto, observedSelling: r.sellingPrice, date: r.observedAt.slice(0, 10), diagnostics: r.diagnostics, label: r.provenance?.role ?? '' });
const wb = JSON.parse(fs.readFileSync(path.join(FIX, 'team-workbook-development-cases-2026-10-02.json'), 'utf8'));
for (const r of wb) if (r.brand === 'Apple') cases.push({ id: r.caseId, origin: 'team-workbook-development-cases-2026-10-02', verified: false, model: r.model, storage: stor(r.storage), reference: r.reference, observedSelling: r.observed, date: '2026-10-02', diagnostics: r.diagnostics, label: r.condition });
for (const extra of process.argv.slice(2)) {
  const j = JSON.parse(fs.readFileSync(extra, 'utf8'));
  for (const r of j.rows) cases.push({ id: r.id, origin: path.basename(extra), verified: !!r.provenance?.screenshotVerified, model: r.model, storage: stor(r.storage), reference: r.getUpto, observedSelling: r.sellingPrice, date: String(r.observedAt).slice(0, 10), diagnostics: r.diagnostics, label: r.provenance?.role ?? '' });
}

const results: any[] = [];
for (const c of cases) {
  const observedBase = c.observedSelling + 20;
  const row: any = { id: c.id, origin: c.origin, verified: c.verified, model: c.model, storage: c.storage, date: c.date, label: c.label, getUpto: c.reference, observedSelling: c.observedSelling, observedBase };
  try {
    const ev = appleEvidenceQuote(c.model, c.storage, c.reference, c.diagnostics);
    if (!ev) row.outcome = 'OUT_OF_SCOPE';
    else { row.outcome = 'PRICED'; row.estimate = ev.outcome.price; row.confidence = ev.outcome.confidence; row.error = ev.outcome.price - observedBase; row.relPct = +(100 * Math.abs(row.error) / Math.max(observedBase, 0.2 * c.reference)).toFixed(2); }
  } catch (e) { if (e instanceof InspectionRequiredError) { row.outcome = 'INSPECTION'; row.reason = e.reason; } else throw e; }
  try { const old = priceDevice('Apple', c.model, c.reference, c.diagnostics, undefined, c.storage, { disableAppleEvidence: true } as any); row.existing = old.cashifyConditionEquivalent; row.existingError = old.cashifyConditionEquivalent - observedBase; } catch { row.existing = null; }
  results.push(row);
}
const priced = results.filter(r => r.outcome === 'PRICED');
const q = (xs: number[], p: number) => { const v = [...xs].sort((a, b) => a - b); return v.length ? v[Math.min(v.length - 1, Math.max(0, Math.ceil(p * v.length) - 1))] : null; };
const summary = (rs: any[]) => ({
  n: rs.length, meanAbsError: rs.length ? Math.round(rs.reduce((a, r) => a + Math.abs(r.error), 0) / rs.length) : null, existingMeanAbsError: rs.length ? Math.round(rs.reduce((a, r) => a + Math.abs(r.existingError ?? 0), 0) / rs.length) : null,
  medianRelPct: q(rs.map(r => r.relPct), 0.5), p90RelPct: q(rs.map(r => r.relPct), 0.9), maxRelPct: rs.length ? Math.max(...rs.map(r => r.relPct)) : null,
  overQuotes: rs.filter(r => r.error > 0).length, maxOverQuote: rs.length ? Math.max(0, ...rs.map(r => r.error)) : null,
});
const out = {
  frozenRules: frozen, note: 'independent of the fitted archives; small n; scored only where the shipped scope prices',
  counts: { cases: results.length, priced: priced.length, inspection: results.filter(r => r.outcome === 'INSPECTION').length, outOfScope: results.filter(r => r.outcome === 'OUT_OF_SCOPE').length },
  all: summary(priced), screenshotVerifiedOnly: summary(priced.filter(r => r.verified)), results,
};
fs.writeFileSync(path.join(EVIDENCE_DIR, 'validation', 'independent_validation.json'), JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify({ counts: out.counts, all: out.all, verified: out.screenshotVerifiedOnly }, null, 1));
for (const r of results) console.log(r.outcome.padEnd(12), r.model.padEnd(24), r.storage.padEnd(7), r.id.slice(-24).padEnd(24), 'obs', r.observedBase, 'est', r.estimate ?? '-', 'err', r.error ?? '-', r.confidence ?? r.reason?.slice(0, 50) ?? '', r.verified ? '[verified]' : '');
