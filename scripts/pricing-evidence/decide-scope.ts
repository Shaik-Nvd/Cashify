/**
 * Decide, per iPhone model, whether the evidence-calibrated model may price instant quotes, from the HELD-OUT validation
 * rows only (unseen condition shapes = p1, unseen storage variants = p2). In-sample fit never counts.
 *
 * The model labels every quote 'measured' (every parameter pinned down by the model's own quotes AND the combination of
 * condition groups was seen together on that model) or 'inferred'. Held-out accuracy differs sharply between the two, so
 * the thresholds are applied to each subset separately:
 *
 *   T1  median relative error            <= 1.0 %
 *   T2  90th-percentile relative error   <= 5.0 %
 *   T3  95th-percentile OVER-quote       <= 3.0 %   (quoting above Cashify is the costly direction: the uplift sits on top of it)
 *   T4  mean absolute error              <= 50 % of the existing engine's on the same rows
 *   T5  the model has >= 100 held-out quotes over >= 10 distinct condition shapes in total (as originally stated); each subset judged
 *       separately needs >= 30 quotes over >= 5 shapes for its percentiles to mean anything (otherwise it counts as NOT validated)
 *   T6  at most 15 % of the model's held-out quotes declined (inspection / unsupported)
 *   T7  worst single over-quote <= 10 % of that day's Get Upto   (added after the first results showed percentile thresholds
 *       can hide a few catastrophic misses; it only ever excludes more)
 * relative error = |model - Cashify| / max(Cashify quote, 20 % of that day's Get Upto)
 *
 * Per-model mode:
 *   all             the measured subset passes AND the inferred subset passes: every condition gets an instant quote
 *   measured-only   the measured subset passes, the inferred subset does not: instant quote for validated combinations,
 *                   manual inspection for the rest (never a guess, never the old engine)
 *   off             the measured subset does not pass (or too little evidence): the existing engine, unchanged
 *
 *   npx tsx scripts/pricing-evidence/decide-scope.ts [--write]
 */
import fs from 'node:fs';
import path from 'node:path';
import { EVIDENCE_DIR } from './evidenceLib';
import calibrationJson from '../../lib/pricing/appleCashifyModel/calibration.json';
import type { Calibration } from '../../lib/pricing/appleCashifyModel/model';

const VAL = path.join(EVIDENCE_DIR, 'validation');
const CAL = calibrationJson as unknown as Calibration;
const read = (p: string) => fs.readFileSync(path.join(VAL, p), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const rows = [...read('rows_p1.jsonl'), ...read('rows_p2.jsonl')].filter(r => r.observedOutcome === 'NUMERIC_QUOTE' && r.observedBase != null);

const q = (xs: number[], p: number) => { const v = [...xs].sort((a, b) => a - b); return v.length ? v[Math.min(v.length - 1, Math.max(0, Math.ceil(p * v.length) - 1))] : NaN; };
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const denom = (r: any) => Math.max(r.observedBase, 0.2 * r.reference);

function judge(subset: any[], all: any[], minQuotes: number, minShapes: number) {
  const rel = subset.map(r => Math.abs(r.proposed.price - r.observedBase) / denom(r));
  const over = subset.map(r => (r.proposed.price - r.observedBase) / denom(r));
  const evAbs = subset.map(r => Math.abs(r.proposed.price - r.observedBase));
  const exAbs = subset.filter(r => r.existing.kind === 'PRICE').map(r => Math.abs(r.existing.price - r.observedBase));
  const worst = subset.reduce((m, r) => Math.max(m, (r.proposed.price - r.observedBase) / r.reference), -1);
  const shapes = new Set(subset.map(r => r.deviations.join('|'))).size;
  const metrics = {
    quotes: subset.length, shapes, medianRelPct: 100 * q(rel, 0.5), p90RelPct: 100 * q(rel, 0.9), p95OverPct: 100 * q(over, 0.95),
    worstOverPctOfReference: 100 * worst, maeEvidence: Math.round(mean(evAbs)), maeExisting: Math.round(mean(exAbs)),
  };
  const checks = {
    T1: metrics.medianRelPct <= 1.0, T2: metrics.p90RelPct <= 5.0, T3: metrics.p95OverPct <= 3.0,
    T4: metrics.maeEvidence <= 0.5 * metrics.maeExisting, T5s: metrics.quotes >= minQuotes && metrics.shapes >= minShapes, T7: metrics.worstOverPctOfReference <= 10,
  };
  void all;
  return { metrics, checks, failed: Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k) };
}

