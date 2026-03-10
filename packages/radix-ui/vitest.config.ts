import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const packagesRoot = path.resolve(currentDir, '..')
const libsRoot = path.resolve(currentDir, '../../libs')
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(currentDir, 'package.json'), 'utf8'),
) as {
  dependencies: Record<string, string>
}

function resolveWorkspaceEntry(name: string): string {
  const candidates = [
    path.resolve(packagesRoot, name, 'src/index.ts'),
    path.resolve(packagesRoot, name, 'src/index.tsx'),
    path.resolve(libsRoot, name, 'src/index.ts'),
    path.resolve(libsRoot, name, 'src/index.tsx'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return path.resolve(packagesRoot, name)
}

const workspaceAliases = Object.keys(packageJson.dependencies)
  .filter((dependency) => dependency.startsWith('@fictjs/'))
  .map((dependency) => ({
    find: dependency,
    replacement: resolveWorkspaceEntry(dependency.slice('@fictjs/'.length)),
  }))

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@fictjs/fict-remove-scroll-bar/constants',
        replacement: path.resolve(libsRoot, 'fict-remove-scroll-bar/src/constants.ts'),
      },
      ...workspaceAliases,
    ],
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
    environment: 'jsdom',
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
  },
})
