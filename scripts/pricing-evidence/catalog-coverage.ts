/**
 * Which catalog iPhone variants are answered by what: recorded Cashify quotes (exact), the calibrated rules, or the existing engine.
 *   npx tsx scripts/pricing-evidence/catalog-coverage.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { SEED_DEVICES } from '../../lib/seed_devices';
import { EXACT } from '../../lib/pricing/appleCashifyModel/exact';
import { SCOPE, evidenceModelKey, storageGbOf } from '../../lib/pricing/appleCashifyModel/scope';
import calibration from '../../lib/pricing/appleCashifyModel/calibration.json';

const profiles = (calibration as any).models as Record<string, any>;
const rows: any[] = [];
for (const d of SEED_DEVICES as any[]) {
  if (d.brand !== 'Apple' || typeof d.model !== 'string' || typeof d.storage !== 'string') continue;
  const key = evidenceModelKey(d.model); const gb = storageGbOf(d.storage);
  const enabled = !!SCOPE.models[key]?.enabled && !!profiles[key];
  const recorded = gb != null ? Object.keys(EXACT.models[key]?.[String(gb)] ?? {}).length : 0;
  const route = enabled ? (recorded ? 'rules + recorded quotes' : 'rules only (storage not recorded)') : recorded ? 'recorded quotes only; other answers: existing engine' : 'existing engine';
  rows.push({ model: d.model, storage: d.storage, recordedConfigurations: recorded, route });
}
const byModel = new Map<string, any[]>();
for (const r of rows) (byModel.get(r.model) ?? byModel.set(r.model, []).get(r.model)!).push(r);
const out: string[] = ['| model | variants | route | recorded configurations per variant |', '|---|---|---|---|'];
for (const [model, rs] of byModel) {
  const routes = [...new Set(rs.map(r => r.route))].join('; ');
  out.push(`| ${model} | ${rs.map(r => r.storage).join(', ')} | ${routes} | ${rs.map(r => r.recordedConfigurations).join(' / ')} |`);
}
fs.writeFileSync(path.resolve(__dirname, '../../data/pricing-evidence/catalog_coverage.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
