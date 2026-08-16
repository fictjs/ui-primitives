import { createEffect } from 'fict'

import { Theme, ThemePanel } from '@fictjs/radix-ui-themes'

import Sink from './sink/page.js'
import SinkLayout from './sink/layout.js'
import { sinkRoutes } from './sink/routes.js'

type SinkRoute = (typeof sinkRoutes)[number]['href']

function readSinkRoute(): SinkRoute | undefined {
  if (typeof window === 'undefined') return undefined

  const match = window.location.hash.match(/^#\/sink\/([^/?#]+)$/)
  const slug = match?.[1]
  return sinkRoutes.find((route) => route.href === slug)?.href
}

function normalizeHeading(text: string) {
  return text
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\s+/g, '-')
}

const SINK_SECTION_SCROLL_OFFSET = 96

export default function App() {
  const activeRoute = readSinkRoute()

  createEffect(() => {
    if (typeof window === 'undefined') return undefined

    if (window.location.hash === '') {
      window.location.replace('#/sink')
    }

    const syncHash = () => {
      if (readSinkRoute() !== activeRoute) {
        window.location.reload()
        return
      }

      const targetHash = window.location.hash.replace(/^#/, '')
      if (targetHash === '' || targetHash === '/sink') {
        window.scrollTo({ top: 0, behavior: 'auto' })
        return
      }

      const slug = targetHash.replace(/^\/sink\//, '')
      let attempts = 0

      const scrollToTarget = () => {
        const targetHeading = Array.from(document.querySelectorAll('main section h2')).find(
          (heading) => {
            const label = heading.textContent ? normalizeHeading(heading.textContent) : ''
            return label === slug
          },
        )

        if (targetHeading) {
          const targetSection = targetHeading.closest('section')
          if (targetSection) {
            const targetTop =
              targetSection.getBoundingClientRect().top +
              window.scrollY -
              SINK_SECTION_SCROLL_OFFSET

            window.scrollTo({
              top: Math.max(targetTop, 0),
              behavior: 'auto',
            })
          }
          return true
        }

        return false
      }

      const attemptScroll = () => {
        attempts += 1
        if (scrollToTarget() || attempts >= 10) {
          return
        }

        window.requestAnimationFrame(attemptScroll)
      }

      window.requestAnimationFrame(attemptScroll)
    }

    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  })

  return (
    <Theme appearance="dark" accentColor="violet">
      <SinkLayout>
        <Sink activeRoute={activeRoute} />
      </SinkLayout>
      <ThemePanel defaultOpen={false} />
    </Theme>
  )
}
