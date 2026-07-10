#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
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
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const metadataPackages = {
  '@fictjs/direction': {
    dir: 'packages/direction',
    fict: { metadata: './dist/index.fict.meta.json' },
    files: {
      './dist/index.fict.meta.json': {
        version: 1,
        exports: {},
        hooks: {
          useDirection: { directAccessor: 'memo' },
        },
      },
    },
  },
  '@fictjs/id': {
    dir: 'packages/id',
    fict: { metadata: './dist/index.fict.meta.json' },
    files: {
      './dist/index.fict.meta.json': {
        version: 1,
        exports: {},
        hooks: {
          useId: { directAccessor: 'signal' },
        },
      },
    },
  },
  '@fictjs/use-controllable-state': {
    dir: 'packages/use-controllable-state',
    fict: { metadata: './dist/index.fict.meta.json' },
    files: {
      './dist/index.fict.meta.json': {
        version: 1,
        exports: {},
        hooks: {
          useControllableState: { arrayProps: { 0: 'memo' } },
          useControllableStateReducer: { arrayProps: { 0: 'memo' } },
        },
      },
    },
  },
  '@fictjs/use-is-hydrated': {
    dir: 'packages/use-is-hydrated',
    fict: { metadata: './dist/index.fict.meta.json' },
    files: {
      './dist/index.fict.meta.json': {
        version: 1,
        exports: {},
        hooks: {
          useIsHydrated: { directAccessor: 'signal' },
        },
      },
    },
  },
  '@fictjs/use-previous': {
    dir: 'packages/use-previous',
    fict: { metadata: './dist/index.fict.meta.json' },
    files: {
      './dist/index.fict.meta.json': {
        version: 1,
        exports: {},
        hooks: {
          usePrevious: { directAccessor: 'signal' },
        },
      },
    },
  },
  '@fictjs/use-rect': {
    dir: 'packages/use-rect',
    fict: { metadata: './dist/index.fict.meta.json' },
    files: {
      './dist/index.fict.meta.json': {
        version: 1,
        exports: {},
        hooks: {
          useRect: { directAccessor: 'signal' },
        },
      },
    },
  },
  '@fictjs/use-size': {
    dir: 'packages/use-size',
    fict: { metadata: './dist/index.fict.meta.json' },
    files: {
      './dist/index.fict.meta.json': {
        version: 1,
        exports: {},
        hooks: {
          useSize: { directAccessor: 'signal' },
        },
      },
    },
  },
  '@fictjs/radix-ui': {
    dir: 'packages/radix-ui',
    fict: {
      exports: {
        './internal': './dist/internal.fict.meta.json',
      },
    },
    files: {
      './dist/internal.fict.meta.json': {
        version: 1,
        exports: {},
        hooks: {
          useControllableState: { arrayProps: { 0: 'memo' } },
          useControllableStateReducer: { arrayProps: { 0: 'memo' } },
          useIsHydrated: { directAccessor: 'signal' },
          useSize: { directAccessor: 'signal' },
        },
      },
    },
  },
  '@fictjs/floating-ui-dom': {
    dir: 'libs/floating-ui-dom',
    fict: { metadata: './dist/index.fict.meta.json' },
    files: {
      './dist/index.fict.meta.json': {
        version: 1,
        exports: {},
        hooks: {
          useFloating: {
            objectProps: {
              x: 'signal',
              y: 'signal',
              strategy: 'signal',
              placement: 'signal',
              middlewareData: 'signal',
              isPositioned: 'signal',
            },
          },
        },
      },
    },
  },
  '@fictjs/use-sidecar': {
    dir: 'libs/use-sidecar',
    fict: { metadata: './dist/index.fict.meta.json' },
    files: {
      './dist/index.fict.meta.json': {
        version: 1,
        exports: {},
        hooks: {
          useSidecar: { arrayProps: { 0: 'signal', 1: 'signal' } },
        },
      },
    },
  },
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    return `{${entries
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function assertEqual(actual, expected, label) {
  if (stableStringify(actual) !== stableStringify(expected)) {
    throw new Error(`${label} does not match expected Fict metadata config`)
  }
}

function getPublishablePackages() {
  return ['packages', 'libs'].flatMap((workspaceDir) => {
    const absoluteWorkspaceDir = resolve(repoRoot, workspaceDir)

    return readdirSync(absoluteWorkspaceDir, { withFileTypes: true }).flatMap((entry) => {
      if (!entry.isDirectory()) return []

      const packageDir = join(absoluteWorkspaceDir, entry.name)
      const packageJsonPath = join(packageDir, 'package.json')
      if (!existsSync(packageJsonPath)) return []

      const pkg = readJson(packageJsonPath)
      if (pkg.private || !pkg.name) return []

      return [{ name: pkg.name, dir: relative(repoRoot, packageDir), pkg }]
    })
  })
}

function collectLocalTargets(value, targets = new Set()) {
  if (typeof value === 'string') {
    if (value.startsWith('./')) targets.add(value)
    return targets
  }

  if (Array.isArray(value)) {
    for (const nested of value) collectLocalTargets(nested, targets)
    return targets
  }

  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) collectLocalTargets(nested, targets)
  }

  return targets
}

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
}

function packagePathPattern(value) {
  const normalized = value.replace(/^\.\//, '').replace(/\\/g, '/')
  const pattern = normalized
    .split('**')
    .map((part) => escapeRegExp(part).replace(/\*/g, '[^/]*'))
    .join('.*')

  return new RegExp(`^package/${pattern}$`)
}

function packedContentsInclude(contents, value, { allowDirectory = false } = {}) {
  const normalized = value.replace(/^\.\//, '').replace(/\\/g, '/').replace(/\/$/, '')
  if (normalized.includes('*')) {
    const pattern = packagePathPattern(normalized)
    return contents.some((entry) => pattern.test(entry))
  }

  const packedPath = `package/${normalized}`
  return (
    contents.includes(packedPath) ||
    (allowDirectory && contents.some((entry) => entry.startsWith(`${packedPath}/`)))
  )
}

function verifyPackedManifestTargets(name, packedPackageJson, contents) {
  const entryTargets = collectLocalTargets([
    packedPackageJson.main,
    packedPackageJson.module,
    packedPackageJson.types,
    packedPackageJson.typings,
    packedPackageJson.bin,
    packedPackageJson.exports,
  ])

  for (const target of entryTargets) {
    if (!packedContentsInclude(contents, target)) {
      throw new Error(`${name} tarball is missing manifest target package/${target.slice(2)}`)
    }
  }

  for (const filePattern of packedPackageJson.files ?? []) {
    if (typeof filePattern !== 'string' || filePattern.startsWith('!')) continue
    if (!packedContentsInclude(contents, filePattern, { allowDirectory: true })) {
      throw new Error(`${name} tarball does not include files entry ${filePattern}`)
    }
  }
}

function packageConfigForDir(packageDir) {
  const normalizedPackageDir = resolve(packageDir)
  const entries = Object.entries(metadataPackages).filter(([, config]) => {
    return resolve(repoRoot, config.dir) === normalizedPackageDir
  })
  if (entries.length > 1) {
    throw new Error(`Multiple Fict metadata configs matched ${packageDir}`)
  }
  return entries[0]
}

function resolvePackageInput(input) {
  if (!input) return Object.entries(metadataPackages)

  const byName = metadataPackages[input]
  if (byName) return [[input, byName]]

  const packageDir = resolve(process.cwd(), input)
  const entry = packageConfigForDir(packageDir)
  if (!entry) {
    throw new Error(`No Fict metadata config for ${packageDir}`)
  }
  return [entry]
}

function emitPackageMetadata(name, config) {
  const packageDir = resolve(repoRoot, config.dir)
  const packageJsonPath = join(packageDir, 'package.json')
  const pkg = readJson(packageJsonPath)

  if (pkg.name !== name) {
    throw new Error(`${config.dir}/package.json name is ${pkg.name}, expected ${name}`)
  }
  assertEqual(pkg.fict, config.fict, `${config.dir}/package.json#fict`)

  for (const [metadataPath, metadata] of Object.entries(config.files)) {
    writeJson(resolve(packageDir, metadataPath), metadata)
  }
}

