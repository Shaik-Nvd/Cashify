/** Build a sanitized compiled API review artifact. Does not start the server or run database commands. */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = process.cwd();
const output = path.resolve(process.argv[2] || 'scratch/api-runtime-review');
if (!output.startsWith(path.resolve(root) + path.sep) || fs.existsSync(output)) throw Error('Use a new output directory inside this checkout');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const copy = file => {
 const source = path.resolve(root, file), target = path.resolve(output, file);
 if (!source.startsWith(root + path.sep) || !target.startsWith(output + path.sep)) throw Error('Artifact path escapes root');
 fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(source, target);
};
const config = JSON.parse(fs.readFileSync('config/pricing-release.json', 'utf8'));
const routes = config.routeEvidenceFile.split(',').map(p => p.trim());
for (const file of routes) if (!fs.existsSync(file)) throw Error('Missing configured route manifest');
const compiler = require.resolve('typescript/bin/tsc');
cp.execFileSync(process.execPath, [compiler, '-p', 'tsconfig.server.json', '--outDir', output], { stdio: 'inherit' });
copy('config/pricing-release.json');
for (const file of routes) copy(file);
// Read-only materialized data used by normal file/snapshot fallbacks; no session files or credentials.
function copyData(dir) { for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
 const file = path.join(dir, e.name); if (e.isDirectory()) copyData(file); else if (e.name.endsWith('.json') && !e.name.includes('refresh-runs')) copy(file);
} }
copyData('server/data');
copy('package.json'); copy('package-lock.json'); copy('prisma/schema.prisma');
// Compiler includes repository server diagnostic scripts; these are not production entrypoints.
for (const e of fs.readdirSync(path.join(output, 'server'))) if (/^test.*\.js$/.test(e)) fs.unlinkSync(path.join(output, 'server', e));
const files = [];
function walk(dir) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) walk(f); else files.push(f); } }
walk(output);
const manifest = { format: 'compiled-api-review-artifact/1', builtAt: new Date().toISOString(),
 entrypoint: 'node server/server.js (from artifact root; dependencies installed separately)',
 noServerStarted: true, noDatabaseCommands: true, noSessionOrEnvFiles: true,
 configuredRouteFiles: routes.map(file => ({ file, sha256: hash(fs.readFileSync(path.join(output, file))), sourceSha256: hash(fs.readFileSync(path.join(root, file))) })),
 sourceInputs: ['server/modules/quote/pricing.ts', 'lib/pricing/pricingService.ts', 'lib/pricing/appleVariantDispatch.ts', 'lib/pricing/exactFinalQuoteFile.ts', 'lib/pricing/releaseConfig.ts', 'scripts/pricing/exact-final-quote-evidence.ts', 'config/pricing-release.json', ...routes,
  'scripts/pricing/fixtures/exact-captures-2026-10-10.json', 'scripts/pricing/fixtures/exact-captures-2026-10-11-iphone12.json', 'scripts/pricing/fixtures/release-candidate-observations-2026-10-02.json']
  .map(file => ({ file, sha256: hash(fs.readFileSync(path.join(root, file))) })),
 files: files.sort().map(file => ({ file: path.relative(output, file).replace(/\\/g, '/'), bytes: fs.statSync(file).size, sha256: hash(fs.readFileSync(file)) })) };
if (manifest.files.some(f => /(^|\/)(\.env|cashify.session|cashify-sessions)/i.test(f.file))) throw Error('Disallowed runtime material');
for (const file of manifest.configuredRouteFiles) if (file.sha256 !== file.sourceSha256) throw Error('Route build hash mismatch');
fs.writeFileSync(path.join(output, 'runtime-artifact-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ artifact: output, files: files.length + 1, routeFiles: routes.length, noSessionOrEnvFiles: true }));
