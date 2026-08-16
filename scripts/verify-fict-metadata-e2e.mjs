#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tempRoot = mkdtempSync(join(tmpdir(), 'ui-primitives-fict-metadata-e2e-'))
const packDir = join(tempRoot, 'packs')
const consumerDir = join(tempRoot, 'consumer')
const keepTemp = process.env.FICT_METADATA_E2E_KEEP === '1'

const localPackages = [
  '@fictjs/use-layout-effect',
  '@fictjs/use-effect-event',
  '@fictjs/use-controllable-state',
]

const versions = {
  runtime: readCatalogVersion('@fictjs/runtime'),
  jsdom: readCatalogVersion('jsdom'),
  typescript: readCatalogVersion('typescript'),
  fict: readPackageDependency('apps/playground/package.json', 'fict'),
  vitePlugin: readPackageDependency('apps/playground/package.json', '@fictjs/vite-plugin'),
  vite: readPackageDependency('apps/playground/package.json', 'vite'),
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    stdio: options.stdio ?? 'inherit',
  })
}

function capture(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeVersion(value) {
  return value.replace(/^[~^]/, '')
}

function readCatalogVersion(name) {
  const workspace = readFileSync(join(repoRoot, 'pnpm-workspace.yaml'), 'utf8')
  const quoted = new RegExp(`^\\s*'${escapeRegExp(name)}':\\s*(\\S+)`, 'm')
  const unquoted = new RegExp(`^\\s*${escapeRegExp(name)}:\\s*(\\S+)`, 'm')
  const match = workspace.match(quoted) ?? workspace.match(unquoted)
  if (!match?.[1]) {
    throw new Error(`Could not find catalog version for ${name}`)
  }
  return normalizeVersion(match[1])
}

function readPackageDependency(packageJsonPath, name) {
  const pkg = JSON.parse(readFileSync(join(repoRoot, packageJsonPath), 'utf8'))
  const version = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]
  if (!version) {
    throw new Error(`Could not find ${name} in ${packageJsonPath}`)
  }
  if (version === 'catalog:') {
    return readCatalogVersion(name)
  }
  return normalizeVersion(version)
}

function packageDirForName(name) {
  const candidates = ['packages', 'libs'].flatMap((root) => {
    const rootDir = join(repoRoot, root)
    if (!existsSync(rootDir)) return []
    return readdirSync(rootDir).map((child) => join(rootDir, child))
  })

  for (const candidate of candidates) {
    const packageJsonPath = join(candidate, 'package.json')
    if (!existsSync(packageJsonPath)) continue
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    if (pkg.name === name) return candidate
  }

  throw new Error(`Could not find workspace package ${name}`)
}

