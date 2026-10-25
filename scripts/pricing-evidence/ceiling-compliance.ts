/**
 * The owner's rule, tested against REAL Cashify payouts on held-out quotes:
 *   customer payout <= Cashify payout + min(8% of Cashify payout, INR 2,000)
 *
 * For every held-out quote the engine's Cashify-equivalent (a prediction made without seeing that quote) is turned into the
 * price the customer would be shown and the payout they would receive, then compared with the payout Cashify actually paid in
 * the source file. Three scenarios, with and without the first-time coupon:
 *   existing as shipped      today's engine, uplift only (no ceiling, full INR 299 coupon)
 *   existing + ceiling       today's engine with the new payout ceiling
 *   evidence + ceiling       the evidence-calibrated model with the payout ceiling (what this change ships)
 * A breach is a payout above the allowed maximum measured against the TRUE Cashify payout, so an engine that mis-estimates
 * Cashify shows up here even when it respects the ceiling against its own estimate.
 *
 *   npx tsx scripts/pricing-evidence/ceiling-compliance.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { applyCompetitorUplift } from '../../lib/pricingCalculator';
import { applyPayoutCeiling, cashifyProcessingFee, headlineFromBase, maxPayoutForCashifyPayout } from '../../lib/pricing/payoutCeiling';
import { customerPayout } from '../../lib/pricing/payout';
import { EVIDENCE_DIR } from './evidenceLib';
import scopeJson from '../../lib/pricing/appleCashifyModel/scope.json';

const SCOPE = (scopeJson as unknown as { models: Record<string, { enabled: boolean; inferredPolicy: string; storagesGb: number[] }> }).models;
const gbOfLabel = (s: string) => { const m = s.match(/(\d+)(GB|TB)/i); return m ? Number(m[1]) * (m[2].toUpperCase() === 'TB' ? 1024 : 1) : 0; };

const VAL = path.join(EVIDENCE_DIR, 'validation');
const read = (f: string) => fs.existsSync(path.join(VAL, f)) ? fs.readFileSync(path.join(VAL, f), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];

type Scenario = 'existingAsShipped' | 'existingWithCeiling' | 'evidenceWithCeiling' | 'shippedScope';
const out: any = { note: 'held-out predictions only; breach = payout above Cashify payout + min(8%, INR 2,000) measured against the REAL Cashify payout', protocols: {} };

for (const protocol of ['p1', 'p2', 'p3', 'p4']) {
  const rows = read(`rows_${protocol}.jsonl`).filter(r => r.observedOutcome === 'NUMERIC_QUOTE' && r.observedBase != null && r.observedSelling != null);
  const stats: Record<string, any> = {};
  const add = (key: string, row: any, payout: number, trueCashifyPayout: number) => {
    const s = (stats[key] ??= { n: 0, breaches: 0, over100: 0, over1000: 0, over1pct: 0, over3pct: 0, extraPct: [] as number[], worst: null as any });
    const allowed = maxPayoutForCashifyPayout(trueCashifyPayout);
    s.n++;
    const extra = payout - trueCashifyPayout;
    s.extraPct.push((100 * extra) / trueCashifyPayout);
    const excess = payout - allowed;
    if (excess > 100) s.over100++;
    if (excess > 1000) s.over1000++;
    if (excess > 0.01 * trueCashifyPayout) s.over1pct++;
    if (excess > 0.03 * trueCashifyPayout) s.over3pct++;
    if (payout > allowed) {
      s.breaches++;
      if (!s.worst || payout - allowed > s.worst.over) s.worst = { over: payout - allowed, source: row.source, model: row.model, storage: row.storage, answers: row.deviations.join(','), payout, trueCashifyPayout, allowed };
    }
  };
  for (const r of rows) {
    // the payout Cashify actually paid for this condition (selling price minus its processing fee); recorded in the file, else the observed fee schedule
    const trueP = r.observedPayout ?? r.observedSelling - cashifyProcessingFee(r.observedSelling);
    const ref = r.reference;
    const scenarios: [Scenario, number | null, (q: number, e: number) => { quote: number; headroom: number }][] = [
      ['existingAsShipped', r.existing.kind === 'PRICE' ? r.existing.price : null, (q) => ({ quote: q, headroom: 299 })],
      ['existingWithCeiling', r.existing.kind === 'PRICE' ? r.existing.price : null, (q, e) => { const c = applyPayoutCeiling({ quote: q, cashifyHeadlineEquivalent: headlineFromBase(e) }); return { quote: c.quote, headroom: c.couponHeadroom }; }],
      ['evidenceWithCeiling', r.proposed.kind === 'PRICE' ? r.proposed.price : null, (q, e) => { const c = applyPayoutCeiling({ quote: q, cashifyHeadlineEquivalent: headlineFromBase(e) }); return { quote: c.quote, headroom: c.couponHeadroom }; }],
    ];
    // what ships: scope.json decides, per model/variant and per quote, between the evidence model, the existing engine and inspection
    const entry = SCOPE[r.model];
    const inScope = !!entry?.enabled && entry.storagesGb.includes(gbOfLabel(r.storage));
    let shipped: number | null = r.existing.kind === 'PRICE' ? r.existing.price : null;
    let inspected = false;
    if (inScope) {
      if (r.proposed.kind === 'PRICE') {
        if (r.confidence === 'inferred' && entry.inferredPolicy === 'inspect') { shipped = null; inspected = true; }
        else if (r.confidence === 'inferred' && entry.inferredPolicy === 'legacy') shipped = r.existing.kind === 'PRICE' ? r.existing.price : null;
        else shipped = r.proposed.price;
      } else if (r.proposed.kind === 'NO_OFFER') { shipped = null; inspected = true; }
    }
    (stats['shippedScope / inspections'] ??= { n: 0, breaches: 0, over100: 0, over1000: 0, over1pct: 0, over3pct: 0, extraPct: [0], worst: null }).n += inspected ? 1 : 0;
    scenarios.push(['shippedScope', shipped, (q, e) => { const c = applyPayoutCeiling({ quote: q, cashifyHeadlineEquivalent: headlineFromBase(e) }); return { quote: c.quote, headroom: c.couponHeadroom }; }]);
    for (const [name, equivalent, shape] of scenarios) {
      if (equivalent == null) continue;
      const shown = applyCompetitorUplift(ref, equivalent);
      const { quote, headroom } = shape(shown, equivalent);
      add(`${name} / no coupon`, r, customerPayout(quote, false, name === 'existingAsShipped' ? undefined : headroom).payout, trueP);
      add(`${name} / coupon claimed`, r, customerPayout(quote, true, name === 'existingAsShipped' ? undefined : headroom).payout, trueP);
    }
  }
  const q = (xs: number[], p: number) => { const v = [...xs].sort((a, b) => a - b); return v.length ? v[Math.min(v.length - 1, Math.max(0, Math.ceil(p * v.length) - 1))] : NaN; };
  out.protocols[protocol] = Object.fromEntries(Object.entries(stats).map(([k, s]) => [k, {
    quotes: s.n, breaches: s.breaches, breachPct: +(100 * s.breaches / s.n).toFixed(2), over100: s.over100, over1000: s.over1000, over1pctOfCashifyPayout: s.over1pct, over3pctOfCashifyPayout: s.over3pct, medianExtraPct: +q(s.extraPct, 0.5).toFixed(2), p95ExtraPct: +q(s.extraPct, 0.95).toFixed(2), worstBreach: s.worst,
  }]));
}
fs.writeFileSync(path.join(VAL, 'ceiling_compliance.json'), JSON.stringify(out, null, 1) + '\n');
for (const [p, s] of Object.entries<any>(out.protocols)) {
  if (!Object.keys(s).length) continue;
  console.log(`\n== ${p} ==`);
  for (const [k, v] of Object.entries<any>(s)) console.log(`${k.padEnd(40)} quotes=${String(v.quotes).padStart(5)} breaches=${String(v.breaches).padStart(4)} (${String(v.breachPct).padStart(5)}%) by >Rs100: ${String(v.over100).padStart(4)}, >Rs1000: ${String(v.over1000).padStart(4)}, >1%: ${String(v.over1pctOfCashifyPayout).padStart(4)}, >3%: ${String(v.over3pctOfCashifyPayout).padStart(4)} | median extra=${String(v.medianExtraPct).padStart(6)}% p95 extra=${String(v.p95ExtraPct).padStart(7)}%`);
}
