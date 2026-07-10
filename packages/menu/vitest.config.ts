import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const packagesRoot = path.resolve(currentDir, '..')
const libsRoot = path.resolve(packagesRoot, '../libs')

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@fictjs/arrow',
        replacement: path.resolve(packagesRoot, 'arrow/src/index.tsx'),
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
        find: '@fictjs/dismissable-layer',
        replacement: path.resolve(packagesRoot, 'dismissable-layer/src/index.tsx'),
      },
      {
        find: '@fictjs/fict-remove-scroll',
        replacement: path.resolve(libsRoot, 'fict-remove-scroll/dist/index.js'),
      },
      {
        find: '@fictjs/floating-ui-dom',
        replacement: path.resolve(libsRoot, 'floating-ui-dom/src/index.ts'),
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
        find: '@fictjs/popper',
        replacement: path.resolve(packagesRoot, 'popper/src/index.ts'),
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
        find: '@fictjs/rect',
        replacement: path.resolve(packagesRoot, 'rect/src/index.ts'),
      },
      {
        find: '@fictjs/slot',
        replacement: path.resolve(packagesRoot, 'slot/src/index.tsx'),
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
        find: '@fictjs/use-effect-event',
        replacement: path.resolve(packagesRoot, 'use-effect-event/src/index.ts'),
      },
      {
        find: '@fictjs/use-escape-keydown',
        replacement: path.resolve(packagesRoot, 'use-escape-keydown/src/index.ts'),
      },
      {
        find: '@fictjs/use-layout-effect',
        replacement: path.resolve(packagesRoot, 'use-layout-effect/src/index.ts'),
      },
      {
        find: '@fictjs/use-size',
        replacement: path.resolve(packagesRoot, 'use-size/src/index.ts'),
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
