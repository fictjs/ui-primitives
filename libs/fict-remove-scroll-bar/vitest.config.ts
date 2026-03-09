import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(currentDir, '../../..')

export default defineConfig({
  resolve: {
    alias: [
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
      {
        find: '@fictjs/fict-style-singleton',
        replacement: path.resolve(currentDir, '../fict-style-singleton/src/index.ts'),
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
