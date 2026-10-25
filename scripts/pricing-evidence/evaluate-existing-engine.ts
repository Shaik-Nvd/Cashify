/**
 * Runs the CURRENT production iPhone condition engine (priceDevice -> calculateApplePrice, legacy path,
 * no database) over every observed Cashify measurement and records the signed error.
 *
 *   npx tsx scripts/pricing-evidence/evaluate-existing-engine.ts
 *
 * Reference price per measurement = Cashify's Get Upto for that exact variant on that day
 * (verified equal to the flawless quote's base price). No production database is read or written.
 */
import fs from 'node:fs';
import path from 'node:path';
import { priceDevice, PricingInvariantError } from '../../lib/pricing/engine';
import { EVIDENCE_DIR, loadMeasurements, modelSemantics, toDiagnostics, stats, resolveCatalog } from './evidenceLib';

const ms = loadMeasurements();
const semantics = modelSemantics(ms);
const out: any[] = [];
const missingCatalog = new Map<string, number>();
for (const m of ms) {
  const device = resolveCatalog(m.model_key, m.storage_gb).hit;
  if (!device) { missingCatalog.set(`${m.model_key} ${m.storage}`, (missingCatalog.get(`${m.model_key} ${m.storage}`) ?? 0) + 1); }
  const sem = semantics.get(m.model_key)!;
  const diag = toDiagnostics(m);
  let engine: any = null; let error: string | null = null;
  try {
    const r = priceDevice('Apple', device?.model ?? `Apple ${m.model_key}`, m.variant_get_upto, diag,
      { warrantyMode: sem.warrantyMode, billMode: sem.billMode, ageMode: sem.ageMode } as any, device?.storage ?? m.storage, { disableAppleEvidence: true });
    engine = r;
  } catch (e: any) {
    error = e instanceof PricingInvariantError ? `invariant: ${e.message}` : String(e?.message ?? e);
  }
  out.push({
    measurement_id: m.measurement_id, model: m.model_key, storage: m.storage, date: m.observed_date, class: m.class, n_dev: m.n_dev,
    outcome: m.outcome, reference: m.variant_get_upto, base: m.base, selling: m.selling, payout: m.payout,
    engine_equivalent: engine?.cashifyConditionEquivalent ?? null, engine_price: engine?.fhoneifyPrice ?? null, error,
    in_catalog: !!device, deviations: m.deviations,
  });
}
fs.writeFileSync(path.join(EVIDENCE_DIR, 'engine_existing_results.jsonl'), out.map(o => JSON.stringify(o)).join('\n') + '\n');

const num = out.filter(o => o.outcome === 'NUMERIC_QUOTE' && o.engine_equivalent != null && o.base != null);
const err = (o: any) => o.engine_equivalent - o.base; // engine's Cashify-equivalent vs Cashify base price (same basis as the Get Upto reference)
const show = (label: string, rows: any[]) => {
  const e = rows.map(err); const a = e.map(Math.abs); const s = stats(a);
  const over = e.filter(x => x > 0).length;
  console.log(`${label.padEnd(30)} n=${String(s.n).padStart(4)} MAE=${s.mean.toFixed(0).padStart(6)} med=${s.median.toFixed(0).padStart(6)} p90=${s.p90.toFixed(0).padStart(6)} p95=${s.p95.toFixed(0).padStart(6)} max=${s.max.toFixed(0).padStart(7)} over%=${(100 * over / rows.length).toFixed(0)}`);
};
console.log('rows', out.length, 'numeric evaluated', num.length, 'engine errors', out.filter(o => o.error).length, 'not in catalog', [...missingCatalog.entries()]);
show('ALL', num);
const group = (key: (o: any) => string) => {
  const g = new Map<string, any[]>();
  for (const o of num) (g.get(key(o)) ?? g.set(key(o), []).get(key(o))!).push(o);
  return [...g.entries()].sort((a, b) => a[0].localeCompare(b[0]));
};
console.log('-- by class'); for (const [k, v] of group(o => o.class)) show(k, v);
console.log('-- by model'); for (const [k, v] of group(o => o.model)) show(k, v);
console.log('-- errors'); const errs = new Map<string, number>(); for (const o of out) if (o.error) errs.set(o.error, (errs.get(o.error) ?? 0) + 1); console.log([...errs.entries()]);
