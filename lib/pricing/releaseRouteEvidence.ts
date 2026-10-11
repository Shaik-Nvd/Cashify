/** Server-only explicit reviewed route input. No fallback or inferred modes. */
import fs from 'node:fs';
import { z } from 'zod';
import type { WorkbookRouteEvidence } from './teamWorkbookResearchQuoteService';
const mode = z.enum(['ASKED', 'NOT_ASKED', 'UNKNOWN']);
const row = z.object({
  brand: z.string().min(1), model: z.string().min(1), storage: z.string().min(1),
  source: z.literal('VERIFIED_COLLECTOR_TRACE'), status: z.literal('OK'),
  observedAt: z.string().datetime(), evidenceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  baselineGetUpto: z.number().positive().optional(),
  semantics: z.object({ warrantyMode: mode, billMode: mode, ageMode: mode }),
  boxMode: mode, chargerMode: mode, sPenMode: mode, eSimMode: mode,
});
/** `file` may name several manifests separated by commas; identities must stay unique across all of them. */
export function loadReleaseRouteEvidence(file?: string): readonly WorkbookRouteEvidence[] {
  if (!file) return [];
  const manifest = z.object({ version: z.string().min(1), rows: z.array(row) });
  const parsed = { rows: file.split(',').map(f => f.trim()).filter(Boolean)
    .flatMap(f => manifest.parse(JSON.parse(fs.readFileSync(f, 'utf8'))).rows) };
  const keys = parsed.rows.map(r => `${r.brand}|${r.model}|${r.storage.replace(/\s+/g, '').toLowerCase()}`);
  if (new Set(keys).size !== keys.length) throw new Error('Duplicate release route evidence identity');
  return parsed.rows;
}
