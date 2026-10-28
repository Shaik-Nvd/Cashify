/**
 * Evidence-calibrated iPhone model (lib/pricing/appleCashifyModel).
 *
 * Golden cases are real Cashify quotes from the collected archives (source in each name). They guard the RULES the
 * model was built on, so a regression in one rule fails with the quote that proves it:
 *   - the age / out-of-warranty effect is applied once
 *   - screen/display faults share one deduction (largest wins); body and panel damage share one
 *   - Wi-Fi and Bluetooth overlap
 *   - a floor exists only once the over-11-months state is forced
 *   - Cashify skips its age question for touch failure, cracked glass, panel damage, bent frame and a non-original
 *     screen - but NOT for spots, lines, discoloration or a loose screen
 *
 * Run: npx tsx scripts/test/pricing.apple-evidence.test.ts   (no database needed)
 */
import assert from 'node:assert/strict';
import calibrationJson from '../../lib/pricing/appleCashifyModel/calibration.json';
import scopeJson from '../../lib/pricing/appleCashifyModel/scope.json';
import {
  ageStateFromAnswer, evaluateAppleEvidence, parseAnswers, type Calibration, type ModelProfile,
} from '../../lib/pricing/appleCashifyModel/model';
import { appleEvidenceQuote, isAppleEvidenceModel, storageGbOf } from '../../lib/pricing/appleCashifyModel';
import { InspectionRequiredError } from '../../lib/pricing/inspectionRequired';
import type { DiagnosticsType } from '../../lib/pricingCalculator';
import { warrantyVoidedByDiagnostics } from '../../lib/pricing/diagnostics';

const CAL = calibrationJson as unknown as Calibration;
let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try { fn(); console.log(`  PASS  ${name}`); passed++; } catch (err: any) { console.log(`  FAIL  ${name}: ${err.message}`); failed++; }
}

