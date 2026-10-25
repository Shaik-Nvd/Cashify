/**
 * Two different questions, kept apart on purpose:
 *
 *   A. ESTIMATED-limit compliance  - is the customer payout within min(8%, INR 2,000) of the payout implied by the ENGINE'S
 *      OWN Cashify-equivalent? This is what the ceiling function enforces; it is a property of the code and must be 100%.
 *   B. OBSERVED-payout compliance  - is the customer payout within that allowance of the payout Cashify ACTUALLY paid in
 *      the held-out source record? This is what the business rule is about, and it is only as good as the estimate.
 *
 * Satisfying A says nothing about B. Every held-out quote here was predicted without seeing its own record.
 *
 * Scenarios (per protocol, with and without the first-time coupon):
 *   existingAsShipped  today's engine, uplift only (no ceiling, full INR 299 coupon)
 *   existingCeiling    today's engine with the ceiling
 *   evidenceCeiling    the evidence model priced everywhere it can, with the ceiling (no scope gating)
 *   shippedScope       what scope.json actually serves: evidence where enabled, inspection for unmeasured combinations
 *                      on measured-only models, the existing engine elsewhere, then the ceiling
 *
 *   npx tsx scripts/pricing-evidence/ceiling-compliance.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { applyCompetitorUplift } from '../../lib/pricingCalculator';
import { applyPayoutCeiling, cashifyProcessingFee, headlineFromBase, maxPayoutForCashifyPayout, cashifyPayout } from '../../lib/pricing/payoutCeiling';
import { customerPayout } from '../../lib/pricing/payout';
import { EVIDENCE_DIR } from './evidenceLib';
import scopeJson from '../../lib/pricing/appleCashifyModel/scope.json';

const SCOPE = (scopeJson as unknown as { models: Record<string, { enabled: boolean; inferredPolicy: string; storagesGb: number[] }> }).models;
const gbOfLabel = (s: string) => { const m = s.match(/(\d+)(GB|TB)/i); return m ? Number(m[1]) * (m[2].toUpperCase() === 'TB' ? 1024 : 1) : 0; };

const VAL = path.join(EVIDENCE_DIR, 'validation');
const read = (f: string) => fs.existsSync(path.join(VAL, f)) ? fs.readFileSync(path.join(VAL, f), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
const quantile = (xs: number[], p: number) => { const v = [...xs].sort((a, b) => a - b); return v.length ? v[Math.min(v.length - 1, Math.max(0, Math.ceil(p * v.length) - 1))] : null; };
const round2 = (x: number | null) => x == null ? null : +x.toFixed(2);
const TOP = 25;

type Scenario = 'existingAsShipped' | 'existingCeiling' | 'evidenceCeiling' | 'shippedScope';
const SCENARIOS: Scenario[] = ['existingAsShipped', 'existingCeiling', 'evidenceCeiling', 'shippedScope'];

interface Acc {
  quotes: number; inspection: number; fallbackExisting: number;
  estimatedBreaches: number;
  observedBreaches: number; observedOver100: number; observedOver1000: number; observedOver1pct: number; observedOver3pct: number;
  extraPct: number[]; excessRupees: number[]; worst: any[];
}
const fresh = (): Acc => ({ quotes: 0, inspection: 0, fallbackExisting: 0, estimatedBreaches: 0, observedBreaches: 0, observedOver100: 0, observedOver1000: 0, observedOver1pct: 0, observedOver3pct: 0, extraPct: [], excessRupees: [], worst: [] });

const out: any = {
  note: 'held-out predictions only. estimated = against the engine\'s own Cashify-equivalent (enforced by code); observed = against the payout Cashify actually paid in the source record (the business rule). Satisfying the first does not imply the second.',
  protocols: {},
};

for (const protocol of ['p1', 'p2', 'p3', 'p4']) {
  const rows = read(`rows_${protocol}.jsonl`).filter(r => r.observedOutcome === 'NUMERIC_QUOTE' && r.observedBase != null && r.observedSelling != null);
  const acc: Record<string, Acc> = {};
  const bucket = (scenario: Scenario, coupon: boolean) => (acc[`${scenario} / ${coupon ? 'coupon claimed' : 'no coupon'}`] ??= fresh());
  for (const r of rows) {
    const observedPayout: number = r.observedPayout ?? r.observedSelling - cashifyProcessingFee(r.observedSelling);
    const observedMax = maxPayoutForCashifyPayout(observedPayout);
    const entry = SCOPE[r.model];
    const inScope = !!entry?.enabled;
    const existing: number | null = r.existing.kind === 'PRICE' ? r.existing.price : null;
    const evidence: number | null = r.proposed.kind === 'PRICE' ? r.proposed.price : null;
    // 'equivalent' is the Cashify-equivalent (base) the quote is built from; null means the request goes to inspection
    let shipped: { equivalent: number | null; fallback: boolean };
    if (!inScope) shipped = { equivalent: existing, fallback: true };
    else if (r.proposed.kind === 'NO_OFFER') shipped = { equivalent: null, fallback: false };
    else if (r.proposed.kind !== 'PRICE') shipped = { equivalent: existing, fallback: true };
    else if (r.confidence === 'inferred' && entry.inferredPolicy === 'inspect') shipped = { equivalent: null, fallback: false };
    else if (r.confidence === 'inferred' && entry.inferredPolicy === 'legacy') shipped = { equivalent: existing, fallback: true };
    else shipped = { equivalent: evidence, fallback: false };
    const eq: Record<Scenario, { equivalent: number | null; fallback: boolean }> = {
      existingAsShipped: { equivalent: existing, fallback: false }, existingCeiling: { equivalent: existing, fallback: false },
      evidenceCeiling: { equivalent: evidence, fallback: false }, shippedScope: shipped,
    };
    for (const scenario of SCENARIOS) for (const coupon of [false, true]) {
      const a = bucket(scenario, coupon);
      a.quotes++;
      const { equivalent, fallback } = eq[scenario];
      if (equivalent == null) { a.inspection++; continue; }
      const shown = applyCompetitorUplift(r.reference, equivalent);
      let payout: number;
      const estimatedMax = maxPayoutForCashifyPayout(cashifyPayout(headlineFromBase(equivalent)));
      if (scenario === 'existingAsShipped') payout = customerPayout(shown, coupon).payout;
      else {
        const c = applyPayoutCeiling({ quote: shown, cashifyHeadlineEquivalent: headlineFromBase(equivalent) });
        if (c.status === 'inspection') { a.inspection++; continue; }
        payout = customerPayout(c.quote, coupon, c.couponHeadroom).payout;
      }
      if (fallback) a.fallbackExisting++;
      // A: against the engine's own estimate
      if (payout > estimatedMax) a.estimatedBreaches++;
      // B: against what Cashify actually paid
      const excess = payout - observedMax;
      a.extraPct.push((100 * (payout - observedPayout)) / observedPayout);
      if (excess > 0) {
        a.observedBreaches++; a.excessRupees.push(excess);
        if (excess > 100) a.observedOver100++;
        if (excess > 1000) a.observedOver1000++;
        if (excess > 0.01 * observedPayout) a.observedOver1pct++;
        if (excess > 0.03 * observedPayout) a.observedOver3pct++;
        if (scenario === 'shippedScope' && !coupon) {
          a.worst.push({
            excessRupees: excess, excessPctOfCashifyPayout: round2(100 * excess / observedPayout), model: r.model, storage: r.storage, date: r.date, source: r.source,
            answers: r.deviations, confidence: r.confidence, getUpto: r.reference, observedBase: r.observedBase, observedSelling: r.observedSelling, observedPayout,
            engineEquivalent: equivalent, engineErrorVsObservedBase: equivalent - r.observedBase, customerPayout: payout, allowedPayout: observedMax,
            usedExistingEngine: fallback, breakdown: r.breakdown ?? null,
          });
        }
      }
    }
  }
  const summarize = (a: Acc) => {
    const priced = a.quotes - a.inspection;
    return {
      quotes: a.quotes, priced, inspection: a.inspection, inspectionPct: round2(100 * a.inspection / a.quotes), servedByExistingEngine: a.fallbackExisting,
      estimated: { breaches: a.estimatedBreaches, breachPct: priced ? round2(100 * a.estimatedBreaches / priced) : null },
      observed: {
        breaches: a.observedBreaches, breachPct: priced ? round2(100 * a.observedBreaches / priced) : null,
        over100: a.observedOver100, over1000: a.observedOver1000, over1pctOfCashifyPayout: a.observedOver1pct, over3pctOfCashifyPayout: a.observedOver3pct,
        medianExtraPct: round2(quantile(a.extraPct, 0.5)), p95ExtraPct: round2(quantile(a.extraPct, 0.95)), p99ExtraPct: round2(quantile(a.extraPct, 0.99)),
        maxExtraPct: a.extraPct.length ? round2(Math.max(...a.extraPct)) : null,
        medianExcessRupees: quantile(a.excessRupees, 0.5), p95ExcessRupees: quantile(a.excessRupees, 0.95), maxExcessRupees: a.excessRupees.length ? Math.max(...a.excessRupees) : null,
      },
    };
  };
  out.protocols[protocol] = {
    scenarios: Object.fromEntries(Object.entries(acc).map(([k, a]) => [k, summarize(a)])),
    worstShipped: (acc['shippedScope / no coupon']?.worst ?? []).sort((x, y) => y.excessRupees - x.excessRupees).slice(0, TOP),
  };
  fs.writeFileSync(path.join(VAL, `ceiling_breaches_${protocol}.jsonl`), (acc['shippedScope / no coupon']?.worst ?? []).sort((x, y) => y.excessRupees - x.excessRupees).map(w => JSON.stringify(w)).join('\n') + '\n');
}
fs.writeFileSync(path.join(VAL, 'ceiling_compliance.json'), JSON.stringify(out, null, 1) + '\n');
for (const [p, s] of Object.entries<any>(out.protocols)) {
  console.log(`\n== ${p} ==`);
  for (const [k, v] of Object.entries<any>(s.scenarios)) {
    console.log(`${k.padEnd(40)} priced=${String(v.priced).padStart(4)}/${String(v.quotes).padStart(4)} inspect=${String(v.inspectionPct).padStart(5)}% | A est.breach=${String(v.estimated.breaches).padStart(3)} | B observed breach=${String(v.observed.breaches).padStart(4)} (${v.observed.breachPct}%) >Rs100=${v.observed.over100} >Rs1000=${v.observed.over1000} >3%=${v.observed.over3pctOfCashifyPayout} | extra med=${v.observed.medianExtraPct}% p95=${v.observed.p95ExtraPct}% p99=${v.observed.p99ExtraPct}% max=${v.observed.maxExtraPct}%`);
  }
}
