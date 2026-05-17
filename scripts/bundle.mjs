#!/usr/bin/env node
/**
 * @swarmai/cli-tools — closed-source bundler.
 *
 * Same architecture as the SwarmAI monorepo's `scripts/bundle.mjs`:
 *   - All local `src/*.ts` files are esbuild-bundled + minified into ONE
 *     `dist/index.js` so the published tarball doesn't ship the readable
 *     per-file source layout.
 *   - `@swarmai/*` peer deps stay external — the host gateway provides
 *     them at runtime via the peer-dep contract.
 *   - Third-party runtime deps (`yaml`) stay external — resolved by the
 *     end user's `npm install`.
 *   - `node:*` builtins always external (esbuild's `platform: 'node'`).
 *   - `.d.ts` files are emitted separately by `tsc --emitDeclarationOnly`
 *     so TypeScript consumers still get types.
 *
 * The bundled JS is reversible by a determined RE in 3-6 hours with
 * webcrack / wakaru — the legal moat is the EULA + license-key
 * activation (when added), not obfuscation. This is the same posture
 * as the flagship `@northpeak/swarmai` bundle.
 */
import { build } from 'esbuild';
import { rmSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, '..');
const OUT = join(PLUGIN_ROOT, 'dist');

console.log(`[bundle] @swarmai/cli-tools`);
console.log(`[bundle] root: ${PLUGIN_ROOT}`);
console.log(`[bundle] out:  ${OUT}`);

// Wipe + recreate dist/ so stale tsc output never leaks into the bundle.
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const EXTERNAL = [
  // Host-provided peer deps — never bundle these.
  '@swarmai/*',
  // Runtime deps declared in package.json — resolved by `npm install`.
  'yaml',
];

const t0 = Date.now();
await build({
  entryPoints: [join(PLUGIN_ROOT, 'src/index.ts')],
  bundle: true,
  minify: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: join(OUT, 'index.js'),
  external: EXTERNAL,
  absWorkingDir: PLUGIN_ROOT,
  legalComments: 'none',
  treeShaking: true,
  // No sourcemap — this is the closed-source artefact.
  sourcemap: false,
});
console.log(`[bundle] esbuild done in ${Date.now() - t0}ms`);

// Emit .d.ts files via tsc. Run with --emitDeclarationOnly so it doesn't
// re-emit the unminified .js (which would defeat the bundle).
console.log(`[bundle] tsc --emitDeclarationOnly`);
execSync('npx tsc --emitDeclarationOnly --declarationMap false --sourceMap false', {
  cwd: PLUGIN_ROOT,
  stdio: 'inherit',
});

// Final inventory.
const jsSize = statSync(join(OUT, 'index.js')).size;
console.log(`[bundle] dist/index.js = ${(jsSize / 1024).toFixed(1)} KiB`);
console.log(`[bundle] done`);
