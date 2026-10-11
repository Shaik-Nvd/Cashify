import assert from 'node:assert/strict';
import { priceDevice } from '../../lib/pricing/engine';
import { calculateFhoneifyPrice } from '../../lib/pricingCalculator';
import { PERFECT_CONDITION_DIAGNOSTICS } from '../../lib/pricing/perfectCondition';
const semantics = { warrantyMode: 'NOT_ASKED', billMode: 'NOT_ASKED', ageMode: 'NOT_ASKED' } as const;
const d = { ...PERFECT_CONDITION_DIAGNOSTICS, warranty: null, validBill: null, mobileAge: null, eSim: null, accessories: ['box'], hardware: ['face'] };
for (const [model, storage, reference] of [
  ['Apple iPhone 12 Pro Max', '256GB', 25680],
  ['Apple iPhone 12 Pro Max', '128GB', 27180],
  ['Apple iPhone 12 Pro Max', '512GB', 24830],
  ['Apple iPhone 14', '256GB', 27780],
] as const) {
  const expected = calculateFhoneifyPrice('Apple', model, reference, d, semantics, storage);
  assert.deepEqual((priceDevice as any)('Apple', model, reference, d, semantics, storage), expected, `${model} ${storage} uses catalog storage, independent of reference value`);
}
console.log('PASS explicit storage dispatch across moved references and sibling variants');
