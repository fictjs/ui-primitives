import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
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
        replacement: path.resolve(currentDir, '../../packages/use-callback-ref/src/index.ts'),
      },
      {
        find: '@fictjs/use-sidecar',
        replacement: path.resolve(libsRoot, 'use-sidecar/src/index.ts'),
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
