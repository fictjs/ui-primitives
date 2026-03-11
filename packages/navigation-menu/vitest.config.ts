import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const packagesRoot = path.resolve(currentDir, '..')

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@fictjs/context',
        replacement: path.resolve(packagesRoot, 'context/src/index.ts'),
      },
      {
        find: '@fictjs/id',
        replacement: path.resolve(packagesRoot, 'id/src/index.ts'),
      },
      {
        find: '@fictjs/presence',
        replacement: path.resolve(packagesRoot, 'presence/src/index.tsx'),
      },
      {
        find: '@fictjs/primitive',
        replacement: path.resolve(packagesRoot, 'primitive/src/index.tsx'),
      },
      {
        find: '@fictjs/use-controllable-state',
        replacement: path.resolve(packagesRoot, 'use-controllable-state/src/index.ts'),
      },
    ],
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@fictjs/runtime',
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