function verifyPackageMetadata(name, config) {
  const packageDir = resolve(repoRoot, config.dir)
  const packageJsonPath = join(packageDir, 'package.json')
  const pkg = readJson(packageJsonPath)

  if (pkg.name !== name) {
    throw new Error(`${config.dir}/package.json name is ${pkg.name}, expected ${name}`)
  }
  assertEqual(pkg.fict, config.fict, `${config.dir}/package.json#fict`)

  for (const [metadataPath, metadata] of Object.entries(config.files)) {
    const absoluteMetadataPath = resolve(packageDir, metadataPath)
    if (!existsSync(absoluteMetadataPath)) {
      throw new Error(`${relative(repoRoot, absoluteMetadataPath)} is missing`)
    }
    assertEqual(
      readJson(absoluteMetadataPath),
      metadata,
      `${relative(repoRoot, absoluteMetadataPath)}`,
    )
  }
}

function packAndVerifyPackage(packageInfo, config, packDir) {
  const { name } = packageInfo
  const packageDir = resolve(repoRoot, packageInfo.dir)
  const output = execFileSync('pnpm', ['--filter', name, 'pack', '--pack-destination', packDir], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  const tarballLine = output
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .reverse()
    .find((line) => line.endsWith('.tgz'))
  if (!tarballLine) {
    throw new Error(`Could not find pnpm pack tarball path for ${name}`)
  }

  const tarballPath = resolve(packageDir, tarballLine)
  const contents = execFileSync('tar', ['-tf', tarballPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).split('\n')
  const packedPackageJson = JSON.parse(
    execFileSync('tar', ['-xOf', tarballPath, 'package/package.json'], {
      cwd: repoRoot,
      encoding: 'utf8',
    }),
  )
  verifyPackedManifestTargets(name, packedPackageJson, contents)

  if (!config) return

  assertEqual(packedPackageJson.fict, config.fict, `${name} packed package.json#fict`)

  for (const metadataPath of Object.keys(config.files)) {
    const packedPath = `package/${metadataPath.replace(/^\.\//, '')}`
    if (!contents.includes(packedPath)) {
      throw new Error(`${name} tarball is missing ${packedPath}`)
    }
  }
}

function runEmit(input) {
  for (const [name, config] of resolvePackageInput(input)) {
    emitPackageMetadata(name, config)
  }
}

function runVerify({ pack }) {
  for (const [name, config] of Object.entries(metadataPackages)) {
    verifyPackageMetadata(name, config)
  }

  if (!pack) return

  const packDir = mkdtempSync(join(tmpdir(), 'ui-primitives-fict-metadata-pack-'))

  try {
    for (const packageInfo of getPublishablePackages()) {
      packAndVerifyPackage(packageInfo, metadataPackages[packageInfo.name], packDir)
    }
  } finally {
    rmSync(packDir, { recursive: true, force: true })
  }
}

const [command, input, ...rest] = process.argv.slice(2)

if (command === 'emit') {
  runEmit(input)
} else if (command === 'verify') {
  runVerify({ pack: rest.includes('--pack') || input === '--pack' })
} else if (command === 'list') {
  for (const [name, config] of Object.entries(metadataPackages)) {
    console.log(`${name}\t${config.dir}`)
  }
} else {
  console.error(
    'Usage: node scripts/fict-metadata.mjs <emit [packageDir|packageName]|verify [--pack]|list>',
  )
  process.exitCode = 1
}
