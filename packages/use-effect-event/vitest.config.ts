import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const packagesRoot = path.resolve(currentDir, '..')

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@fictjs/compose-refs',
        replacement: path.resolve(packagesRoot, 'compose-refs/src/index.ts'),
      },
      { find: '@fictjs/context', replacement: path.resolve(packagesRoot, 'context/src/index.ts') },
      {
        find: '@fictjs/direction',
        replacement: path.resolve(packagesRoot, 'direction/src/index.ts'),
      },
      { find: '@fictjs/id', replacement: path.resolve(packagesRoot, 'id/src/index.ts') },
      {
        find: '@fictjs/use-callback-ref',
        replacement: path.resolve(packagesRoot, 'use-callback-ref/src/index.ts'),
      },
      {
        find: '@fictjs/use-controllable-state',
        replacement: path.resolve(packagesRoot, 'use-controllable-state/src/index.ts'),
      },
      {
        find: '@fictjs/use-effect-event',
        replacement: path.resolve(packagesRoot, 'use-effect-event/src/index.ts'),
      },
      {
        find: '@fictjs/use-escape-keydown',
        replacement: path.resolve(packagesRoot, 'use-escape-keydown/src/index.ts'),
      },
      {
        find: '@fictjs/use-is-hydrated',
        replacement: path.resolve(packagesRoot, 'use-is-hydrated/src/index.ts'),
      },
      {
        find: '@fictjs/use-previous',
        replacement: path.resolve(packagesRoot, 'use-previous/src/index.ts'),
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
