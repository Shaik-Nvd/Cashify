/**
 * Exact matches against the supplied Cashify quotations, and what is NOT an exact match.
 *
 * The owner confirmed the supplied quotations are real Cashify results. A request for the same variant and the same answers
 * must therefore return the recorded Cashify-equivalent (selling price + INR 20) before uplift, collected against the same
 * Get Upto. No database, network or browser.
 *
 * Run: npx tsx scripts/test/pricing.apple-evidence-exact.test.ts
 */
import assert from 'node:assert/strict';
import { appleEvidenceQuote } from '../../lib/pricing/appleCashifyModel';
import { EXACT } from '../../lib/pricing/appleCashifyModel/exact';
import { InspectionRequiredError } from '../../lib/pricing/inspectionRequired';
import { hasUnknownInput, loadMeasurements, toDiagnostics } from '../pricing-evidence/evidenceLib';

let passed = 0, failed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  try { await fn(); console.log(`  PASS  ${name}`); passed++; } catch (e: any) { console.log(`  FAIL  ${name}: ${String(e.message ?? e).slice(0, 500)}`); failed++; }
}
const ms = loadMeasurements().filter(m => !hasUnknownInput(m));
const quote = (model: string, gb: number, ref: number, d: any) => appleEvidenceQuote(model, `${gb}GB`, ref, d);

async function run() {
  console.log('\nExact recorded Cashify quotes\n');

  await test('every supplied priced archive quotation reproduces its recorded Cashify-equivalent exactly', () => {
    let checked = 0; const wrong: string[] = [];
    for (const m of ms) {
      if (m.outcome !== 'NUMERIC_QUOTE' || m.base == null) continue;
      const q = quote(m.model_key, m.storage_gb, m.variant_get_upto, toDiagnostics(m, 'none'));
      checked++;
      if (!q || q.source !== 'exact' || q.outcome.price !== m.base) wrong.push(`${m.archive}::${m.case_id} ${m.model_key} ${m.storage_gb} recorded ${m.base} got ${q?.outcome.price}`);
    }
    assert.ok(checked > 2000, `checked ${checked}`);
    assert.deepEqual(wrong, [], `${wrong.length} of ${checked} did not reproduce`);
  });

  await test('every recorded Cashify no-offer stays an explicit no-offer (never a price)', () => {
    let n = 0;
    for (const m of ms) {
      if (m.outcome !== 'NO_OFFER') continue;
      assert.throws(() => quote(m.model_key, m.storage_gb, m.variant_get_upto, toDiagnostics(m, 'none')), InspectionRequiredError, `${m.model_key} ${m.case_id}`);
      n++;
    }
    assert.ok(n >= 50, `no-offers checked ${n}`);
  });

  await test('the same answers at the same reference return the recorded amount; a moved reference carries it by the model\'s own movement', () => {
    const m = ms.find(x => x.model_key === 'iPhone 17 Pro Max' && x.storage_gb === 512 && x.deviations.join() === 'AGE:Above 11 months')!;
    const d = toDiagnostics(m, 'none');
    const same = quote(m.model_key, m.storage_gb, m.variant_get_upto, d)!;
    assert.equal(same.outcome.price, m.base);
    const moved = quote(m.model_key, m.storage_gb, m.variant_get_upto + 3000, d)!;
    assert.equal(moved.source, 'exact');
    assert.ok(moved.outcome.price > m.base! && moved.outcome.price < m.base! + 3000, `moved ${moved.outcome.price} from ${m.base}`);
    assert.ok(moved.outcome.notes.some(n => /carried to the current reference/.test(n)));
  });

  await test('older and newer records of one configuration are not averaged: the record collected against the same reference wins, else the newest', () => {
    // iPhone 17 256 GB, out of warranty: tester workbook of 2 Oct (Get Upto 65,000) and the archive of 24 Oct (Get Upto 65,500)
    const fm = quote('iPhone 17', 256, 65000, { calls: true, touch: true, originalScreen: true, defects: [], hardware: [], accessories: ['box', 'charger'], box: true, charger: true, warranty: false, validBill: true, mobileAge: 'above11', eSim: null, screenCondition: null, screenSpots: null, screenLines: null, screenDiscoloration: null, bodyScratches: null, bodyDents: null, bodyPanel: null, bodyBent: null });
    const archive = quote('iPhone 17', 256, 65500, { calls: true, touch: true, originalScreen: true, defects: [], hardware: [], accessories: ['box', 'charger'], box: true, charger: true, warranty: false, validBill: true, mobileAge: 'above11', eSim: null, screenCondition: null, screenSpots: null, screenLines: null, screenDiscoloration: null, bodyScratches: null, bodyDents: null, bodyPanel: null, bodyBent: null });
    assert.equal(fm!.outcome.price, 46770, 'workbook record at its own reference');
    assert.equal(archive!.outcome.price, 49610, 'archive record at its own reference');
    const between = quote('iPhone 17', 256, 65250, { calls: true, touch: true, originalScreen: true, defects: [], hardware: [], accessories: ['box', 'charger'], box: true, charger: true, warranty: false, validBill: true, mobileAge: 'above11', eSim: null, screenCondition: null, screenSpots: null, screenLines: null, screenDiscoloration: null, bodyScratches: null, bodyDents: null, bodyPanel: null, bodyBent: null });
    assert.ok(Math.abs(between!.outcome.price - 49610) < 400, `newest record carried to the new reference, not averaged: ${between!.outcome.price}`);
  });

  await test('a configuration that was NOT recorded is priced by the calibrated rules, not by a lookup', () => {
    const m = ms.find(x => x.model_key === 'iPhone 16' && x.storage_gb === 128 && x.outcome === 'NUMERIC_QUOTE' && x.deviations.length === 0)!;
    const d = { ...toDiagnostics(m, 'none'), hardware: ['wifi', 'speaker'] }; // Wi-Fi + speaker: not a recorded combination on the iPhone 16
    const q = quote('iPhone 16', m.storage_gb, m.variant_get_upto, d)!;
    assert.ok(q);
    assert.equal(q.source, 'model');
    assert.ok(q.outcome.price < m.base! * 0.8 && q.outcome.price > 0);
  });

  await test('the exact index is internally consistent: no entry is a non-positive price, every reference is positive', () => {
    let entries = 0;
    for (const byGb of Object.values(EXACT.models)) for (const byKey of Object.values(byGb)) for (const list of Object.values(byKey)) for (const [, g0, base] of list) {
      entries++;
      assert.ok(g0 > 0); assert.ok(base == null || base > 0);
    }
    assert.ok(entries > 2000, `entries ${entries}`);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
}
run();
