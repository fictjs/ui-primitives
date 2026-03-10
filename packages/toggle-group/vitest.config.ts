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
        find: '@fictjs/collection',
        replacement: path.resolve(packagesRoot, 'collection/src/index.ts'),
      },
      {
        find: '@fictjs/compose-refs',
        replacement: path.resolve(packagesRoot, 'compose-refs/src/index.ts'),
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
        find: '@fictjs/id',
        replacement: path.resolve(packagesRoot, 'id/src/index.ts'),
      },
      {
        find: '@fictjs/primitive',
        replacement: path.resolve(packagesRoot, 'primitive/src/index.tsx'),
      },
      {
        find: '@fictjs/roving-focus',
        replacement: path.resolve(packagesRoot, 'roving-focus/src/index.tsx'),
      },
      {
        find: '@fictjs/toggle',
        replacement: path.resolve(packagesRoot, 'toggle/src/index.tsx'),
      },
      {
        find: '@fictjs/use-callback-ref',
        replacement: path.resolve(packagesRoot, 'use-callback-ref/src/index.ts'),
      },
      {
        find: '@fictjs/use-controllable-state',
        replacement: path.resolve(packagesRoot, 'use-controllable-state/src/index.ts'),
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
