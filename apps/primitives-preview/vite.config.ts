import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(currentDir, '../..')
const packageRoots = [path.resolve(workspaceRoot, 'packages'), path.resolve(workspaceRoot, 'libs')]

type AliasEntry = {
  find: string
  replacement: string
}

function readWorkspaceAliases(): AliasEntry[] {
  const aliases: AliasEntry[] = [
    {
      find: '@fictjs/radix-ui/internal',
      replacement: path.resolve(workspaceRoot, 'packages/radix-ui/src/internal.ts'),
    },
    {
      find: '@fictjs/fict-remove-scroll-bar/constants',
      replacement: path.resolve(workspaceRoot, 'libs/fict-remove-scroll-bar/src/constants.ts'),
    },
  ]

  for (const root of packageRoots) {
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue

      const packageDir = path.resolve(root, entry.name)
      const packageJsonPath = path.resolve(packageDir, 'package.json')
      if (!fs.existsSync(packageJsonPath)) continue

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
        name?: string
      }
      if (!packageJson.name?.startsWith('@fictjs/')) continue

      const sourceEntry = [
        path.resolve(packageDir, 'src/index.ts'),
        path.resolve(packageDir, 'src/index.tsx'),
      ].find((candidate) => fs.existsSync(candidate))

      if (!sourceEntry) continue

      aliases.push({
        find: packageJson.name,
        replacement: sourceEntry,
      })
    }
  }

  return aliases
}

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  resolve: {
    alias: readWorkspaceAliases(),
  },
})
