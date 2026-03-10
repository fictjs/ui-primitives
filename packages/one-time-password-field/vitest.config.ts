import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(currentDir, '../../..')
const packagesRoot = path.resolve(currentDir, '..')

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@fictjs/one-time-password-field',
        replacement: path.resolve(packagesRoot, 'one-time-password-field/src/index.ts'),
      },
      {
        find: '@fictjs/context',
        replacement: path.resolve(packagesRoot, 'context/src/index.ts'),
      },
      {
        find: '@fictjs/core-primitive',
        replacement: path.resolve(packagesRoot, 'core-primitive/src/index.ts'),
      },
      {
        find: '@fictjs/direction',
        replacement: path.resolve(packagesRoot, 'direction/src/index.ts'),
      },
      {
        find: '@fictjs/primitive',
        replacement: path.resolve(packagesRoot, 'primitive/src/index.tsx'),
      },
      {
        find: '@fictjs/use-controllable-state',
        replacement: path.resolve(packagesRoot, 'use-controllable-state/src/index.ts'),
      },
      {
        find: '@fictjs/use-is-hydrated',
        replacement: path.resolve(packagesRoot, 'use-is-hydrated/src/index.ts'),
      },
      {
        find: '@fictjs/use-layout-effect',
        replacement: path.resolve(packagesRoot, 'use-layout-effect/src/index.ts'),
      },
      {
        find: '@fictjs/runtime/advanced',
        replacement: path.resolve(workspaceRoot, 'packages/runtime/src/advanced.ts'),
      },
      {
        find: '@fictjs/runtime/jsx-runtime',
        replacement: path.resolve(workspaceRoot, 'packages/runtime/src/jsx-runtime.ts'),
      },
      {
        find: '@fictjs/runtime/jsx-dev-runtime',
        replacement: path.resolve(workspaceRoot, 'packages/runtime/src/jsx-dev-runtime.ts'),
      },
      {
        find: '@fictjs/runtime',
        replacement: path.resolve(workspaceRoot, 'packages/runtime/src/index.ts'),
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
