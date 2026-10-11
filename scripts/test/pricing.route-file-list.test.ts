import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { resolvePricingReleaseConfig } from '../../lib/pricing/releaseConfig';
import { loadReleaseRouteEvidence } from '../../lib/pricing/releaseRouteEvidence';

const root = process.cwd();
const first = 'scripts/pricing/fixtures/release-route-evidence-2026-10-03-expansion.json';
const second = 'scripts/pricing/fixtures/release-route-evidence-2026-10-02.json';
assert(fs.existsSync(second));
const config = resolvePricingReleaseConfig({ PRICING_RELEASE_CANDIDATE: 'hybrid', PRICING_RELEASE_ROUTE_EVIDENCE_FILE: `${first}, ${second}` }, root);
assert.equal(config.routeEvidenceFile, [...new Set([...JSON.parse(fs.readFileSync('config/pricing-release.json', 'utf8')).routeEvidenceFile.split(','), first, second].map(f => path.resolve(root, f)))].join(','), 'resolve every manifest against application root');
assert.throws(() => loadReleaseRouteEvidence(`${path.resolve(root, first)},${path.resolve(root, first)}`), /Duplicate/, 'duplicate routes fail closed');
assert.throws(() => loadReleaseRouteEvidence(`${path.resolve(root, first)},${path.resolve(root, 'missing.json')}`), /ENOENT/, 'missing listed file fails closed');
const current = resolvePricingReleaseConfig({}, root);
const routes = loadReleaseRouteEvidence(current.routeEvidenceFile!);
assert(routes.length > 0);
console.log(`PASS per-file resolution, duplicate and missing-file rejection, ${routes.length} configured routes`);
