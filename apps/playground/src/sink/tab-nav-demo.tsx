import * as React from 'react'
import { createSignal } from '@fictjs/runtime/advanced'
import { TabNav } from '@fictjs/radix-ui-themes'

function TabNavDemoImpl(props: React.ComponentPropsWithRef<typeof TabNav.Root>) {
  const tab = createSignal('account')

  const handleTabClick = (nextTab: string) => (event: MouseEvent) => {
    event.preventDefault()
    tab(nextTab)
  }

  const handleTabKeyDown = (nextTab: string) => (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.defaultPrevented) {
      return
    }

    event.preventDefault()
    tab(nextTab)
  }

  return (
    <TabNav.Root {...props}>
      <TabNav.Link
        active={() => tab() === 'account'}
        href="#tab-nav-account"
        onClick={handleTabClick('account')}
        onKeyDown={handleTabKeyDown('account')}
      >
        Account
      </TabNav.Link>
      <TabNav.Link
        active={() => tab() === 'documents'}
        href="#tab-nav-documents"
        onClick={handleTabClick('documents')}
        onKeyDown={handleTabKeyDown('documents')}
      >
        Documents
      </TabNav.Link>
      <TabNav.Link
        active={() => tab() === 'settings'}
        href="#tab-nav-settings"
        onClick={handleTabClick('settings')}
        onKeyDown={handleTabKeyDown('settings')}
      >
        Settings
      </TabNav.Link>
    </TabNav.Root>
  )
}

export function TabNavDemo(props: React.ComponentPropsWithRef<typeof TabNav.Root>) {
  return (
    <React.Suspense fallback={null}>
      <TabNavDemoImpl {...props} />
    </React.Suspense>
  )
}