function packPackage(name) {
  const output = capture('pnpm', ['--filter', name, 'pack', '--pack-destination', packDir])
  const tarballPath = output
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .reverse()
    .find((line) => line.endsWith('.tgz'))

  if (!tarballPath) {
    throw new Error(`Could not find pnpm pack tarball path for ${name}`)
  }

  return resolve(packageDirForName(name), tarballPath)
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeConsumerProject(tarballs) {
  mkdirSync(join(consumerDir, 'src'), { recursive: true })

  const overrides = Object.entries(tarballs)
    .map(([name, tarball]) => `  ${JSON.stringify(name)}: ${JSON.stringify(`file:${tarball}`)}`)
    .join('\n')

  writeJson(join(consumerDir, 'package.json'), {
    name: 'ui-primitives-fict-metadata-e2e',
    private: true,
    type: 'module',
    scripts: {
      build: 'vite build',
    },
    dependencies: {
      '@fictjs/runtime': versions.runtime,
      '@fictjs/use-controllable-state': `file:${tarballs['@fictjs/use-controllable-state']}`,
      '@fictjs/use-effect-event': `file:${tarballs['@fictjs/use-effect-event']}`,
      '@fictjs/use-layout-effect': `file:${tarballs['@fictjs/use-layout-effect']}`,
      fict: versions.fict,
    },
    devDependencies: {
      '@fictjs/vite-plugin': versions.vitePlugin,
      jsdom: versions.jsdom,
      typescript: versions.typescript,
      vite: versions.vite,
    },
  })

  writeFileSync(
    join(consumerDir, 'pnpm-workspace.yaml'),
    `packages:\n  - .\n\noverrides:\n${overrides}\n`,
    'utf8',
  )

  writeFileSync(
    join(consumerDir, 'index.html'),
    `<!doctype html>
<html lang="en">
  <body>
    <main id="app"></main>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    'utf8',
  )

  writeFileSync(
    join(consumerDir, 'vite.config.ts'),
    `import fict from '@fictjs/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [fict({ cache: false })],
  build: {
    minify: false,
    sourcemap: false,
    target: 'es2022',
  },
})
`,
    'utf8',
  )

  writeFileSync(
    join(consumerDir, 'src/main.tsx'),
    `import { render } from 'fict'
import { useControllableState } from '@fictjs/use-controllable-state'

function App() {
  const state = useControllableState<number>({
    defaultProp: 2,
    onChange: () => {},
  })
  const doubled = state[0] * 2
  const label = 'count:' + state[0] + ';doubled:' + doubled

  return (
    <button
      id="counter"
      data-count={state[0]}
      data-doubled={doubled}
      data-label={label}
      onClick={() => state[1](previous => previous + 1)}
    >
      {label}
    </button>
  )
}

render(() => <App />, document.getElementById('app')!)
`,
    'utf8',
  )
}

function builtJsPath() {
  const assetsDir = join(consumerDir, 'dist', 'assets')
  const files = readdirSync(assetsDir).filter((file) => file.endsWith('.js'))
  if (files.length !== 1) {
    throw new Error(`Expected one built JS asset, found ${files.join(', ')}`)
  }
  return join(assetsDir, files[0])
}

function buildConsumer() {
  rmSync(join(consumerDir, 'dist'), { recursive: true, force: true })
  rmSync(join(consumerDir, 'node_modules', '.vite'), { recursive: true, force: true })
  run('pnpm', ['exec', 'vite', 'build'], { cwd: consumerDir })
  return readFileSync(builtJsPath(), 'utf8')
}

function assertPositiveCompilerOutput(code) {
  if (!/=>\s*[$A-Z_a-z][$\w]*\s*\[\s*0\s*\]\(\)\s*\*\s*2/.test(code)) {
    throw new Error('Expected metadata to make doubled read the hook tuple accessor')
  }
}

function assertNegativeCompilerOutput(code) {
  if (/=>\s*[$A-Z_a-z][$\w]*\s*\[\s*0\s*\]\(\)\s*\*\s*2/.test(code)) {
    throw new Error('Metadata negative control still compiled the hook tuple accessor')
  }
}

function removeInstalledFictMetadata() {
  const packageJsonPath = join(
    consumerDir,
    'node_modules',
    '@fictjs',
    'use-controllable-state',
    'package.json',
  )
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  delete pkg.fict
  delete pkg.fictMetadata
  writeJson(packageJsonPath, pkg)
}

function runRuntimeCheck() {
  const checkPath = join(consumerDir, 'runtime-check.mjs')
  const moduleUrl = pathToFileURL(builtJsPath()).href
  writeFileSync(
    checkPath,
    `import { strict as assert } from 'node:assert'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><main id="app"></main></body></html>', {
  url: 'http://localhost/',
})

globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.Node = dom.window.Node
globalThis.Element = dom.window.Element
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.MutationObserver = dom.window.MutationObserver
globalThis.Event = dom.window.Event
globalThis.MouseEvent = dom.window.MouseEvent
globalThis.CustomEvent = dom.window.CustomEvent
globalThis.queueMicrotask = dom.window.queueMicrotask.bind(dom.window)

await import(${JSON.stringify(moduleUrl)})
await new Promise(resolve => setTimeout(resolve, 0))

const button = document.getElementById('counter')
assert.ok(button, 'counter button should render')
assert.equal(button.dataset.count, '2')
assert.equal(button.dataset.doubled, '4')
assert.equal(button.dataset.label, 'count:2;doubled:4')

button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
await new Promise(resolve => setTimeout(resolve, 0))

assert.equal(button.dataset.count, '3')
assert.equal(button.dataset.doubled, '6')
assert.equal(button.dataset.label, 'count:3;doubled:6')
`,
    'utf8',
  )

  const result = spawnSync(process.execPath, [checkPath], {
    cwd: consumerDir,
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    throw new Error(`Runtime check failed:\n${result.stdout ?? ''}${result.stderr ?? ''}`.trim())
  }
}

try {
  mkdirSync(packDir, { recursive: true })

  run('pnpm', ['--filter', '@fictjs/use-controllable-state...', 'build'])

  const tarballs = Object.fromEntries(localPackages.map((name) => [name, packPackage(name)]))
  writeConsumerProject(tarballs)

  run('pnpm', ['install', '--ignore-scripts'], { cwd: consumerDir })

  const positiveCode = buildConsumer()
  assertPositiveCompilerOutput(positiveCode)
  runRuntimeCheck()

  removeInstalledFictMetadata()
  const negativeCode = buildConsumer()
  assertNegativeCompilerOutput(negativeCode)

  console.log(
    `Fict metadata e2e passed with ${basename(tarballs['@fictjs/use-controllable-state'])}`,
  )
} finally {
  if (keepTemp) {
    console.log(`Kept temp directory: ${tempRoot}`)
  } else {
    rmSync(tempRoot, { recursive: true, force: true })
  }
}
