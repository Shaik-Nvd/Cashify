import { hasUnknownInput, loadMeasurements, toDiagnostics } from './evidenceLib';
import { fitCalibration } from './fitCalibration';
import { deduct, parseAnswers } from '../../lib/pricing/appleCashifyModel/model';

const model = process.argv[2];
const ms = loadMeasurements().filter(m => !hasUnknownInput(m));
const { calibration } = fitCalibration(ms, 'x', [model]);
const p = calibration.models[model];
console.log(JSON.stringify({ floor: p.floor, box: p.boxNo, age: p.age, ageByStorage: p.ageByStorage }, null, 0));
console.log(JSON.stringify(Object.fromEntries(Object.entries(p.classes).map(([k, v]) => [k, `${v!.kind}:${v!.kind === 'pct' ? v!.value.toFixed(4) : Math.round(v!.value)}${v!.support === 'measured' ? '' : '?'}`]))));
const rows = ms.filter(m => m.model_key === model && m.outcome === 'NUMERIC_QUOTE' && m.base != null).map(m => {
  const d = deduct(p, m.variant_get_upto, parseAnswers(toDiagnostics(m, 'none')), m.storage_gb);
  const f = 'deduction' in d ? d.deduction : NaN;
  return { m, f, err: f - (m.variant_get_upto - m.base!) };
});
rows.sort((a, b) => Math.abs(b.err) - Math.abs(a.err));
for (const r of rows.slice(0, Number(process.argv[3] ?? 12))) {
  const d = deduct(p, r.m.variant_get_upto, parseAnswers(toDiagnostics(r.m, 'none')), r.m.storage_gb);
  console.log(`${Math.round(r.err)} ${r.m.storage} ${r.m.case_id} obsDed=${r.m.variant_get_upto - r.m.base!} fitDed=${Math.round(r.f)} ${r.m.deviations.join(',').slice(0, 50)}`);
  if ('breakdown' in d) console.log('    ' + d.breakdown.map(b => `${b.rule}:${Math.round(b.amount)}`).join(' | '));
}

if (process.argv[4] === 'try') {
  const sse = (q: typeof p) => {
    let t = 0; let n = 0;
    for (const m of ms.filter(x => x.model_key === model && x.outcome === 'NUMERIC_QUOTE' && x.base != null)) {
      const d = deduct(q, m.variant_get_upto, parseAnswers(toDiagnostics(m, 'none')), m.storage_gb);
      if (!('deduction' in d)) continue;
      const obs = m.variant_get_upto - m.base!;
      const atFloor = q.floor && d.state === 3 && d.agedPrice != null && m.base! <= q.floor.value * (q.floor.basis === 'aged' ? d.agedPrice : m.variant_get_upto) * 1.0012 + 10;
      const r = atFloor ? Math.max(0, obs - d.deduction) : obs - d.deduction;
      t += r * r; n++;
    }
    return Math.sqrt(t / n);
  };
  console.log('fitted rmse', sse(p));
  const q = JSON.parse(JSON.stringify(p));
  q.classes.touch.value = 18400; q.classes.cracked.value = 9900; q.classes.panel.value = 5850; q.classes.wifi.value = 0.3155; q.classes.face.value = 0.2103;
  console.log('hand rmse', sse(q));
}

if (process.argv[4] === 'try') {
  const q = JSON.parse(JSON.stringify(p));
  q.classes.touch.value = 18400; q.classes.cracked.value = 9900; q.classes.panel.value = 5850; q.classes.wifi.value = 0.3155; q.classes.face.value = 0.2103;
  const rr = ms.filter(x => x.model_key === model && x.outcome === 'NUMERIC_QUOTE' && x.base != null).map(m => {
    const d = deduct(q, m.variant_get_upto, parseAnswers(toDiagnostics(m, 'none')), m.storage_gb);
    const obs = m.variant_get_upto - m.base!;
    const f = 'deduction' in d ? d.deduction : NaN;
    const atFloor = q.floor && 'deduction' in d && d.state === 3 && d.agedPrice != null && m.base! <= q.floor.value * (q.floor.basis === 'aged' ? d.agedPrice : m.variant_get_upto) * 1.0012 + 10;
    return { m, e: atFloor ? Math.min(0, f - obs) : f - obs, atFloor };
  }).filter(x => Number.isFinite(x.e)).sort((a, b) => Math.abs(b.e) - Math.abs(a.e));
  for (const x of rr.slice(0, 14)) console.log('HAND', Math.round(x.e), x.m.storage, x.m.case_id, x.atFloor ? '(floor)' : '', x.m.deviations.join(',').slice(0, 60));
}
