/**
 * How often the fail-closed ceiling sends an otherwise-priced request to inspection, over the whole catalog at its
 * catalog base prices, for four answer profiles. Existing-engine behaviour change to disclose; analysis only.
 *   npx tsx scripts/pricing-evidence/ceiling-inspection-rate.ts
 */
import { createPricingService } from '../../lib/pricing/pricingService';
import { PERFECT_CONDITION_DIAGNOSTICS } from '../../lib/pricing/engine';
import { SEED_DEVICES } from '../../server/seed_devices';

const repo: any = { async get() { return null; }, async upsert() {}, async listAll() { return []; }, async appendHistory() {}, async getHistory() { return []; } };
const svc = createPricingService({ repository: repo, signingSecret: 'x'.repeat(40), tokenTtlSeconds: 60, strictReferenceMode: false, referenceLookupTimeoutMs: 50, logger: { info() {}, warn() {}, error() {} } });
const base: any = PERFECT_CONDITION_DIAGNOSTICS;
const profiles: Record<string, any> = {
  perfect: base,
  worn: { ...base, defects: ['body_scratch'], bodyScratches: 'More than 2 scratches', warranty: false, validBill: false, mobileAge: 'above11' },
  damaged: { ...base, touch: false, originalScreen: false, warranty: false, validBill: false, accessories: [], defects: ['broken_screen', 'body_scratch', 'panel_missing'], bodyScratches: 'More than 2 scratches', bodyDents: 'Major dent(s) or more than 2', hardware: ['battery_service', 'back_camera', 'face'], mobileAge: 'above11' },
  notWorking: { ...base, calls: false },
};
(async () => {
  const res: Record<string, { ok: number; inspection: number; byLowValue: number }> = {};
  const lowValue: Record<string, string[]> = {};
  for (const d of (SEED_DEVICES as any[]).filter(x => typeof x.brand === 'string' && typeof x.model === 'string' && typeof x.storage === 'string')) {
    for (const [name, diagnostics] of Object.entries(profiles)) {
      const r: any = await svc.quote({ brand: d.brand, model: d.model, storage: d.storage, diagnostics });
      const a = (res[name] ??= { ok: 0, inspection: 0, byLowValue: 0 });
      if (r.ok) a.ok++; else if (r.code === 'MANUAL_INSPECTION_REQUIRED') { a.inspection++; (lowValue[name] ??= []).push(`${d.model} ${d.storage}`); } else a.byLowValue++;
    }
  }
  console.log(JSON.stringify(res, null, 1));
  for (const [k, v] of Object.entries(lowValue)) console.log(k, v.length, v.slice(0, 6).join('; '));
})();