const perfect: DiagnosticsType = {
  calls: true, touch: true, originalScreen: true, defects: [], screenCondition: null, screenSpots: null, screenLines: null,
  screenDiscoloration: null, bodyScratches: null, bodyDents: null, bodyPanel: null, bodyBent: null, hardware: [],
  accessories: ['box', 'charger'], warranty: true, validBill: true, eSim: null, mobileAge: 'below3',
};
const withAnswers = (over: Partial<DiagnosticsType>): DiagnosticsType => ({ ...perfect, ...over });
const price = (model: string, reference: number, d: DiagnosticsType, storageGb?: number) => {
  const o = evaluateAppleEvidence(CAL.models[model], reference, d, storageGb);
  assert.equal(o.kind, 'PRICE', `${model}: ${o.kind === 'PRICE' ? '' : JSON.stringify(o)}`);
  return o.kind === 'PRICE' ? o.price : NaN;
};
/** Equal within the tolerance of a calibrated (not memorised) model; Cashify prices are multiples of INR 10. */
const near = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: model ${actual} vs Cashify ${expected} (|diff| ${Math.abs(actual - expected)} > ${tol})`);

const PM = 'iPhone 18 Pro Max';
const R = 165000; // 12 GB / 2 TB reference on 2026-10-22

console.log('\nSuite I - evidence-calibrated iPhone model\n');

test('calibration integrity: every profile prices a clean phone at its reference and carries every condition class', () => {
  for (const [name, p] of Object.entries(CAL.models)) {
    for (const cls of ['display', 'cracked', 'touch', 'orig', 'body', 'panel', 'cam', 'fminA', 'fminB', 'prox', 'wifi', 'face', 'batt', 'finger']) {
      assert.ok(p.classes[cls as keyof ModelProfile['classes']], `${name}: class ${cls}`);
    }
    const ref = 50000;
    const clean = evaluateAppleEvidence(p, ref, withAnswers({ mobileAge: 'below3' }), p.storagesGb[0]);
    assert.equal(clean.kind, 'PRICE');
    if (clean.kind === 'PRICE') assert.equal(clean.price, ref - (p.cleanOffset?.value ?? 0), `${name}: flawless = reference less the measured clean offset`);
    if (p.age) {
      const a = (s: '1' | '2' | '3') => p.age![s].a + p.age![s].b * ref;
      assert.ok(a('1') <= a('2') && a('2') <= a('3'), `${name}: age deductions rise with age`);
    }
  }
});

test('GOLDEN 18 Pro Max 2 TB (single_defect 2026-10-22): Wi-Fi alone deducts 30% -> 115,500', () => {
  near(price(PM, R, withAnswers({ hardware: ['wifi'] }), 2048), 115500, 10, 'F05');
});
test('GOLDEN 18 Pro Max 2 TB: Wi-Fi + Bluetooth together deduct the same as one (checklist M01 -> 115,500)', () => {
  near(price(PM, R, withAnswers({ hardware: ['wifi', 'bluetooth'] }), 2048), 115500, 10, 'F05+F14');
});
test('GOLDEN 18 Pro Max 2 TB: cracked glass forces the over-11-months state (single S01 -> 107,110)', () => {
  near(price(PM, R, withAnswers({ screenCondition: 'Screen cracked/ glass broken' }), 2048), 107110, 10, 'S01');
});
test('GOLDEN pair T0549: cracked glass + large spots = ONE age effect + the larger screen deduction -> 99,460', () => {
  near(price(PM, R, withAnswers({ screenCondition: 'Screen cracked/ glass broken', screenSpots: 'Large/ heavy visible spots on screen' }), 2048), 99460, 10, 'S01+D01');
});
test('GOLDEN pair T0603: spots + 1-2 screen scratches = the larger one only -> 139,500', () => {
  near(price(PM, R, withAnswers({ screenSpots: 'Large/ heavy visible spots on screen', screenCondition: '1-2 scratches on screen' }), 2048), 139500, 10, 'D01+S04');
});
test('GOLDEN pair T0560/T0563: panel + cracked glass; loose screen behaves like the panel when glass is cracked -> 85,060', () => {
  near(price(PM, R, withAnswers({ screenCondition: 'Screen cracked/ glass broken', bodyPanel: 'Cracked/ broken side or back panel' }), 2048), 85060, 10, 'P01+S01');
  near(price(PM, R, withAnswers({ screenCondition: 'Screen cracked/ glass broken', bodyBent: 'Loose screen (Gap in screen and body)' }), 2048), 85060, 10, 'P04+S01');
});
test('GOLDEN pairs T0556/T0557/T0558: body damage on top of cracked glass is largely absorbed (99,760 / 107,110 / 94,420)', () => {
  const glass = { screenCondition: 'Screen cracked/ glass broken' };
  near(price(PM, R, withAnswers({ ...glass, bodyScratches: 'More than 2 scratches' }), 2048), 99760, 20, 'C01+S01');
  near(price(PM, R, withAnswers({ ...glass, bodyScratches: '1-2 scratches' }), 2048), 107110, 20, 'C02+S01');
  near(price(PM, R, withAnswers({ ...glass, bodyDents: 'Major dent(s) or more than 2' }), 2048), 94420, 20, 'C03+S01');
});
test('GOLDEN 17 Oct 18 Pro Max 256 GB case 16: out of warranty + no box/charger -> 96,960 (the box deduction is smaller once aged)', () => {
  near(price(PM, 130000, withAnswers({ warranty: false, accessories: [], mobileAge: 'above11' }), 256), 96960, 20, 'WARRANTY_NO+BOX_NO');
});
test('GOLDEN checklist M15 (touch + Wi-Fi + Face ID + battery) hits the floor: 28,050 = 17% of the reference', () => {
  near(price(PM, R, withAnswers({ touch: false, hardware: ['wifi', 'face', 'battery_service'] }), 2048), 28050, 10, 'floor');
});
test('GOLDEN 16 Pro Max 512 GB (checklist, 24 Oct): Wi-Fi/Bluetooth 60,970; display 64,470; floor 15,470', () => {
  const m = 'iPhone 16 Pro Max';
  near(price(m, 88270, withAnswers({ hardware: ['wifi', 'bluetooth'] }), 512), 60970, 120, 'M01');
  near(price(m, 88270, withAnswers({ screenSpots: 'Large/ heavy visible spots on screen', screenLines: 'Visible line(s) on display', screenDiscoloration: 'Major Discoloration' }), 512), 64470, 120, 'M08');
  near(price(m, 88270, withAnswers({ touch: false, hardware: ['wifi', 'face', 'battery_service'] }), 512), 15470, 120, 'M15');
});

test('RULE spots / lines / discoloration / loose screen do NOT force the aged state (they still ask the age)', () => {
  const spots = evaluateAppleEvidence(CAL.models[PM], R, withAnswers({ screenSpots: 'Large/ heavy visible spots on screen' }), 2048);
  assert.ok(spots.kind === 'PRICE' && spots.state === 0, 'spots keep the young state');
  const loose = evaluateAppleEvidence(CAL.models[PM], R, withAnswers({ bodyBent: 'Loose screen (Gap in screen and body)' }), 2048);
  assert.ok(loose.kind === 'PRICE' && loose.state === 0);
  const touch = evaluateAppleEvidence(CAL.models[PM], R, withAnswers({ touch: false }), 2048);
  assert.ok(touch.kind === 'PRICE' && touch.state === 3, 'touch failure forces the over-11-months state');
});
test('RULE the age effect is never applied twice (touch failure + warranty No = touch failure alone)', () => {
  const a = price(PM, R, withAnswers({ touch: false }), 2048);
  const b = price(PM, R, withAnswers({ touch: false, warranty: false, mobileAge: 'above11' }), 2048);
  assert.equal(a, b);
});
test('RULE bill missing and warranty missing are the same age effect (checklist W00 = W02)', () => {
  assert.equal(price(PM, R, withAnswers({ warranty: false, mobileAge: 'above11' }), 2048), price(PM, R, withAnswers({ validBill: false }), 2048));
});
test('RULE the box deduction is a fixed amount, not a share of the price', () => {
  const small = price('iPhone 16 Pro Max', 80000, withAnswers({ accessories: [] }), 512);
  const large = price('iPhone 16 Pro Max', 90000, withAnswers({ accessories: [] }), 512);
  assert.ok(Math.abs((80000 - small) - (90000 - large)) <= 10, 'same rupee box deduction at two prices');
});
test('RULE age effect reads form ids and labels alike; unreadable age = youngest, like the legacy engine', () => {
  assert.deepEqual(['below3', 'Below 3 months', '3to6', '3 months - 6 months', '6to11', '6 months - 11 months', 'above11', 'Above 11 months', '', null].map(ageStateFromAnswer), [0, 0, 1, 1, 2, 2, 3, 3, 0, 0]);
});
test('RULE a bill given only as an accessory counts as a valid bill (legacy reading)', () => {
  assert.equal(parseAnswers(withAnswers({ validBill: null, accessories: ['box', 'bill'] })).validBill, true);
});

test('NO OFFER: cannot make calls alone quotes the INR 1,200 scrap; with any other fault Cashify declined every case', () => {
  assert.equal(price(PM, R, withAnswers({ calls: false }), 2048), 1200);
  const both = evaluateAppleEvidence(CAL.models[PM], R, withAnswers({ calls: false, touch: false, hardware: ['wifi'] }), 2048);
  assert.equal(both.kind, 'NO_OFFER');
  const none = evaluateAppleEvidence(CAL.models[PM], R, withAnswers({ hardware: ['front_camera', 'back_camera', 'volume', 'fingerprint', 'wifi', 'speaker', 'silent', 'face', 'power', 'charging', 'audio_receiver', 'camera_glass', 'microphone', 'bluetooth', 'vibrator', 'proximity', 'battery_service'] }), 2048);
  assert.equal(none.kind, 'NO_OFFER', 'a 17-fault phone is outside the evidence -> inspection, not a guess');
});
test('UNSUPPORTED: an answer the model cannot read is left to the existing engine', () => {
  assert.equal(evaluateAppleEvidence(CAL.models[PM], R, withAnswers({ hardware: ['hinge'] }), 2048).kind, 'UNSUPPORTED');
  assert.equal(evaluateAppleEvidence(CAL.models[PM], R, withAnswers({ screenCondition: 'Cracked in a new way' }), 2048).kind, 'UNSUPPORTED');
  assert.equal(evaluateAppleEvidence(CAL.models[PM], 0, perfect, 2048).kind, 'UNSUPPORTED');
});

test('EXPLAINED: every price carries a breakdown that adds up to the reference minus the price, with evidence support labels', () => {
  const d = withAnswers({ touch: false, hardware: ['wifi', 'front_camera'], accessories: [] });
  const o = evaluateAppleEvidence(CAL.models[PM], R, d, 2048);
  assert.equal(o.kind, 'PRICE');
  if (o.kind !== 'PRICE') return;
  const total = o.breakdown.reduce((s, b) => s + b.amount, 0);
  near(R - total, o.price, 10, 'breakdown sums to the price (before rounding)');
  assert.ok(o.breakdown.every(b => ['measured', 'inferred', 'rule'].includes(b.support)));
  assert.ok(o.breakdown.some(b => b.rule === 'age') && o.breakdown.some(b => b.rule.startsWith('class:')) && o.breakdown.some(b => b.rule === 'box'));
});
test('DETERMINISTIC and pure: same inputs, same output, inputs and calibration untouched', () => {
  const snapshot = JSON.stringify(CAL.models[PM]);
  const d = withAnswers({ touch: false, hardware: ['face'] });
  const dSnap = JSON.stringify(d);
  const a = evaluateAppleEvidence(CAL.models[PM], R, d, 2048);
  const b = evaluateAppleEvidence(CAL.models[PM], R, d, 2048);
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(CAL.models[PM]), snapshot);
  assert.equal(JSON.stringify(d), dSnap);
});
test('MONOTONE: adding a fault never raises the price (all single faults on three models)', () => {
  for (const model of ['iPhone 18 Pro Max', 'iPhone 16 Pro Max', 'iPhone 15 Pro']) {
    const p = CAL.models[model];
    const ref = 60000;
    const base = price(model, ref, perfect, p.storagesGb[0]);
    for (const hw of ['front_camera', 'back_camera', 'wifi', 'face', 'battery_service', 'speaker', 'microphone']) {
      assert.ok(price(model, ref, withAnswers({ hardware: [hw] }), p.storagesGb[0]) <= base, `${model} ${hw}`);
    }
    assert.ok(price(model, ref, withAnswers({ screenCondition: '1-2 scratches on screen' }), p.storagesGb[0]) <= base);
  }
});

test('SCOPE: storage parsing handles every catalog spelling', () => {
  assert.deepEqual(['256GB', '128 GB', '6 GB/128 GB', '12 GB/2 TB', '1TB', '', null].map(storageGbOf), [256, 128, 128, 2048, 1024, null, null]);
});
test('SCOPE: every enabled model has a calibration profile that covers the storages it enables', () => {
  for (const [model, entry] of Object.entries((scopeJson as any).models as Record<string, { enabled: boolean; storagesGb: number[] }>)) {
    if (!entry.enabled) continue;
    const fallback = (entry as { fallbackFrom?: string }).fallbackFrom;
    const p = CAL.models[model] ?? (fallback ? CAL.models[fallback] : undefined);
    if (fallback) { assert.ok(p, `${model}: fallback ${fallback} profile`); assert.equal(entry.storagesGb.length, 0, `${model}: a fallback claims no measured storage`); continue; }
    assert.ok(p, `${model}: profile`);
    for (const gb of entry.storagesGb) assert.ok(p.storagesGb.includes(gb), `${model}: ${gb} GB measured`);
  }
});
test('SCOPE: devices outside the scope are not touched by the evidence model', () => {
  const diag = withAnswers({ hardware: ['face'] });
  // every catalog iPhone is now in scope (pricing.apple-reference-rules.test.ts); a model the catalog does not know stays untouched
  assert.equal(appleEvidenceQuote('Apple iPhone 99', '128GB', 30000, diag), null);
  assert.equal(appleEvidenceQuote('Samsung Galaxy S24', '8 GB/256 GB', 30000, diag), null);
});
test('SCOPE: for in-scope iPhones the form no longer pre-voids warranty for spots/lines; other devices keep the legacy rule', () => {
  const spots = { ...perfect, screenSpots: '3 or more minor spots on screen' };
  assert.equal(warrantyVoidedByDiagnostics(spots), true, 'legacy rule unchanged without a device');
  assert.equal(warrantyVoidedByDiagnostics(spots, { model: 'Samsung Galaxy S24', storage: '8 GB/256 GB' }), true, 'devices outside the evidence keep the legacy rule');
  const enabled = Object.entries((scopeJson as any).models as Record<string, { enabled: boolean; storagesGb: number[] }>).find(([, e]) => e.enabled);
  if (enabled) {
    const gb = enabled[1].storagesGb[0];
    const storage = gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`;
    assert.ok(isAppleEvidenceModel(`Apple ${enabled[0]}`, storage));
    assert.equal(warrantyVoidedByDiagnostics(spots, { model: `Apple ${enabled[0]}`, storage }), false, `${enabled[0]}: spots keep the customer's warranty answer`);
  }
});
test('SCOPE: an in-scope condition Cashify declines becomes an inspection request, never a number', () => {
  const enabled = Object.entries((scopeJson as any).models as Record<string, { enabled: boolean; storagesGb: number[] }>).find(([, e]) => e.enabled);
  if (!enabled) return;
  const gb = enabled[1].storagesGb[0];
  const storage = gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`;
  assert.throws(() => appleEvidenceQuote(`Apple ${enabled[0]}`, storage, 60000, withAnswers({ calls: false, touch: false, hardware: ['wifi'] })), InspectionRequiredError);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
