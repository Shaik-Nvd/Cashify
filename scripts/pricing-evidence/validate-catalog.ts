/**
 * Validate every model/variant label found in the Cashify quotes against the repository catalog (lib/seed_devices.ts).
 * Nothing is silently mapped: each variant is reported as exact, normalised (capacity matched but the storage string
 * is spelled differently), duplicated, or missing, and RAM / base-price disagreements are listed.
 *
 *   npx tsx scripts/pricing-evidence/validate-catalog.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { EVIDENCE_DIR, catalogCandidates, loadMeasurements } from './evidenceLib';

const ms = loadMeasurements();
const variants = new Map<string, { model: string; storage: string; storageGb: number; ram: Set<number>; getUpto: Map<string, Set<number>>; n: number; sources: Set<string> }>();
for (const m of ms) {
  const k = `${m.model_key}|${m.storage_gb}`;
  const v = variants.get(k) ?? { model: m.model_key, storage: m.storage, storageGb: m.storage_gb, ram: new Set<number>(), getUpto: new Map(), n: 0, sources: new Set<string>() };
  if (m.ram_gb) v.ram.add(m.ram_gb);
  const set = v.getUpto.get(m.observed_date ?? 'unknown') ?? new Set<number>();
  set.add(m.variant_get_upto); v.getUpto.set(m.observed_date ?? 'unknown', set);
  v.n++; v.sources.add(m.archive);
  variants.set(k, v);
}
const rows = [...variants.values()].sort((a, b) => a.model.localeCompare(b.model) || a.storageGb - b.storageGb).map(v => {
  const cands = catalogCandidates(v.model, v.storageGb);
  const exactLabel = cands.find(c => c.storage.replace(/\s+/g, '').toUpperCase() === v.storage.toUpperCase());
  const issues: string[] = [];
  if (!cands.length) issues.push('NOT_IN_CATALOG');
  else {
    if (cands.length > 1) issues.push(`DUPLICATE_CATALOG_ENTRIES(${cands.length}): ${cands.map(c => `"${c.storage}"`).join(', ')}`);
    if (!exactLabel) issues.push(`STORAGE_SPELLING_DIFFERS: catalog "${cands[0].storage}" vs evidence "${v.storage}"`);
    const ramNum = (r: string | null) => (r ? Number((r.match(/(\d+)/) ?? [])[1]) : null);
    for (const r of v.ram) for (const c of cands) if (ramNum(c.ram) != null && ramNum(c.ram) !== r) issues.push(`RAM_MISMATCH: evidence ${r} GB vs catalog "${c.ram}" (${c.storage})`);
    const allUpto = [...v.getUpto.values()].flatMap(s => [...s]);
    const latest = [...v.getUpto.entries()].sort((a, b) => a[0].localeCompare(b[0])).pop()![1];
    const c0 = cands[0];
    if (c0.basePrice != null && latest.size && ![...latest].some(x => Math.abs(x - c0.basePrice!) <= 0.05 * x)) {
      issues.push(`CATALOG_BASE_PRICE_FAR_FROM_CASHIFY: catalog ${c0.basePrice} vs Cashify Get Upto ${[...latest].join('/')}`);
    }
    void allUpto;
  }
  return {
    model: v.model, storage: v.storage, ramEvidenceGb: [...v.ram], quotes: v.n, archives: v.sources.size,
    catalog: cands.map(c => ({ id: c.id, model: c.model, storage: c.storage, ram: c.ram, basePrice: c.basePrice })),
    status: !cands.length ? 'MISSING' : issues.length ? 'FLAGGED' : 'OK', issues,
    cashifyGetUptoByDate: Object.fromEntries([...v.getUpto.entries()].sort().map(([d, s]) => [d, [...s]])),
  };
});
fs.writeFileSync(path.join(EVIDENCE_DIR, 'catalog_validation.json'), JSON.stringify(rows, null, 1) + '\n');
const counts = { variants: rows.length, OK: rows.filter(r => r.status === 'OK').length, FLAGGED: rows.filter(r => r.status === 'FLAGGED').length, MISSING: rows.filter(r => r.status === 'MISSING').length };
console.log(counts);
for (const r of rows.filter(x => x.status !== 'OK')) console.log(`${r.status.padEnd(7)} ${r.model} ${r.storage}: ${r.issues.join(' | ')}`);
