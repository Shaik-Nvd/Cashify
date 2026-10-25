/**
 * SUPPLIED-CASE RECONCILIATION (not a validation of the rules - these cases ARE the recorded evidence).
 *
 * Every priced Cashify quotation the team supplied is sent through the production quote path at the Get Upto it was collected
 * against: the evidence entry point (exact match, else rules), then the existing uplift, then the payout ceiling and the INR 99
 * fee, with and without the first-time coupon. For each case it checks
 *   1. the Cashify-equivalent before uplift equals the recorded base price
 *   2. the customer payout is within recorded Cashify payout + min(8%, INR 2,000)
 * Generalisation to combinations that were NOT recorded is measured separately (validation/summary.json, held-out protocols).
 *
 *   npx tsx scripts/pricing-evidence/reconcile-supplied.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { applyCompetitorUplift } from '../../lib/pricingCalculator';
import { appleEvidenceQuote } from '../../lib/pricing/appleCashifyModel';
import { InspectionRequiredError } from '../../lib/pricing/inspectionRequired';
import { applyPayoutCeiling, cashifyProcessingFee, headlineFromBase, maxPayoutForCashifyPayout } from '../../lib/pricing/payoutCeiling';
import { customerPayout } from '../../lib/pricing/payout';
import { evidenceModelKey, storageGbOf } from '../../lib/pricing/appleCashifyModel/scope';
import { EVIDENCE_DIR, hasUnknownInput, loadMeasurements, toDiagnostics } from './evidenceLib';

interface Case { id: string; origin: string; model: string; gb: number; date: string | null; g0: number; base: number | null; payout: number | null; diagnostics: any }
const cases: Case[] = [];
for (const m of loadMeasurements()) {
  if (hasUnknownInput(m)) continue;
  cases.push({ id: `${m.archive}::${m.case_id}`, origin: 'archive', model: m.model_key, gb: m.storage_gb, date: m.observed_date, g0: m.variant_get_upto, base: m.outcome === 'NUMERIC_QUOTE' ? m.base : null, payout: m.payout, diagnostics: toDiagnostics(m, 'none') });
}
const root = path.resolve(__dirname, '../..');
const FIX = path.join(root, 'scripts/pricing/fixtures');
for (const r of JSON.parse(fs.readFileSync(path.join(FIX, 'exact-captures-2026-10-10.json'), 'utf8')).rows) {
  const gb = storageGbOf(r.storage); if (gb == null) continue;
  cases.push({ id: r.id, origin: 'exact-captures', model: evidenceModelKey(r.model), gb, date: String(r.observedAt).slice(0, 10), g0: r.getUpto, base: r.sellingPrice + 20, payout: null, diagnostics: r.diagnostics });
}
for (const r of JSON.parse(fs.readFileSync(path.join(FIX, 'team-workbook-development-cases-2026-10-02.json'), 'utf8'))) {
  if (r.brand !== 'Apple') continue;
  const gb = storageGbOf(r.storage); if (gb == null) continue;
  cases.push({ id: `workbook::${r.caseId}`, origin: 'tester-workbook', model: evidenceModelKey(r.model), gb, date: '2026-10-02', g0: r.reference, base: r.observed + 20, payout: null, diagnostics: r.diagnostics });
}

// Records that another supplied record of the same configuration and the same Get Upto contradicts (the hand-entered tester workbook against an
// archive/capture): they are reported, not counted as unambiguous cases.
const conflictFile = JSON.parse(fs.readFileSync(path.join(EVIDENCE_DIR, 'exact_conflicts.json'), 'utf8'));
const overruled = new Set<string>([...conflictFile.workbookOverruled, ...conflictFile.priceAboveOwnGetUpto].map((o: any) => String(o.source).split('::').pop()));
const rows: any[] = [];
for (const c of cases) {
  const row: any = { superseded: c.origin === 'tester-workbook' && overruled.has(c.id.replace('workbook::', '')), id: c.id, origin: c.origin, model: c.model, storageGb: c.gb, date: c.date, getUpto: c.g0, recordedBase: c.base };
  let equivalent: number | null = null;
  try {
    const q = appleEvidenceQuote(c.model, `${c.gb}GB`, c.g0, c.diagnostics);
    if (!q) row.route = 'NOT_COVERED';
    else { row.route = q.source; equivalent = q.outcome.price; row.confidence = q.outcome.confidence; }
  } catch (e) { if (e instanceof InspectionRequiredError) { row.route = 'INSPECTION'; row.reason = e.reason; } else throw e; }
  row.equivalent = equivalent;
  if (c.base == null) row.outcomeMatch = row.route === 'INSPECTION'; // recorded no-offer must stay an explicit no-offer
  else if (equivalent != null) row.outcomeMatch = equivalent === c.base;
  else row.outcomeMatch = false;
  if (c.base != null && equivalent != null) {
    const recordedSelling = c.base - 20;
    const recordedPayout = c.payout ?? recordedSelling - cashifyProcessingFee(recordedSelling);
    const allowed = maxPayoutForCashifyPayout(recordedPayout);
    const shown = applyCompetitorUplift(c.g0, equivalent);
    const ceil = applyPayoutCeiling({ quote: shown, cashifyHeadlineEquivalent: headlineFromBase(equivalent) });
    if (ceil.status === 'ok') {
      row.quote = ceil.quote; row.recordedPayout = recordedPayout; row.allowedPayout = allowed;
      row.payoutNoCoupon = customerPayout(ceil.quote, false).payout;
      row.payoutCoupon = customerPayout(ceil.quote, true, ceil.couponHeadroom).payout;
      row.breachNoCoupon = row.payoutNoCoupon > allowed; row.breachCoupon = row.payoutCoupon > allowed;
      row.extraOverCashify = row.payoutNoCoupon - recordedPayout;
    } else row.ceiling = ceil.inspectionReason;
  }
  rows.push(row);
}
const contradicted = rows.filter(r => r.superseded && !r.outcomeMatch);
const priced = rows.filter(r => r.recordedBase != null && !contradicted.includes(r));
const exactMatches = priced.filter(r => r.outcomeMatch);
const noOffers = rows.filter(r => r.recordedBase == null);
const summary = {
  cases: rows.length, contradictedByAnotherSuppliedRecord: contradicted.length, priced: priced.length, recordedNoOffer: noOffers.length,
  pricedExactMatches: exactMatches.length, pricedMismatches: priced.length - exactMatches.length,
  noOfferKeptExplicit: noOffers.filter(r => r.outcomeMatch).length,
  notCovered: priced.filter(r => r.route === 'NOT_COVERED').length,
  observedCeilingBreaches: { noCoupon: priced.filter(r => r.breachNoCoupon).length, withCoupon: priced.filter(r => r.breachCoupon).length, evaluated: priced.filter(r => r.payoutNoCoupon != null).length },
  routes: priced.reduce((a: any, r) => ((a[r.route] = (a[r.route] ?? 0) + 1), a), {}),
};
const mismatches = priced.filter(r => !r.outcomeMatch).map(r => ({ id: r.id, model: r.model, storageGb: r.storageGb, date: r.date, getUpto: r.getUpto, recorded: r.recordedBase, got: r.equivalent, route: r.route, reason: r.reason }));
fs.writeFileSync(path.join(EVIDENCE_DIR, 'validation', 'supplied_case_reconciliation.json'), JSON.stringify({ summary, mismatches, contradicted: contradicted.map(r => ({ id: r.id, model: r.model, storageGb: r.storageGb, date: r.date, getUpto: r.getUpto, recordedByThisCase: r.recordedBase, servedInstead: r.equivalent, route: r.route })), rows }, null, 1) + '\n');
console.log(JSON.stringify(summary, null, 1));
for (const m of mismatches.slice(0, 40)) console.log('MISMATCH', JSON.stringify(m).slice(0, 330));
console.log('breaches:', priced.filter(r => r.breachNoCoupon || r.breachCoupon).slice(0, 10).map(r => `${r.model} ${r.storageGb} ${r.id.slice(-30)} payout ${r.payoutNoCoupon}/${r.payoutCoupon} allowed ${r.allowedPayout}`).join('\n'));
