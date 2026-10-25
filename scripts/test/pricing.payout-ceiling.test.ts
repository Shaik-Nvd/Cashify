/**
 * Payout ceiling (owner requirement, 2026-10-25):
 *   customer payout <= Cashify-equivalent payout + min(8% of that payout, INR 2,000)
 * after the uplift, the INR 99 fee, rounding and the first-time coupon.
 *
 * Run: npx tsx scripts/test/pricing.payout-ceiling.test.ts   (no database needed)
 */
import assert from 'node:assert/strict';
import { applyCompetitorUplift, DiagnosticsType } from '../../lib/pricingCalculator';
import { PERFECT_CONDITION_DIAGNOSTICS } from '../../lib/pricing/engine';
import { createPricingService } from '../../lib/pricing/pricingService';
import { buildLeadAnswers, customerPayout, FIRST_TIME_COUPON_BONUS } from '../../lib/pricing/payout';
import {
  applyPayoutCeiling, cashifyPayout, cashifyProcessingFee, headlineFromBase, maxPayoutForCashifyPayout, PAYOUT_CEILING_POLICY,
} from '../../lib/pricing/payoutCeiling';
import { deviceKey, ReferencePriceRecord } from '../../lib/referencePricing/types';

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  try { await fn(); console.log(`  PASS  ${name}`); passed++; } catch (err: any) { console.log(`  FAIL  ${name}: ${err.message}`); failed++; }
}

/** The tier the existing uplift would pick for a reference price (documented, unchanged). */
const tierFor = (reference: number) => (reference <= 20000 ? 0.08 : reference <= 50000 ? 0.06 : 0.04);

