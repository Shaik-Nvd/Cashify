/**
 * Robustness sweep: random answer combinations across every catalog variant of every enabled iPhone model through the real pricing service.
 * Every result must be a price that satisfies the payout limit or an inspection request; nothing may throw or return another error.
 *   npx tsx scripts/pricing-evidence/answer-sweep.ts [perVariant]
 */
import { createPricingService } from '../../lib/pricing/pricingService';
import { SEED_DEVICES } from '../../lib/seed_devices';
import { SCOPE, evidenceModelKey } from '../../lib/pricing/appleCashifyModel/scope';
import { cashifyPayout, headlineFromBase, maxPayoutForCashifyPayout } from '../../lib/pricing/payoutCeiling';
import { customerPayout } from '../../lib/pricing/payout';

const repo: any = { async get() { return null; }, async upsert() {}, async listAll() { return []; }, async appendHistory() {}, async getHistory() { return []; } };
const svc = createPricingService({ repository: repo, signingSecret: 'x'.repeat(40), tokenTtlSeconds: 60, strictReferenceMode: false, referenceLookupTimeoutMs: 50, pricingMode: 'hybrid', logger: { info() {}, warn() {}, error() {} } });
let seed = 987654321; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const HW = ['front_camera', 'back_camera', 'volume', 'fingerprint', 'wifi', 'speaker', 'silent', 'face', 'power', 'charging', 'audio_receiver', 'camera_glass', 'microphone', 'bluetooth', 'vibrator', 'proximity', 'battery_service', 'battery_health'];
function randomAnswers(): any {
  const hw = HW.filter(() => rnd() < (rnd() < 0.7 ? 0.08 : 0.4));
  const d: any = {
    calls: rnd() < 0.03 ? false : true, touch: rnd() < 0.25 ? false : true, originalScreen: rnd() < 0.15 ? false : true, defects: [],
    screenCondition: rnd() < 0.2 ? pick(['Screen cracked/ glass broken', 'Chipped/cracked outside display area', 'More than 2 scratches on screen', '1-2 scratches on screen']) : null,
    screenSpots: rnd() < 0.1 ? pick(['Large/ heavy visible spots on screen', '1-2 minor spots on screen']) : null,
    screenLines: rnd() < 0.1 ? 'Visible line(s) on display' : null, screenDiscoloration: rnd() < 0.08 ? 'Major Discoloration' : null,
    bodyScratches: rnd() < 0.25 ? pick(['More than 2 scratches', '1-2 scratches']) : null, bodyDents: rnd() < 0.2 ? pick(['Major dent(s) or more than 2', '1-2 minor dents']) : null,
    bodyPanel: rnd() < 0.1 ? pick(['Cracked/ broken side or back panel', 'Missing side or back panel']) : null, bodyBent: rnd() < 0.08 ? pick(['Bent/ curved panel', 'Loose screen (Gap in screen and body)']) : null,
    hardware: hw, accessories: rnd() < 0.7 ? ['box'] : [], warranty: rnd() < 0.5, validBill: rnd() < 0.5, eSim: pick([null, 'Single eSIM', 'Dual eSIM']),
    mobileAge: pick(['below3', '3to6', '6to11', 'above11']),
  };
  if (d.screenCondition) d.defects.push('screen_scratch'); if (d.bodyScratches || d.bodyDents) d.defects.push('body_scratch'); if (d.bodyPanel || d.bodyBent) d.defects.push('panel_missing'); if (d.screenSpots || d.screenLines || d.screenDiscoloration) d.defects.push('screen_spot');
  return d;
}
(async () => {
  const per = Number(process.argv[2] ?? 25);
  const devices = (SEED_DEVICES as any[]).filter(d => d.brand === 'Apple' && typeof d.model === 'string' && typeof d.storage === 'string' && SCOPE.models[evidenceModelKey(d.model)]?.enabled);
  const tally: Record<string, number> = {}; const bad: string[] = []; let n = 0;
  for (const d of devices) for (let i = 0; i < per; i++) {
    const diagnostics = randomAnswers(); n++;
    let r: any;
    try { r = await svc.quote({ brand: d.brand, model: d.model, storage: d.storage, diagnostics }); } catch (e: any) { bad.push(`THROW ${d.model} ${d.storage}: ${e.message}`); continue; }
    const key = r.ok ? 'price' : r.code; tally[key] = (tally[key] ?? 0) + 1;
    if (r.ok) {
      const max = maxPayoutForCashifyPayout(cashifyPayout(headlineFromBase(r.internal.cashifyConditionEquivalent)));
      if (!(r.fhoneifyPrice > 0) || !Number.isInteger(r.fhoneifyPrice) || customerPayout(r.fhoneifyPrice, true, r.couponHeadroom).payout > max) bad.push(`LIMIT ${d.model} ${d.storage} ${r.fhoneifyPrice}`);
    } else if (r.code !== 'MANUAL_INSPECTION_REQUIRED') bad.push(`CODE ${r.code} ${d.model} ${d.storage}`);
  }
  console.log(JSON.stringify({ variants: devices.length, requests: n, tally, problems: bad.length }, null, 1));
  for (const b of bad.slice(0, 15)) console.log(b);
})();
