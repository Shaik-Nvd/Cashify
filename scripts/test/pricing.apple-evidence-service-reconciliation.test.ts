/**
 * Offline production-route reconciliation of every complete supplied iPhone quote (earlier collection + 2026-10-28 import), through the
 * quote service configured as in production. Served iPhone quotes come from the calibrated rules, so this is IN-SAMPLE reconciliation of the
 * fitted rules (held-out figures: scripts/pricing-evidence/validate-new-data.ts). No database connections.
 *
 * Asserted: the approved arithmetic round(C + min(R x tier(R), 2000)) on every priced quote; how many quotes are priced; how close the
 * Cashify-equivalent is to the recorded base price. The residuals above INR 300 are listed, never hidden.
 */
import assert from 'node:assert/strict';
import { replayService } from '../pricing-evidence/replay-service';
import { hasUnknownInput, loadMeasurements } from '../pricing-evidence/evidenceLib';

(async () => {
  const ms = loadMeasurements().filter(m => !hasUnknownInput(m) && m.outcome === 'NUMERIC_QUOTE' && m.base != null);
  const rows = await replayService(ms);
  const priced = rows.filter(r => r.ok);
  const abs = priced.map(r => Math.abs(r.error!));
  const share = (f: (x: number) => boolean) => abs.filter(f).length / abs.length;
  const large = priced.filter(r => Math.abs(r.error!) > 300).map(r => `${r.m.model_key} ${r.m.storage_gb} ${r.m.observed_date} ${r.m.deviations.join(' ')} ${r.error! > 0 ? '+' : ''}${r.error}`);
  const summary = { cases: rows.length, priced: priced.length, inspection: rows.length - priced.length, within20: share(x => x <= 20), within100: share(x => x <= 100),
    mae: abs.reduce((a, b) => a + b, 0) / abs.length, above300: large.length };
  console.log(JSON.stringify(summary));
  console.log(large.join('\n'));
  assert.ok(rows.length > 6800, `cases ${rows.length}`);
  assert.deepEqual(priced.filter(r => r.price !== r.expectedPrice).map(r => `${r.m.model_key} ${r.price} vs ${r.expectedPrice}`), [], 'approved reference-bonus arithmetic');
  // Only Cashify's own contradictory outcomes go to inspection: calls failure with other faults, ten or more simultaneous faults.
  assert.ok(rows.filter(r => !r.ok).every(r => r.code === 'MANUAL_INSPECTION_REQUIRED' && (r.m.deviations.includes('Q01') || r.m.deviations.filter(d => d.startsWith('F')).length >= 10)),
    'nothing else is sent to inspection');
  assert.ok(summary.within20 >= 0.95 && summary.within100 >= 0.975 && summary.mae <= 30, JSON.stringify(summary));
  assert.ok(large.length <= 80, `${large.length} residuals above INR 300`);
  console.log('service reconciliation passed');
})().catch(e => { console.error(e); process.exitCode = 1; });
