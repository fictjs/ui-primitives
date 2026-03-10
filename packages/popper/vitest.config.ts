import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(currentDir, '../../..')
const packagesRoot = path.resolve(currentDir, '..')
const libsRoot = path.resolve(currentDir, '../../libs')

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
        find: '@fictjs/floating-ui-dom',
        replacement: path.resolve(libsRoot, 'floating-ui-dom/src/index.ts'),
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
        find: '@fictjs/use-callback-ref',
        replacement: path.resolve(packagesRoot, 'use-callback-ref/src/index.ts'),
      },
      {
        find: '@fictjs/use-layout-effect',
        replacement: path.resolve(packagesRoot, 'use-layout-effect/src/index.ts'),
      },
      {
        find: '@fictjs/use-size',
        replacement: path.resolve(packagesRoot, 'use-size/src/index.ts'),
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
