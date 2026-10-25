/**
 * Diagnostic: fit on all data and print the worst in-sample residuals of one model.
 *   npx tsx scripts/pricing-evidence/residuals.ts "iPhone 17 Pro Max" [count]
 */
import { evaluateAppleEvidence } from '../../lib/pricing/appleCashifyModel/model';
import { hasUnknownInput, loadMeasurements, toDiagnostics } from './evidenceLib';
import { fitCalibration } from './fitCalibration';

const model = process.argv[2];
const count = Number(process.argv[3] ?? 25);
const ms = loadMeasurements().filter(m => !hasUnknownInput(m));
const trainFilter = process.env.TRAIN_FAMILY;
const { calibration } = fitCalibration(trainFilter ? ms.filter(m => m.family === trainFilter) : ms, 'diagnostic');
const profile = calibration.models[model];
const rows = ms.filter(m => m.model_key === model && m.outcome === 'NUMERIC_QUOTE' && m.base != null).map(m => {
  const o = evaluateAppleEvidence(profile, m.variant_get_upto, toDiagnostics(m, 'none'), m.storage_gb);
  const pred = o.kind === 'PRICE' ? o.price : null;
  return { m, o, pred, err: pred == null ? null : pred - m.base! };
});
const bad = rows.filter(r => r.err == null || Math.abs(r.err) > 60).sort((a, b) => Math.abs(b.err ?? 1e9) - Math.abs(a.err ?? 1e9));
console.log(`${model}: ${rows.length} rows, ${bad.length} with |err|>60`);
for (const r of bad.slice(0, count)) {
  console.log(`${String(r.err).padStart(7)} ${r.m.storage.padStart(5)} ${r.m.observed_date} ${r.m.case_id.padEnd(9)} R=${r.m.variant_get_upto} obs=${r.m.base} pred=${r.pred ?? r.o.kind}  ${r.m.deviations.join(',').slice(0, 70)}`);
}
