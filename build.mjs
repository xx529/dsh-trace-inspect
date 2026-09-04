/**
 * dsh-turn-outline build: host half (plain ESM, cordis {inject, apply}) and
 * client half (a `window.__ModuleLoader__.load({id, factory})` lazy-CJS
 * bundle, mirroring the format every DSH web client plugin ships).
 *
 * The client bundle:
 *  - compiles TSX with the CLASSIC JSX runtime (React.createElement) so the
 *    emitted code only needs `require('react')` — a guaranteed platform seed;
 *  - keeps `react` / `react-dom` external — the factory's `require` resolves
 *    them from the client module system;
 *  - registers itself under the package name (the graph row id).
 */
import { build } from 'esbuild'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)))
const outdir = resolve(root, 'lib')

rmSync(outdir, { recursive: true, force: true })
mkdirSync(outdir, { recursive: true })

const shared = {
  bundle: true,
  sourcemap: true,
  target: 'es2020',
  logLevel: 'info',
  absWorkingDir: root,
}

// ── Host half: plain ESM entry for the cordis loader ─────────────────────
await build({
  ...shared,
  entryPoints: [resolve(root, 'src/index.ts')],
  outfile: resolve(outdir, 'index.js'),
  format: 'esm',
  platform: 'node',
})

// ── Client half: __ModuleLoader__ lazy-CJS bundle ────────────────────────
const banner = `window.__ModuleLoader__.load({
  id: 'dsh-turn-outline',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
`
const footer = `
    return module.exports;
  },
});
`

await build({
  ...shared,
  entryPoints: [resolve(root, 'src/client/index.tsx')],
  outfile: resolve(outdir, 'client.js'),
  format: 'cjs',
  platform: 'browser',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  external: ['react', 'react-dom'],
  banner: { js: banner },
  footer: { js: footer },
})

console.log('build ok → lib/index.js + lib/client.js')

// ── Post-build contract check (the client loader depends on these) ───────
const client = readFileSync(resolve(outdir, 'client.js'), 'utf8')
const failures = []
if (!client.includes('window.__ModuleLoader__.load(')) failures.push('missing __ModuleLoader__.load wrapper')
if (!client.includes("id: 'dsh-turn-outline'")) failures.push('missing bundle id registration')
if (!client.includes('require("react")')) failures.push('missing react external require')
if (!client.includes('exports.apply') && !client.includes('apply:')) failures.push('missing apply export')
const host = readFileSync(resolve(outdir, 'index.js'), 'utf8')
if (!host.includes('webServer') || !host.includes('sessionQuery')) failures.push('host inject missing')
if (failures.length > 0) {
  console.error('bundle contract check FAILED:\n  - ' + failures.join('\n  - '))
  process.exit(1)
}
console.log('bundle contract check ok')

