import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPricingService } from '../../lib/pricing/pricingService';
import { findCatalogDevice } from '../../lib/pricing/catalog';
import { deviceKey } from '../../lib/referencePricing/types';
import { customerPayout } from '../../lib/pricing/payout';

async function main() {
  const fixture = JSON.parse(fs.readFileSync('scripts/test/fixtures/iphone14-sibling-preservation-2026-10-11.json', 'utf8'));
  let binding = 0, guarded = 0;
  for (const row of fixture.cases) {
    const device = findCatalogDevice('Apple', 'Apple iPhone 14', row.storage)!;
    assert(device);
    const key = deviceKey(device);
    const at = new Date('2026-10-11T12:00:00Z');
    const service = createPricingService({
      repository: { async get() { return { ...device, deviceKey: key, currentPrice: row.reference, source: 'cashify', status: 'fresh', matchConfidence: 'exact',
        lastVerifiedAt: '2026-10-04T08:48:09.147Z', lastAttemptedAt: null, lastFailureAt: null, lastFailureError: null, consecutiveFailures: 0, createdAt: at.toISOString(), updatedAt: at.toISOString() }; },
        async listAll() { return []; }, async upsert() { throw new Error('No writes'); }, async appendHistory() { throw new Error('No writes'); }, async getHistory() { return []; } },
      questionnaireStore: { async get() { return { brand: device.brand, model: device.model, modelKey: 'apple|apple iphone 14', warrantyMode: 'NOT_ASKED', billMode: 'NOT_ASKED', ageMode: 'NOT_ASKED',
        status: 'OK', observedAt: '2026-09-24T15:02:56.160Z', questionLabels: [], statusDetail: null, sourceUrl: null, variantsChecked: 1, parserVersion: 'frozen-profile' }; },
        async list() { return []; }, async upsert() { throw new Error('No writes'); } },
      catalog: [device], signingSecret: 'offline-scoped-storage-test-secret', tokenTtlSeconds: 900, strictReferenceMode: true, referenceLookupTimeoutMs: 100,
      pricingMode: 'hybrid', snapshot: {}, now: () => at, logger: { info() {}, warn() {}, error() {} },
    });
    const result = await service.quote({ brand: device.brand, model: device.model, storage: device.storage, diagnostics: row.diagnostics });
    assert.equal(result.ok, row.expected.ok, `${row.storage} ${row.condition}: quote availability preserved`);
    if (result.ok) {
      assert.equal(result.fhoneifyPrice, row.expected.quote, `${row.storage} ${row.condition}: main payout preserved`);
      assert.equal(customerPayout(result.fhoneifyPrice, false).payout, row.expected.couponOff);
      assert.equal(customerPayout(result.fhoneifyPrice, true).payout, row.expected.couponOn);
      binding++;
    } else { assert.equal(result.code, row.expected.code); guarded++; }
  }
  console.log(`PASS ${binding} binding and ${guarded} guarded sibling cases preserve main payouts/availability`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
