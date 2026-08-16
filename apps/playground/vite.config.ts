import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import fict from '@fictjs/vite-plugin'
import { defineConfig } from 'vite'

const currentDir = dirname(fileURLToPath(import.meta.url))
const avatarSvg = readFileSync(resolve(currentDir, './public/avatar.svg'), 'utf8')

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

const avatarApiFallback = () => ({
  name: 'playground-avatar-api-fallback',
  configureServer(server: {
    middlewares: {
      use: (
        handler: (
          req: { url?: string },
          res: {
            statusCode?: number
            setHeader: (name: string, value: string) => void
            end: (body?: string) => void
          },
          next: () => void,
        ) => void,
      ) => void
    }
  }) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/avatar' || req.url === '/api/avatar/') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'image/svg+xml')
        res.setHeader('Cache-Control', 'no-store')
        res.end(avatarSvg)
        return
      }

      next()
    })
  },
  configurePreviewServer(server: {
    middlewares: {
      use: (
        handler: (
          req: { url?: string },
          res: {
            statusCode?: number
            setHeader: (name: string, value: string) => void
            end: (body?: string) => void
          },
          next: () => void,
        ) => void,
      ) => void
    }
  }) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/avatar' || req.url === '/api/avatar/') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'image/svg+xml')
        res.setHeader('Cache-Control', 'no-store')
        res.end(avatarSvg)
        return
      }

      next()
    })
  },
})

export default defineConfig(() => {
  const useBuiltPackages = true
  const resolveImport = (id: string) => fileURLToPath(import.meta.resolve(id))

  return {
    plugins: [
      avatarApiFallback(),
      historyFallback(),
      fict({
        // Fict 0.32 compiles every supported JS/TS extension by default. Keep the app
        // boundary explicit so dependencies provide metadata instead of being recompiled.
        include: [resolve(currentDir, './src/**/*.{js,jsx,ts,tsx}')],
      }),
    ],
    resolve: {
      alias: [
        {
          find: '@fictjs/radix-ui/internal',
          replacement: resolve(
            currentDir,
            useBuiltPackages
              ? '../../packages/radix-ui/dist/internal.js'
              : '../../packages/radix-ui/src/internal.ts',
          ),
        },
        {
          find: '@fictjs/runtime/internal/list',
          replacement: resolveImport('@fictjs/runtime/internal/list'),
        },
        {
          find: '@fictjs/runtime/internal',
          replacement: resolveImport('@fictjs/runtime/internal'),
        },
        {
          find: '@fictjs/runtime/advanced',
          replacement: resolveImport('@fictjs/runtime/advanced'),
        },
        {
          find: '@fictjs/runtime/jsx-runtime',
          replacement: resolveImport('@fictjs/runtime/jsx-runtime'),
        },
        {
          find: '@fictjs/runtime/jsx-dev-runtime',
          replacement: resolveImport('@fictjs/runtime/jsx-dev-runtime'),
        },
        {
          find: '@fictjs/runtime',
          replacement: resolveImport('@fictjs/runtime'),
        },
        {
          find: '@fictjs/radix-ui',
          replacement: resolve(
            currentDir,
            useBuiltPackages
              ? '../../packages/radix-ui/dist/index.js'
              : '../../packages/radix-ui/src/index.ts',
          ),
        },
        {
          find: '@fictjs/radix-ui-themes/styles.css',
          replacement: resolve(
            currentDir,
            useBuiltPackages
              ? '../../libs/radix-ui-themes/styles.css'
              : '../../libs/radix-ui-themes/src/styles/index.css',
          ),
        },
        {
          find: '@fictjs/radix-ui-themes/props',
          replacement: resolve(
            currentDir,
            useBuiltPackages
              ? '../../libs/radix-ui-themes/dist/props/index.js'
              : '../../libs/radix-ui-themes/src/props/index.ts',
          ),
        },
        {
          find: '@fictjs/radix-ui-themes/helpers',
          replacement: resolve(
            currentDir,
            useBuiltPackages
              ? '../../libs/radix-ui-themes/dist/helpers/index.js'
              : '../../libs/radix-ui-themes/src/helpers/index.ts',
          ),
        },
        {
          find: '@fictjs/radix-ui-themes',
          replacement: resolve(
            currentDir,
            useBuiltPackages
              ? '../../libs/radix-ui-themes/dist/index.js'
              : '../../libs/radix-ui-themes/src/index.ts',
          ),
        },
        {
          find: '@radix-ui/react-icons',
          replacement: resolve(currentDir, './src/compat/radix-icons.tsx'),
        },
        {
          find: 'fict/internal/list',
          replacement: resolveImport('fict/internal/list'),
        },
        {
          find: 'fict/internal',
          replacement: resolveImport('fict/internal'),
        },
        {
          find: 'fict/advanced',
          replacement: resolveImport('fict/advanced'),
        },
        {
          find: 'fict/jsx-runtime',
          replacement: resolveImport('fict/jsx-runtime'),
        },
        {
          find: 'fict/jsx-dev-runtime',
          replacement: resolveImport('fict/jsx-dev-runtime'),
        },
        {
          find: 'fict/plus',
          replacement: resolveImport('fict/plus'),
        },
        {
          find: 'fict',
          replacement: resolveImport('fict'),
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
