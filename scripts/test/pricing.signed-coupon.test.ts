import assert from 'node:assert/strict';
import { createPricingService } from '../../lib/pricing/pricingService';
import { customerPayout } from '../../lib/pricing/payout';
import { sameAcceptedQuote, type SignedQuote } from '../../lib/pricing/quoteSession';
import { verifyQuoteToken } from '../../lib/pricing/quoteToken';

async function main() {
  let reference = 72480;
  const now = new Date('2026-10-25T12:00:00Z');
  const device = { brand: 'Apple', model: 'Apple iPhone 15 Pro Max', storage: '512GB' };
  const secret = 'release-regression-test-secret-only';
  const repository: any = { async get(key: string) { return { ...device, deviceKey: key, currentPrice: reference, source: 'cashify', status: 'fresh', matchConfidence: 'exact', lastVerifiedAt: now }; } };
  const service = createPricingService({ repository, signingSecret: secret, tokenTtlSeconds: 900, strictReferenceMode: true, referenceLookupTimeoutMs: 100,
    now: () => now, snapshot: {}, pricingMode: 'legacy', logger: { info() {}, warn() {}, error() {} } });
  const diagnostics = { calls: true, touch: true, originalScreen: true, warranty: false, validBill: true, hardware: ['face', 'battery_service'], accessories: [], defects: [], mobileAge: 'above11' };
  const quote = await service.quote({ ...device, diagnostics });
  assert(quote.ok);
  const token = verifyQuoteToken(quote.quoteToken, secret, Math.floor(now.getTime() / 1000));
  assert(token.ok);
  assert.equal((token.payload as any).ch, quote.couponHeadroom, 'coupon allowance must be authenticated with the accepted price');
  reference = 70000;
  const saved = await service.verifyLeadPrice({ ...device, diagnostics, quoteToken: quote.quoteToken });
  assert(saved.ok);
  assert.equal(customerPayout(saved.price, true, saved.couponHeadroom).payout,
    customerPayout(quote.fhoneifyPrice, true, quote.couponHeadroom).payout, 'accepted signed payout must survive reference movement');
  const a: SignedQuote = { device, price: 10000, getUpto: 12000, token: 'test', expiresAt: '2026-10-25T13:00:00Z', diagnostics, pricingVersion: 'test', couponHeadroom: 299 };
  assert.equal(sameAcceptedQuote(a, { ...a, couponHeadroom: 0 }, now), false, 'changed coupon allowance must require accepting the revised payout');
  console.log('3 signed coupon acceptance checks passed');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