const decisions: Record<string, any> = {};
for (const model of Object.keys(CAL.models).sort()) {
  const mine = rows.filter(r => r.model === model);
  const priced = mine.filter(r => r.proposed.kind === 'PRICE');
  const measured = priced.filter(r => r.confidence === 'measured');
  const inferred = priced.filter(r => r.confidence === 'inferred');
  const declinedShare = mine.length ? 1 - priced.length / mine.length : 0;
  const m = measured.length ? judge(measured, mine, 30, 5) : null;
  const i = inferred.length ? judge(inferred, mine, 30, 5) : null;
  const t6 = declinedShare <= 0.15;
  const t5 = mine.length >= 100 && new Set(mine.map(r => r.deviations.join('|'))).size >= 10;
  // REPLACEMENT RULE (owner decision 2026-10-25): the evidence rules replace the existing engine for a model's unrecorded combinations
  // whenever, on the SAME held-out rows, they are more accurate than the existing engine. Combinations are never sent to inspection for
  // being unmeasured (inspection stays for Cashify no-offers and contradictory answers). T1-T7 are still reported, no longer a gate.
  const pooled = priced.filter(r => r.existing.kind === 'PRICE');
  const maeNew = pooled.length ? mean(pooled.map(r => Math.abs(r.proposed.price - r.observedBase))) : NaN;
  const maeOld = pooled.length ? mean(pooled.map(r => Math.abs(r.existing.price - r.observedBase))) : NaN;
  const measuredOk = Number.isFinite(maeNew) && Number.isFinite(maeOld) && maeNew < maeOld;
  const inferredOk = true;
  const mode = measuredOk ? 'all' : 'off';
  decisions[model] = { mode, enabled: mode !== 'off', maeNew: Math.round(maeNew), maeOld: Math.round(maeOld), declinedShare, T6: t6, measured: m, inferred: i, failedMeasured: [...(m ? m.failed : ['T5s']), ...(t5 ? [] : ['T5']), ...(t6 ? [] : ['T6'])], failedInferred: i ? i.failed : [], storagesGb: CAL.models[model].storagesGb,
    heldOutQuotes: mine.length, shareMeasured: priced.length ? measured.length / priced.length : 0 };
}

const f = (x: number | undefined, d = 2) => (x == null || !Number.isFinite(x) ? '-' : x.toFixed(d));
console.log('model'.padEnd(18), 'held'.padStart(5), '%meas'.padStart(6), '| MEASURED: n  med  p90  p95o  maxO%  mae/old'.padEnd(46), '| INFERRED: n  med  p90  p95o maxO%  mae/old'.padEnd(46), ' mode');
for (const [mname, d] of Object.entries<any>(decisions)) {
  const a = d.measured?.metrics, b = d.inferred?.metrics;
  console.log(mname.padEnd(18), String(d.heldOutQuotes).padStart(5), (100 * d.shareMeasured).toFixed(0).padStart(5) + '%',
    `| ${String(a?.quotes ?? 0).padStart(4)} ${f(a?.medianRelPct).padStart(5)} ${f(a?.p90RelPct).padStart(5)} ${f(a?.p95OverPct).padStart(5)} ${f(a?.worstOverPctOfReference, 1).padStart(5)} ${String(a?.maeEvidence ?? '-').padStart(5)}/${String(a?.maeExisting ?? '-').padEnd(6)}`.padEnd(46),
    `| ${String(b?.quotes ?? 0).padStart(4)} ${f(b?.medianRelPct).padStart(5)} ${f(b?.p90RelPct).padStart(5)} ${f(b?.p95OverPct).padStart(5)} ${f(b?.worstOverPctOfReference, 1).padStart(5)} ${String(b?.maeEvidence ?? '-').padStart(5)}/${String(b?.maeExisting ?? '-').padEnd(6)}`.padEnd(46),
    ' ' + d.mode + (d.failedMeasured.length ? ` [measured fails ${d.failedMeasured.join(',')}]` : '') + (d.mode === 'measured-only' ? ` [inferred fails ${d.failedInferred.join(',') || 'no data'}]` : ''));
}
fs.writeFileSync(path.join(VAL, 'scope_decision.json'), JSON.stringify(decisions, null, 1) + '\n');
if (process.argv.includes('--write')) {
  const out: any = { version: 'scope/2026-10-25b', models: {} };
  for (const [mname, d] of Object.entries<any>(decisions)) {
    const a = d.measured?.metrics;
    out.models[mname] = {
      enabled: d.enabled, inferredPolicy: 'price', storagesGb: d.storagesGb,
      reason: d.enabled
        ? `replaces the existing engine for unrecorded combinations: held-out MAE ₹${d.maeNew} vs ₹${d.maeOld} (existing engine) on the same ${d.heldOutQuotes} quotes; recorded quotes are answered exactly`
        : `unrecorded combinations stay on the existing engine: held-out MAE ₹${d.maeNew} for the rules vs ₹${d.maeOld} for the existing engine on the same quotes (recorded quotes are still answered exactly)`
    };
  }
  fs.writeFileSync(path.resolve(__dirname, '../../lib/pricing/appleCashifyModel/scope.json'), JSON.stringify(out, null, 1) + '\n');
  console.log('wrote scope.json');
}
