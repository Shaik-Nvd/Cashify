/**
 * Marks every calibrated iPhone model as served by the calibrated rules (scope.json). decide-scope.ts normally derives each model's
 * entry from held-out validation and may switch a model back to the existing engine; this writes the starting point so the rules
 * can be evaluated through the production path before that decision.
 *
 *   npx tsx scripts/pricing-evidence/enable-all-scope.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import calibrationJson from '../../lib/pricing/appleCashifyModel/calibration.json';
import type { Calibration } from '../../lib/pricing/appleCashifyModel/model';

const CAL = calibrationJson as unknown as Calibration;
const out: { version: string; models: Record<string, unknown> } = { version: 'scope/2026-10-28-working', models: {} };
for (const [key, profile] of Object.entries(CAL.models)) {
  out.models[key] = { enabled: true, inferredPolicy: 'price', storagesGb: profile.storagesGb, reason: 'working scope: calibrated rules evaluated before the held-out decision' };
}
out.models['iPhone 12 Mini'] = { enabled: true, inferredPolicy: 'price', storagesGb: [], fallbackFrom: 'iPhone 12', reason: 'working scope: no quotes of its own, iPhone 12 values labelled inferred' };
fs.writeFileSync(path.resolve(__dirname, '../../lib/pricing/appleCashifyModel/scope.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`enabled ${Object.keys(out.models).length} models`);
