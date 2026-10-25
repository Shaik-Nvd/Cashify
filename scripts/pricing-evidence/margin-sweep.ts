/**
 * What would it take to make the observed-payout limit hold more often? Analysis only: nothing here changes behaviour.
 *
 * The ceiling is only as reliable as the Cashify estimate it is computed from. One lever is a safety margin: price from
 * E x (1 - m) instead of E. This sweeps m on the held-out rows (shipped scope: evidence where enabled, the existing engine
 * elsewhere, inspection where the model refuses) and reports, for each m, how often the payout is still above the allowance
 * computed from the payout Cashify ACTUALLY paid, how big those breaches are, and what the customer gives up.
 * Two populations are kept apart: rows the evidence model prices, and rows still on the existing engine.
 *
 *   npx tsx scripts/pricing-evidence/margin-sweep.ts
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
const quantile = (xs: number[], p: number) => { const v = [...xs].sort((a, b) => a - b); return v.length ? v[Math.min(v.length - 1, Math.max(0, Math.ceil(p * v.length) - 1))] : null; };
const MARGINS = [0, 0.01, 0.02, 0.03, 0.05, 0.08, 0.1, 0.15];

const out: any = { note: 'analysis only; margins are not applied anywhere. Breach = payout above Cashify payout + min(8%, INR 2,000), measured on the payout Cashify actually paid.', protocols: {} };
for (const protocol of ['p1', 'p2', 'p3', 'p4']) {
  const rows = read(`rows_${protocol}.jsonl`).filter(r => r.observedOutcome === 'NUMERIC_QUOTE' && r.observedBase != null && r.observedSelling != null);
  const result: Record<string, any> = {};
  for (const population of ['evidence-served', 'existing-engine-served'] as const) for (const m of MARGINS) {
    let n = 0, breaches = 0, over100 = 0, over1000 = 0; const giveUp: number[] = []; const excess: number[] = [];
    for (const r of rows) {
      const observedPayout: number = r.observedPayout ?? r.observedSelling - cashifyProcessingFee(r.observedSelling);
      const entry = SCOPE[r.model];
      const inScope = !!entry?.enabled;
      const existing = r.existing.kind === 'PRICE' ? r.existing.price : null;
      let equivalent: number | null; let fallback = false;
      if (!inScope) { equivalent = existing; fallback = true; }
      else if (r.proposed.kind === 'NO_OFFER') equivalent = null;
      else if (r.proposed.kind !== 'PRICE') { equivalent = existing; fallback = true; }
      else if (r.confidence === 'inferred' && entry.inferredPolicy === 'inspect') equivalent = null;
      else if (r.confidence === 'inferred' && entry.inferredPolicy === 'legacy') { equivalent = existing; fallback = true; }
      else equivalent = r.proposed.price;
      if (equivalent == null || (population === 'existing-engine-served') !== fallback) continue;
      const reduced = Math.floor(equivalent * (1 - m));
      const c = applyPayoutCeiling({ quote: applyCompetitorUplift(r.reference, reduced), cashifyHeadlineEquivalent: headlineFromBase(reduced) });
      if (c.status === 'inspection') continue;
      const base = applyPayoutCeiling({ quote: applyCompetitorUplift(r.reference, equivalent), cashifyHeadlineEquivalent: headlineFromBase(equivalent) });
      const payout = customerPayout(c.quote, false).payout;
      n++;
      const over = payout - maxPayoutForCashifyPayout(observedPayout);
      if (over > 0) { breaches++; excess.push(over); if (over > 100) over100++; if (over > 1000) over1000++; }
      giveUp.push(base.status === 'ok' ? customerPayout(base.quote, false).payout - payout : 0);
    }
    result[`${population} / margin ${(m * 100).toFixed(0)}%`] = {
      priced: n, breachPct: n ? +(100 * breaches / n).toFixed(1) : null, over100, over1000,
      p95Excess: quantile(excess, 0.95), maxExcess: excess.length ? Math.max(...excess) : null,
      medianGiveUpRupees: quantile(giveUp, 0.5), meanGiveUpRupees: giveUp.length ? Math.round(giveUp.reduce((a, b) => a + b, 0) / giveUp.length) : null,
    };
  }
  out.protocols[protocol] = result;
}
fs.writeFileSync(path.join(VAL, 'margin_sweep.json'), JSON.stringify(out, null, 1) + '\n');
for (const [p, s] of Object.entries<any>(out.protocols)) {
  console.log(`\n== ${p} ==`);
  for (const [k, v] of Object.entries<any>(s)) console.log(`${k.padEnd(40)} priced=${String(v.priced).padStart(4)} breach=${String(v.breachPct).padStart(5)}% >100=${String(v.over100).padStart(4)} >1000=${String(v.over1000).padStart(3)} p95excess=${v.p95Excess} max=${v.maxExcess} | customer gives up median=${v.medianGiveUpRupees} mean=${v.meanGiveUpRupees}`);
}
