/** Lists the iPhone 11/12/13 catalog variants with their catalog and snapshot reference prices (read-only). */
import { SEED_DEVICES } from '../../lib/seed_devices';
import materialized from '../../lib/cashify_prices.json';
import { materializedSnapshotKey } from '../../lib/pricing/engine';

const rows = (SEED_DEVICES as any[]).filter(d => String(d.brand).toLowerCase() === 'apple' && /iphone (11|12|13)\b/i.test(d.model));
const seen = new Set<string>();
for (const d of rows) {
  const key = `${d.model}|${d.storage}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const snap = (materialized as Record<string, number>)[materializedSnapshotKey(d.model, d.storage)];
  console.log(`${String(d.model).padEnd(28)} ${String(d.storage).padEnd(14)} ram=${String(d.ram).padEnd(5)} catalogBase=${String(d.basePrice).padEnd(7)} snapshot=${snap}`);
}
console.log('variants:', seen.size);
