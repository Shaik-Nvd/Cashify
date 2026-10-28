import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertCounts, loadCaseRecords, toMeasurements, EXPECTED } from '../pricing-evidence/import-new-data';
import { CLEAN_OFFSET, loadMeasurements } from '../pricing-evidence/evidenceLib';

// The audited 2026-10-28 Cashify import: counts are asserted, unsupported shapes fail loudly, duplicates and non-quotes never become prices.
const records = loadCaseRecords();
assertCounts(records);
let checks = 1;

// a dropped or unrecognised record must not pass silently (the previous importer returned zero records and zero warnings for this folder)
assert.throws(() => assertCounts(records.slice(1)), /count mismatch/);
assert.throws(() => assertCounts([...records.slice(1), { ...records[0], status: 'cached' } as any]), /unsupported record status/);
assert.throws(() => assertCounts([]), /count mismatch/);
checks += 3;

const { measurements, skipped } = toMeasurements(records);
const skippedCount = (reason: RegExp) => skipped.find(s => reason.test(s.reason))!.count;
assert.equal(skippedCount(/pending/), EXPECTED.pending, 'pending/prepared records are counted, never priced');
assert.equal(skippedCount(/unavailable/), EXPECTED.unavailable, 'unavailable options are not zero-priced');
assert.equal(skippedCount(/Samsung/), EXPECTED.pricedSamsung, 'Samsung quotes stay out of the Apple fit');
assert.equal(measurements.length, EXPECTED.pricedIphone - skippedCount(/repeat/));
assert.ok(measurements.every(m => m.model_key.startsWith('iPhone') && m.outcome === 'NUMERIC_QUOTE' && m.base != null && m.selling != null));
checks += 5;

// pending and unavailable records never leak into the measurement file
assert.ok(records.filter(r => r.status !== 'priced').every(r => r.selling == null), 'pending/unavailable records carry no numeric quote');
assert.equal(measurements.filter(m => m.selling == null).length, 0);
checks += 2;

// exact repeats inside one report are one observation (no duplicate leakage into fitting)
const seen = new Set<string>();
for (const m of measurements) {
  const k = `${m.archive}::${m.member}::${m.config_key}::${m.selling}::${m.observed_date}`;
  assert.ok(!seen.has(k), `duplicate observation ${k}`);
  seen.add(k);
}
checks++;

// every report/capacity has exactly one flawless quote, and it is the reference proxy of that report's quotes (plus a model's clean offset)
const flawless = new Map<string, number>();
for (const m of measurements) if (m.deviations.length === 0) flawless.set(`${m.archive}::${m.member}::${m.storage_gb}`, m.selling! + m.imei_fee! + (CLEAN_OFFSET[m.model_key] ?? 0));
for (const m of measurements) {
  assert.equal(m.variant_get_upto, flawless.get(`${m.archive}::${m.member}::${m.storage_gb}`), `${m.model_key} ${m.storage} case ${m.case_id}`);
  assert.equal(m.base, m.selling! + m.imei_fee!, 'base = selling + IMEI fee');
}
checks += 2;

// clean offsets are the documented ones only
assert.deepEqual(CLEAN_OFFSET, { 'iPhone 11': 400, 'iPhone 11 Pro Max': 400, 'iPhone 7': 150, 'iPhone 8': 150, 'iPhone 8 Plus': 150 });
checks++;

// the combined loader keeps the earlier collection and the new one apart (different dates / references are not averaged)
const merged = loadMeasurements();
assert.ok(merged.length > measurements.length);
assert.equal(new Set(merged.map(m => m.measurement_id)).size, merged.length, 'measurement ids are unique across both collections');
checks += 2;

// the older normalizer must fail loudly, not report success, when an archive format yields no records
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fhoneify-unsupported-'));
  const zip = path.join(dir, 'unsupported.zip');
  const make = spawnSync('python', ['-I', '-c', 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1],"w"); z.writestr("notes.txt","a format the normalizer does not read"); z.close()', zip]);
  if (make.status === 0) {
    const r = spawnSync('python', ['-I', path.resolve(__dirname, '../pricing-evidence/normalize_cashify_quotes.py'), '--data-dir', dir, '--out-dir', path.join(dir, 'out')], { encoding: 'utf8' });
    assert.notEqual(r.status, 0, 'zero parsed records must be a failure');
    assert.match(String(r.stderr) + String(r.stdout), /no records were parsed/);
    checks++;
  } else console.log('  (python unavailable: normalizer zero-record check skipped)');
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`${checks} new-data import checks passed (${records.length} records, ${measurements.length} iPhone measurements, ${merged.length} in the merged evidence)`);