async function run() {
  console.log('\nSuite H - payout ceiling (max extra = min(8%, INR 2,000) of the Cashify-equivalent payout)\n');

  await test("the owner's worked examples: INR 10,000 -> 10,800 and INR 50,000 -> 52,000", () => {
    assert.equal(maxPayoutForCashifyPayout(10000), 10800);
    assert.equal(maxPayoutForCashifyPayout(50000), 52000);
    assert.equal(maxPayoutForCashifyPayout(25000), 27000); // 8% = 2,000 exactly
    assert.equal(maxPayoutForCashifyPayout(60000), 62000); // the INR 2,000 cap binds, not 8%
    assert.equal(maxPayoutForCashifyPayout(1131), 1131 + 90);
  });

  await test('existing lower tiers are untouched and never exceed 8% (documented selection: by Get Upto price band)', () => {
    for (const reference of [1200, 5000, 20000, 20001, 33000, 50000, 50001, 90000, 165000]) {
      const q = applyCompetitorUplift(reference, reference);
      // the extra is exactly tier x reference, capped at 2,000 (rounded to whole rupees) - and never above 8%
      assert.equal(q, Math.round(reference + Math.min(reference * tierFor(reference), 2000)), `tier for ${reference}`);
      assert.ok(tierFor(reference) <= PAYOUT_CEILING_POLICY.maxRate);
      assert.ok(q - reference <= Math.min(reference * PAYOUT_CEILING_POLICY.maxRate, 2000) + 1, `uplift for ${reference} within 8% / 2,000`);
    }
    assert.deepEqual([20000, 20001, 50000, 50001].map(tierFor), [0.08, 0.06, 0.06, 0.04]);
  });

  await test('Cashify fee schedule: 49 up to 2,880; 69 for 4,090-4,190; 99 elsewhere (gaps are conservative)', () => {
    assert.equal(cashifyProcessingFee(1180), 49);
    assert.equal(cashifyProcessingFee(2880), 49);
    assert.equal(cashifyProcessingFee(4090), 69);
    assert.equal(cashifyProcessingFee(4190), 69);
    assert.equal(cashifyProcessingFee(5760), 99);
    assert.equal(cashifyProcessingFee(164980), 99);
    assert.equal(cashifyPayout(164980), 164881); // matches the recorded Cashify payout
    assert.equal(cashifyPayout(1180), 1131);
  });

  await test('exhaustive sweep: payout (with and without coupon) never exceeds the ceiling, for every uplift tier', () => {
    let reduced = 0; let checked = 0;
    for (let base = 1200; base <= 200000; base += base < 30000 ? 37 : 411) {
      const uplifted = applyCompetitorUplift(base, base);
      const c = applyPayoutCeiling({ quote: uplifted, cashifyHeadlineEquivalent: headlineFromBase(base) });
      assert.ok(c.quote <= uplifted, 'ceiling never raises a quote');
      assert.ok(c.quote >= base - 1, `quote ${c.quote} not below the Cashify-equivalent ${base} (tier ${tierFor(base)})`);
      const ceilingPayout = maxPayoutForCashifyPayout(cashifyPayout(headlineFromBase(base)));
      assert.ok(customerPayout(c.quote, false).payout <= ceilingPayout, `no coupon, base ${base}`);
      assert.ok(customerPayout(c.quote, true, c.couponHeadroom).payout <= ceilingPayout, `coupon, base ${base}: ${customerPayout(c.quote, true, c.couponHeadroom).payout} > ${ceilingPayout}`);
      assert.ok(c.couponHeadroom >= 0 && c.couponHeadroom <= FIRST_TIME_COUPON_BONUS);
      // the ceiling is the binding limit when the headroom is smaller than the coupon: the payout then sits AT the ceiling or one rupee under
      if (c.couponHeadroom < FIRST_TIME_COUPON_BONUS) assert.ok(ceilingPayout - customerPayout(c.quote, true, c.couponHeadroom).payout <= 1);
      if (c.reduced) reduced++;
      checked++;
    }
    assert.ok(checked > 1000, `checked ${checked}`);
    assert.ok(reduced > 0, 'at least the 8% tier is trimmed by the IMEI-fee / fee difference');
  });

  await test('WITHOUT the clamp the coupon would breach the ceiling (the defect this closes)', () => {
    const base = 10000;
    const uplifted = applyCompetitorUplift(base, base); // 10,800
    const ceilingPayout = maxPayoutForCashifyPayout(cashifyPayout(headlineFromBase(base))); // 9,881 + 790 = 10,671
    assert.ok(customerPayout(uplifted, true).payout > ceilingPayout, 'legacy payout with the full coupon exceeds the ceiling');
    const c = applyPayoutCeiling({ quote: uplifted, cashifyHeadlineEquivalent: headlineFromBase(base) });
    assert.ok(customerPayout(c.quote, true, c.couponHeadroom).payout <= ceilingPayout);
  });

  await test('big-ticket devices: the INR 2,000 cap binds and a coupon still fits when there is room', () => {
    const base = 165000; // iPhone 18 Pro Max 2 TB
    const c = applyPayoutCeiling({ quote: applyCompetitorUplift(base, base), cashifyHeadlineEquivalent: headlineFromBase(base) });
    assert.equal(maxPayoutForCashifyPayout(cashifyPayout(headlineFromBase(base))), 164881 + 2000);
    assert.ok(customerPayout(c.quote, false).payout <= 164881 + 2000);
    // measured Cashify payout for the flawless 18 Pro Max 2 TB is 164,881; Fhoneify may pay at most 166,881
    assert.ok(customerPayout(c.quote, true, c.couponHeadroom).payout <= 166881);
  });

  await test('a payout that is already inside the ceiling is left unchanged', () => {
    const c = applyPayoutCeiling({ quote: 30000, cashifyHeadlineEquivalent: 30000 });
    assert.equal(c.quote, 30000);
    assert.equal(c.reduced, false);
  });

  await test('customerPayout is backward compatible without a headroom argument (full coupon)', () => {
    assert.equal(customerPayout(10000, true).couponBonus, FIRST_TIME_COUPON_BONUS);
    assert.equal(customerPayout(10000, true, 0).couponBonus, 0);
    assert.equal(customerPayout(10000, true, 120).couponBonus, 120);
    assert.equal(customerPayout(10000, true, 9999).couponBonus, FIRST_TIME_COUPON_BONUS);
    assert.equal(customerPayout(10000, false, 200).couponBonus, 0);
  });

  await test('the policy constants are the owner-stated ones', () => {
    assert.equal(PAYOUT_CEILING_POLICY.maxRate, 0.08);
    assert.equal(PAYOUT_CEILING_POLICY.maxExtraRupees, 2000);
  });

  // ---------- through the real quote service (in-memory reference prices, no database) ----------
  class Repo {
    records = new Map<string, ReferencePriceRecord>();
    async get(key: string) { return this.records.get(key) ?? null; }
    async listAll() { return [...this.records.values()]; }
    async upsert(): Promise<never> { throw new Error('read-only'); }
  }
  const cases: [string, string, string, number][] = [
    ['Apple', 'Apple iPhone 14', '128GB', 27780],
    ['Apple', 'Apple iPhone 15 Pro', '512GB', 68160],
    ['Apple', 'Apple iPhone 16', '512GB', 55150],
    ['Samsung', 'Samsung Galaxy S24 5G', '8 GB/256 GB', 34710],
    ['Oppo', 'OPPO Reno11 5G', '8 GB/256 GB', 16670],
    ['Xiaomi', 'Xiaomi Redmi Note 13 Pro 5G', '8 GB/256 GB', 13550],
  ];
  const at = new Date().toISOString();
  const repo = new Repo();
  for (const [brand, model, storage, currentPrice] of cases) {
    const key = deviceKey({ brand, model, storage });
    repo.records.set(key, { deviceKey: key, brand, model, storage, source: 'cashify', currentPrice, matchConfidence: 'exact', status: 'fresh',
      lastVerifiedAt: at, lastAttemptedAt: at, lastFailureAt: null, lastFailureError: null, consecutiveFailures: 0, createdAt: at, updatedAt: at } as unknown as ReferencePriceRecord);
  }
  const svc = createPricingService({ repository: repo as any, signingSecret: 'x'.repeat(32), tokenTtlSeconds: 600, strictReferenceMode: false,
    referenceLookupTimeoutMs: 100, logger: { info() {}, warn() {}, error() {} } });
  const answers: DiagnosticsType[] = [
    PERFECT_CONDITION_DIAGNOSTICS,
    { ...PERFECT_CONDITION_DIAGNOSTICS, hardware: ['face'], accessories: [] },
    { ...PERFECT_CONDITION_DIAGNOSTICS, screenCondition: '1-2 scratches on screen', defects: ['screen_scratch'], mobileAge: '3to6' },
  ];

  await test('POST /api/quote/price path: every quote and coupon state respects the ceiling and exposes couponHeadroom', async () => {
    let n = 0;
    for (const [brand, model, storage] of cases) {
      for (const diagnostics of answers) {
        const q = await svc.quote({ brand, model, storage, diagnostics });
        if (!q.ok) continue;
        assert.equal(typeof q.couponHeadroom, 'number');
        const c = q.internal.payoutCeiling;
        assert.ok(customerPayout(q.fhoneifyPrice, false).payout <= c.maxCustomerPayout, `${model}: standard payout`);
        assert.ok(customerPayout(q.fhoneifyPrice, true, q.couponHeadroom).payout <= c.maxCustomerPayout, `${model}: coupon payout`);
        assert.ok(q.pricingVersion.includes('+payout-ceiling-v1'), 'pricing version records the ceiling policy');
        n++;
      }
    }
    assert.ok(n >= 12, `priced ${n}`);
  });

  await test('lead creation stores the clamped payout and the same price that was signed', async () => {
    const [brand, model, storage] = cases[4]; // a cheap phone: the 8% tier, where the coupon cannot fit in full
    const q = await svc.quote({ brand, model, storage, diagnostics: PERFECT_CONDITION_DIAGNOSTICS });
    assert.ok(q.ok);
    if (!q.ok) return;
    const v = await svc.verifyLeadPrice({ brand, model, storage, diagnostics: PERFECT_CONDITION_DIAGNOSTICS, quoteToken: q.quoteToken, clientQuotedPrice: q.fhoneifyPrice });
    assert.ok(v.ok);
    if (!v.ok) return;
    assert.equal(v.price, q.fhoneifyPrice, 'lead price = signed price');
    assert.equal(v.audit.priceSource, 'quote_token');
    assert.equal(v.couponHeadroom, q.couponHeadroom);
    const lead = buildLeadAnswers(v, true) as any;
    assert.equal(lead.pricing.customerPayout.payout, customerPayout(q.fhoneifyPrice, true, q.couponHeadroom).payout);
    assert.ok(lead.pricing.customerPayout.payout <= q.internal.payoutCeiling.maxCustomerPayout);
    assert.ok(v.audit.payoutCeiling && v.audit.payoutCeiling.maxCustomerPayout === q.internal.payoutCeiling.maxCustomerPayout);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

run();
