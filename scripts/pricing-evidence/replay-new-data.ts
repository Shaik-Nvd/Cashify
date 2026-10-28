/**
 * Replays the audited 2026-10-28 Cashify quotes through the production calculation path with the recorded-quote index
 * bypassed, so only the rules can answer. In-sample unless a held-out partition is named; see validate-new-data.ts for that.
 *
 *   npx tsx scripts/pricing-evidence/replay-new-data.ts [--out=<jsonl>] [--models=iPhone 12,iPhone 13]
 *
 * DATABASE_URL is never read. Each quote is evaluated at the reference proxy recorded with it (the flawless quote of
 * its report), the same value the fit used.
 */
import fs from 'node:fs';
import path from 'node:path';
import { priceDevice } from '../../lib/pricing/engine';
import { InspectionRequiredError } from '../../lib/pricing/inspectionRequired';
import { EVIDENCE_DIR, hasUnknownInput, loadMeasurements, modelSemantics, resolveCatalog, stats, toDiagnostics, type Measurement } from './evidenceLib';

export type ReplayRow = { m: Measurement; kind: 'PRICE' | 'INSPECTION' | 'ERROR'; price?: number; error?: number; note?: string };

export function replay(ms: Measurement[], semantics: ReturnType<typeof modelSemantics>): ReplayRow[] {
  return ms.map(m => {
    const device = resolveCatalog(m.model_key, m.storage_gb).hit;
    const sem = semantics.get(m.model_key)!;
    try {
      const r = priceDevice('Apple', device?.model ?? `Apple ${m.model_key}`, m.variant_get_upto, toDiagnostics(m, 'none'),
        { warrantyMode: sem.warrantyMode, billMode: sem.billMode, ageMode: sem.ageMode } as any, device?.storage ?? m.storage,
        { catalogStorage: device?.storage ?? m.storage });
      return { m, kind: 'PRICE' as const, price: r.cashifyConditionEquivalent, error: r.cashifyConditionEquivalent - m.base! };
    } catch (e: any) {
      if (e instanceof InspectionRequiredError || e?.name === 'InspectionRequiredError') return { m, kind: 'INSPECTION' as const, note: String(e.message).slice(0, 120) };
      return { m, kind: 'ERROR' as const, note: String(e?.message ?? e).slice(0, 120) };
    }
  });
}

export function summarize(rows: ReplayRow[]) {
  const priced = rows.filter(r => r.kind === 'PRICE');
  const abs = priced.map(r => Math.abs(r.error!));
  const s = stats(abs);
  const rel = priced.map(r => Math.abs(r.error!) / r.m.base!);
  const n = (f: (x: number) => boolean) => abs.filter(f).length;
  return {
    n: rows.length, priced: priced.length, inspection: rows.filter(r => r.kind === 'INSPECTION').length, errors: rows.filter(r => r.kind === 'ERROR').length,
    mae: Math.round(s.mean), median: Math.round(s.median), p90: Math.round(s.p90), max: Math.round(s.max),
    bias: Math.round(priced.reduce((a, r) => a + r.error!, 0) / Math.max(1, priced.length)),
    within20: +(100 * n(e => e <= 20) / Math.max(1, abs.length)).toFixed(1), within100: +(100 * n(e => e <= 100) / Math.max(1, abs.length)).toFixed(1),
    within500: +(100 * n(e => e <= 500) / Math.max(1, abs.length)).toFixed(1), within2pct: +(100 * rel.filter(e => e <= 0.02).length / Math.max(1, rel.length)).toFixed(1),
    over: priced.filter(r => r.error! > 100).length,
  };
}

export function groupOf(m: Measurement): string {
  const dev = m.deviations;
  if (!dev.length) return 'baseline';
  const f = dev.filter(d => d.startsWith('F')).length;
  if (dev.length === 1) return /^F/.test(dev[0]) ? 'single functional' : /^[SD]/.test(dev[0]) ? 'single screen' : /^[CP]/.test(dev[0]) ? 'single body' : /^Q/.test(dev[0]) ? 'single Q' : 'single age/accessory';
  if (dev.length === f) return `functional x${Math.min(f, 5)}${f > 4 ? '+' : ''}`;
  return dev.length <= 3 ? 'small mixed combo' : 'large mixed combo';
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const only = argv.find(a => a.startsWith('--models='))?.split('=')[1]?.split(',');
  const all = loadMeasurements();
  const semantics = modelSemantics(all);
  const ms = loadMeasurements(path.join(EVIDENCE_DIR, 'measurements-2026-10-28.jsonl')).filter(m => !hasUnknownInput(m) && (!only || only.includes(m.model_key)));
  const rows = replay(ms, semantics);
  const line = (k: string, s: ReturnType<typeof summarize>) => console.log(`${k.padEnd(28)} n=${String(s.n).padStart(4)} priced=${String(s.priced).padStart(4)} insp=${String(s.inspection).padStart(3)} MAE=${String(s.mae).padStart(6)} med=${String(s.median).padStart(5)} p90=${String(s.p90).padStart(6)} max=${String(s.max).padStart(6)} bias=${String(s.bias).padStart(6)} <=20:${s.within20}% <=100:${s.within100}% <=500:${s.within500}% over100=${s.over}`);
  line('ALL', summarize(rows));
  const by = (key: (r: ReplayRow) => string) => { const g = new Map<string, ReplayRow[]>(); for (const r of rows) (g.get(key(r)) ?? g.set(key(r), []).get(key(r))!).push(r); return [...g.entries()].sort((a, b) => a[0].localeCompare(b[0])); };
  console.log('\n-- by group'); for (const [k, rs] of by(r => groupOf(r.m))) line(k, summarize(rs));
  console.log('\n-- by model'); for (const [k, rs] of by(r => r.m.model_key)) line(k, summarize(rs));
  const out = argv.find(a => a.startsWith('--out='))?.split('=')[1];
  if (out) fs.writeFileSync(out, rows.map(r => JSON.stringify({ id: r.m.measurement_id, model: r.m.model_key, storage: r.m.storage_gb, date: r.m.observed_date, deviations: r.m.deviations, reference: r.m.variant_get_upto, observed: r.m.base, kind: r.kind, price: r.price ?? null, error: r.error ?? null, note: r.note ?? null })).join('\n') + '\n');
}
