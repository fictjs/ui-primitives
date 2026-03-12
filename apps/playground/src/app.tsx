import { createEffect } from 'fict'
import { createSignal } from 'fict/advanced'

import { Box, Container, Link, Text, Theme, ThemePanel } from '@fictjs/radix-ui-themes'

import SinkLayout from './sink/layout.js'

import type { FictNode } from 'fict'

type PageModule = { default: () => FictNode }

const sinkPages = import.meta.glob('./sink/**/page.tsx', { eager: true }) as Record<string, PageModule>

function normalizePath(pathname: string) {
  return pathname === '/' ? '/sink' : pathname.replace(/\/$/, '') || '/sink'
}

function getCurrentPath() {
  if (typeof window === 'undefined') return '/sink'
  const hashPath = window.location.hash.replace(/^#/, '')
  return normalizePath(hashPath || '/sink')
}

function resolveSinkComponent(pathname: string) {
  const normalizedPath = normalizePath(pathname)
  if (normalizedPath === '/sink') {
    return sinkPages['./sink/page.tsx']?.default
  }

  const slug = normalizedPath.replace(/^\/sink\//, '')
  return sinkPages[`./sink/${slug}/page.tsx`]?.default
}

function NotFound() {
  return (
    <Container size="3" py="9">
      <Box>
        <Text as="p" size="5" weight="bold">
          Playground page not found.
        </Text>
        <Text as="p" color="gray" mt="2">
          Open <Link href="#/sink">the kitchen sink</Link> to browse the full themes showcase.
        </Text>
      </Box>
    </Container>
  )
}

export default function App() {
  const currentPath = createSignal(getCurrentPath())

  createEffect(() => {
    if (typeof window === 'undefined') return undefined

    if (window.location.hash === '') {
      window.location.replace('#/sink')
      currentPath('/sink')
    }

    const syncPath = () => currentPath(getCurrentPath())
    window.addEventListener('hashchange', syncPath)
    return () => window.removeEventListener('hashchange', syncPath)
  })

  return (
    <Theme appearance="dark" accentColor="violet">
      <SinkLayout>
        {(() => {
          const Component = resolveSinkComponent(currentPath())
          return Component ? <Component /> : <NotFound />
        })()}
      </SinkLayout>
      <ThemePanel defaultOpen={false} />
    </Theme>
  )
}
