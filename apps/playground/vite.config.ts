import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import fict from '@fictjs/vite-plugin'
import { defineConfig } from 'vite'

const currentDir = dirname(fileURLToPath(import.meta.url))

const historyFallback = () => ({
  name: 'playground-history-fallback',
  configureServer(server: {
    middlewares: {
      use: (
        handler: (
          req: { method?: string; url?: string; headers: { accept?: string } },
          _res: unknown,
          next: () => void,
        ) => void,
      ) => void
    }
  }) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url ?? '/'
      const acceptsHtml = req.headers.accept?.includes('text/html') ?? false
      const isStaticAsset = url.includes('.') || url.startsWith('/@') || url.startsWith('/__')

      if (req.method === 'GET' && acceptsHtml && !isStaticAsset) {
        req.url = '/index.html'
      }

      next()
    })
  },
})

export default defineConfig(() => {
  const useBuiltThemes = true

  return {
    plugins: [
      historyFallback(),
      fict({
        exclude: ['**/libs/radix-ui-themes/src/**'],
      }),
    ],
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
          replacement: resolve(
            currentDir,
            useBuiltThemes
              ? '../../libs/radix-ui-themes/styles.css'
              : '../../libs/radix-ui-themes/src/styles/index.css',
          ),
        },
        {
          find: '@fictjs/radix-ui-themes/props',
          replacement: resolve(
            currentDir,
            useBuiltThemes
              ? '../../libs/radix-ui-themes/dist/props/index.js'
              : '../../libs/radix-ui-themes/src/props/index.ts',
          ),
        },
        {
          find: '@fictjs/radix-ui-themes/helpers',
          replacement: resolve(
            currentDir,
            useBuiltThemes
              ? '../../libs/radix-ui-themes/dist/helpers/index.js'
              : '../../libs/radix-ui-themes/src/helpers/index.ts',
          ),
        },
        {
          find: '@fictjs/radix-ui-themes',
          replacement: resolve(
            currentDir,
            useBuiltThemes
              ? '../../libs/radix-ui-themes/dist/index.js'
              : '../../libs/radix-ui-themes/src/index.ts',
          ),
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
    server: {
      port: 3100,
    },
  }
})
