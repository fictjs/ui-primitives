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
        find: '@fictjs/core-primitive',
        replacement: path.resolve(packagesRoot, 'core-primitive/src/index.ts'),
      },
      {
        find: '@fictjs/direction',
        replacement: path.resolve(packagesRoot, 'direction/src/index.ts'),
      },
      {
        find: '@fictjs/dismissable-layer',
        replacement: path.resolve(packagesRoot, 'dismissable-layer/src/index.tsx'),
      },
      {
        find: '@fictjs/fict-remove-scroll',
        replacement: path.resolve(packagesRoot, '../libs/fict-remove-scroll/dist/index.js'),
      },
      {
        find: '@fictjs/focus-scope',
        replacement: path.resolve(packagesRoot, 'focus-scope/src/index.tsx'),
      },
      {
        find: '@fictjs/id',
        replacement: path.resolve(packagesRoot, 'id/src/index.ts'),
      },
      {
        find: '@fictjs/menu',
        replacement: path.resolve(packagesRoot, 'menu/dist/index.js'),
      },
      {
        find: '@fictjs/portal',
        replacement: path.resolve(packagesRoot, 'portal/src/index.tsx'),
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
      {
        find: '@fictjs/use-layout-effect',
        replacement: path.resolve(packagesRoot, 'use-layout-effect/src/index.ts'),
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
