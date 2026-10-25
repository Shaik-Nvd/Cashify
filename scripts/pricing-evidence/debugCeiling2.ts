import { appleEvidenceQuote } from '../../lib/pricing/appleCashifyModel';
import type { DiagnosticsType } from '../../lib/pricingCalculator';
import { priceDevice } from '../../lib/pricing/engine';
import { findCatalogDevice } from '../../lib/pricing/catalog';
const perfect: DiagnosticsType = {
  calls: true, touch: true, originalScreen: true, defects: [], screenCondition: null, screenSpots: null, screenLines: null, screenDiscoloration: null,
  bodyScratches: 'No scratches', bodyDents: 'No dents', bodyPanel: null, bodyBent: null, hardware: [], accessories: ['box', 'charger'],
  warranty: true, validBill: true, eSim: null, mobileAge: 'below3',
};
const { SEED_DEVICES } = require('../../lib/seed_devices');
const cands = (SEED_DEVICES as any[]).filter(d => d.model === 'Apple iPhone 14 Pro').map(d => `${d.storage}|${d.ram}`);
console.log('catalog 14 Pro:', cands);
const d = { ...perfect, hardware: ['wifi'] };
for (const storage of ['128GB', '6 GB/128 GB']) {
  const dev = findCatalogDevice('Apple', 'Apple iPhone 14 Pro', storage);
  console.log(storage, 'device', dev?.storage);
  try { console.log(' evidence', appleEvidenceQuote('Apple iPhone 14 Pro', storage, 44070, d)?.outcome.price); } catch (e: any) { console.log(' evidence ->', e.message); }
  console.log(' engine', priceDevice('Apple', 'Apple iPhone 14 Pro', 44070, d, undefined, storage));
}
