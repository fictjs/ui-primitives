import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@radix-ui/react-icons',
        replacement: path.resolve(currentDir, './src/compat/radix-icons.tsx'),
      },
      {
        find: '@fictjs/radix-ui/internal',
        replacement: path.resolve(currentDir, '../../packages/radix-ui/src/internal.ts'),
      },
      {
        find: '@fictjs/radix-ui',
        replacement: path.resolve(currentDir, '../../packages/radix-ui/src/index.ts'),
      },
      {
        find: '@fictjs/radix-ui-themes/styles.css',
        replacement: path.resolve(currentDir, '../../libs/radix-ui-themes/styles.css'),
      },
      {
        find: '@fictjs/radix-ui-themes',
        replacement: path.resolve(currentDir, '../../libs/radix-ui-themes/src/index.ts'),
      },
      {
        find: '@fictjs/radix-ui-themes/helpers',
        replacement: path.resolve(currentDir, '../../libs/radix-ui-themes/src/helpers/index.ts'),
      },
      {
        find: '@fictjs/radix-ui-themes/props',
        replacement: path.resolve(currentDir, '../../libs/radix-ui-themes/src/props/index.ts'),
      },
      {
        find: 'next/link',
        replacement: path.resolve(currentDir, './src/compat/next-link.tsx'),
      },
      {
        find: 'next/navigation',
        replacement: path.resolve(currentDir, './src/compat/next-navigation.ts'),
      },
      {
        find: 'react',
        replacement: path.resolve(currentDir, './src/compat/react.tsx'),
      },
    ],
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'fict',
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
