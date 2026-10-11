/** Import existing verified automatic captures without changing prices, answers, dates or roles. */
import fixture from './fixtures/release-candidate-observations-2026-10-02.json';
import iphoneCaptures from './fixtures/exact-captures-2026-10-10.json';
import iphone12Captures from './fixtures/exact-captures-2026-10-11-iphone12.json';
import { createExactFinalQuoteIndex, type ExactFinalQuoteEvidence } from '../../lib/pricing/exactFinalQuote';
export function existingExactFinalQuoteEvidence(): ExactFinalQuoteEvidence[] {
  const historical = (fixture.observations as any[]).filter(o => !o.excluded && o.provenance?.type === 'AUTOMATIC_COLLECTOR_OBSERVATION').map(o => ({
    id: o.id, brand: o.brand, model: o.model, storage: o.storage, getUpto: o.getUpto, sellingPrice: o.observed,
    observedAt: o.collectedAt, screenshotSha256: o.screenshotSha256, route: o.route, diagnostics: o.diagnostics,
    provenance: { screenshotVerified: o.provenance.screenshotVerified, planMatched: o.provenance.planMatched,
      routeComplete: o.provenance.routeComplete, source: fixture.version, role: o.provenance.evaluationRole },
  }));
  // Reviewed traced captures in the manifest format built by scripts/pricing-research/build-exact-evidence.ts.
  // Rows are matched only at their own captured Get Upto and with current route/profile evidence, so a
  // moved reference misses and the hybrid result stays in place.
  return [...historical, ...(iphoneCaptures.rows as ExactFinalQuoteEvidence[]), ...(iphone12Captures.rows as ExactFinalQuoteEvidence[])];
}
export function existingExactFinalQuoteIndex() { return createExactFinalQuoteIndex(existingExactFinalQuoteEvidence()); }
