import { createEffect } from 'fict'

import { Theme, ThemePanel } from '@fictjs/radix-ui-themes'

import Sink from './sink/page.js'
import SinkLayout from './sink/layout.js'

function normalizeHeading(text: string) {
  return text
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\s+/g, '-')
}

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
        const targetHeading = Array.from(document.querySelectorAll('main section h2')).find(
          (heading) => {
            const label = heading.textContent ? normalizeHeading(heading.textContent) : ''
            return label === slug
          },
        )

        if (targetHeading) {
          targetHeading.closest('section')?.scrollIntoView({ block: 'start', behavior: 'auto' })
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
