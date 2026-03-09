import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(currentDir, '../../..')
const libsRoot = path.resolve(currentDir, '..')

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@fictjs/fict-remove-scroll-bar/constants',
        replacement: path.resolve(libsRoot, 'fict-remove-scroll-bar/src/constants.ts'),
      },
      {
        find: '@fictjs/fict-remove-scroll-bar',
        replacement: path.resolve(libsRoot, 'fict-remove-scroll-bar/src/index.ts'),
      },
      {
        find: '@fictjs/fict-style-singleton',
        replacement: path.resolve(libsRoot, 'fict-style-singleton/src/index.ts'),
      },
      {
        find: '@fictjs/use-callback-ref',
        replacement: path.resolve(libsRoot, 'use-callback-ref/src/index.ts'),
      },
      {
        find: '@fictjs/use-sidecar',
        replacement: path.resolve(libsRoot, 'use-sidecar/src/index.ts'),
      },
      {
        find: '@fictjs/runtime/jsx-dev-runtime',
        replacement: path.resolve(workspaceRoot, 'packages/runtime/src/jsx-dev-runtime.ts'),
      },
      {
        find: '@fictjs/runtime/jsx-runtime',
        replacement: path.resolve(workspaceRoot, 'packages/runtime/src/jsx-runtime.ts'),
      },
      {
        find: '@fictjs/runtime/advanced',
        replacement: path.resolve(workspaceRoot, 'packages/runtime/src/advanced.ts'),
      },
      {
        find: '@fictjs/runtime',
        replacement: path.resolve(workspaceRoot, 'packages/runtime/src/index.ts'),
      },
      {
        find: 'fict/jsx-dev-runtime',
        replacement: path.resolve(workspaceRoot, 'packages/fict/src/jsx-dev-runtime.ts'),
      },
      {
        find: 'fict/jsx-runtime',
        replacement: path.resolve(workspaceRoot, 'packages/fict/src/jsx-runtime.ts'),
      },
      {
        find: 'fict/advanced',
        replacement: path.resolve(workspaceRoot, 'packages/fict/src/advanced.ts'),
      },
      {
        find: 'fict',
        replacement: path.resolve(workspaceRoot, 'packages/fict/src/index.ts'),
      },
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
