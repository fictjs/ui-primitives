import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const packagesRoot = path.resolve(currentDir, '..')

export default defineConfig({
  plugins: [
    {
      name: 'fict-workspace-alias',
      resolveId(source) {
        const match = source.match(/^@fictjs\/([^/]+)$/)
        if (!match) {
          return null
        }

        const tsEntry = path.resolve(packagesRoot, match[1]!, 'src/index.ts')
        if (existsSync(tsEntry)) {
          return tsEntry
        }

        const tsxEntry = path.resolve(packagesRoot, match[1]!, 'src/index.tsx')
        if (existsSync(tsxEntry)) {
          return tsxEntry
        }

        return null
      },
    },
  ],
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
