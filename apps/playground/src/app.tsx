import { createEffect } from 'fict'

import { Theme, ThemePanel } from '@fictjs/radix-ui-themes'

import Sink from './sink/page.js'
import SinkLayout from './sink/layout.js'
import { sinkRoutes } from './sink/routes.js'

export default function App() {
  createEffect(() => {
    if (typeof window === 'undefined') return undefined

    if (window.location.hash === '') {
      window.location.replace('#/sink')
    }

    const syncHash = () => {
      const targetHash = window.location.hash.replace(/^#/, '')
      if (targetHash === '' || targetHash === '/sink') {
        window.scrollTo({ top: 0, behavior: 'auto' })
        return
      }

      const slug = targetHash.replace(/^\/sink\//, '')
      let attempts = 0

      const scrollToTarget = () => {
        const routeIndex = sinkRoutes.findIndex((route) => route.href === slug)
        if (routeIndex !== -1) {
          const targetSection = Array.from(document.querySelectorAll('main section')).at(routeIndex)
          if (targetSection) {
            targetSection.scrollIntoView({ block: 'start', behavior: 'auto' })
            return true
          }
        }

        const targetHeading = Array.from(document.querySelectorAll('h2')).find((heading) => {
          const label = heading.textContent?.trim().toLowerCase().replace(/\s+/g, '-')
          return label === slug
        })

        if (targetHeading) {
          targetHeading.scrollIntoView({ block: 'start', behavior: 'auto' })
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
        <Sink />
      </SinkLayout>
      <ThemePanel defaultOpen={false} />
    </Theme>
  )
}
