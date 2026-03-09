import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import fict from '@fictjs/vite-plugin'
import { defineConfig } from 'vite'

const currentDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(currentDir, 'example')

export default defineConfig({
  plugins: [fict()],
  resolve: {
    alias: {
      '@fictjs/fict-remove-scroll-bar': resolve(currentDir, 'src/index.ts'),
    },
  },
  root,
  build: {
    outDir: resolve(currentDir, 'dist/example'),
    emptyOutDir: true,
  },
})
