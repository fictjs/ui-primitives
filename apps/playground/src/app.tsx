import { createEffect } from 'fict'

import { Theme, ThemePanel } from '@fictjs/radix-ui-themes'

import Sink from './sink/page.js'
import SinkLayout from './sink/layout.js'

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
      const targetHeading = Array.from(document.querySelectorAll('h2')).find((heading) => {
        const label = heading.textContent?.trim().toLowerCase().replace(/\s+/g, '-')
        return label === slug
      })

      targetHeading?.scrollIntoView({ block: 'start', behavior: 'auto' })
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
