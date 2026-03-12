import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@fictjs/radix-ui/internal',
        replacement: resolve(currentDir, '../../packages/radix-ui/dist/internal.js'),
      },
      {
        find: '@fictjs/radix-ui',
        replacement: resolve(currentDir, '../../packages/radix-ui/dist/index.js'),
      },
      {
        find: '@fictjs/radix-ui-themes/styles.css',
        replacement: resolve(currentDir, '../../libs/radix-ui-themes/styles.css'),
      },
      {
        find: '@fictjs/radix-ui-themes/props',
        replacement: resolve(currentDir, '../../libs/radix-ui-themes/dist/props/index.js'),
      },
      {
        find: '@fictjs/radix-ui-themes/helpers',
        replacement: resolve(currentDir, '../../libs/radix-ui-themes/dist/helpers/index.js'),
      },
      {
        find: '@fictjs/radix-ui-themes',
        replacement: resolve(currentDir, '../../libs/radix-ui-themes/dist/index.js'),
      },
      {
        find: '@radix-ui/react-icons',
        replacement: resolve(currentDir, './src/compat/radix-icons.tsx'),
      },
      { find: 'next/link', replacement: resolve(currentDir, './src/compat/next-link.tsx') },
      {
        find: 'next/navigation',
        replacement: resolve(currentDir, './src/compat/next-navigation.ts'),
      },
      { find: 'next', replacement: resolve(currentDir, './src/compat/next.ts') },
      { find: 'react', replacement: resolve(currentDir, './src/compat/react.tsx') },
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
  },
})
