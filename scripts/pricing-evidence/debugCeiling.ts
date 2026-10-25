import { appleEvidenceQuote } from '../../lib/pricing/appleCashifyModel';
import { applyCompetitorUplift, type DiagnosticsType } from '../../lib/pricingCalculator';
import { applyPayoutCeiling, headlineFromBase, maxPayoutForCashifyPayout, cashifyPayout } from '../../lib/pricing/payoutCeiling';
import { customerPayout } from '../../lib/pricing/payout';
import { priceDevice } from '../../lib/pricing/engine';

const perfect: DiagnosticsType = {
  calls: true, touch: true, originalScreen: true, defects: [], screenCondition: null, screenSpots: null, screenLines: null, screenDiscoloration: null,
  bodyScratches: 'No scratches', bodyDents: 'No dents', bodyPanel: null, bodyBent: null, hardware: [], accessories: ['box', 'charger'],
  warranty: true, validBill: true, eSim: null, mobileAge: 'below3',
};
const model = process.argv[2] ?? 'Apple iPhone 14 Pro';
const storage = process.argv[3] ?? '128GB';
const ref = Number(process.argv[4] ?? 44070);
for (const [name, d] of Object.entries<DiagnosticsType>({ perfect, face: { ...perfect, hardware: ['face', 'back_camera'], accessories: [] }, cracked: { ...perfect, screenCondition: 'Screen cracked/ glass broken', defects: ['screen_scratch'] } })) {
  const ev = appleEvidenceQuote(model, storage, ref, d);
  const r = priceDevice('Apple', model, ref, d, undefined, storage);
  const c = applyPayoutCeiling({ quote: r.fhoneifyPrice, cashifyHeadlineEquivalent: headlineFromBase(r.cashifyConditionEquivalent) });
  console.log(name, { evPrice: ev?.outcome.price, engineE: r.cashifyConditionEquivalent, engineQ: r.fhoneifyPrice, ceilingQ: c.quote, maxPayout: c.maxCustomerPayout, payout: customerPayout(c.quote, false).payout,
    upliftFromE: applyCompetitorUplift(ref, r.cashifyConditionEquivalent), testMax: maxPayoutForCashifyPayout(cashifyPayout(headlineFromBase(ev?.outcome.price ?? 0))) });
}
