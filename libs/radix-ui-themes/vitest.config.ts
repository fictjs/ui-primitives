import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@fictjs/radix-ui/internal',
        replacement: path.resolve(currentDir, '../../packages/radix-ui/src/internal.ts'),
      },
      {
        find: '@fictjs/radix-ui',
        replacement: path.resolve(currentDir, '../../packages/radix-ui/src/index.ts'),
      },
      {
        find: '@fictjs/radix-ui-themes',
        replacement: path.resolve(currentDir, './src/index.ts'),
      },
      {
        find: '@fictjs/radix-ui-themes/helpers',
        replacement: path.resolve(currentDir, './src/helpers/index.ts'),
      },
      {
        find: '@fictjs/radix-ui-themes/props',
        replacement: path.resolve(currentDir, './src/props/index.ts'),
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
