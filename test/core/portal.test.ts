import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Portal, PortalHost } from '../../src/components/core/portal'

describe('Portal', () => {
  it('renders into provided container', () => {
    const root = document.createElement('div')
    const target = document.createElement('div')
    document.body.appendChild(root)
    document.body.appendChild(target)

    const dispose = render(
      () => ({
        type: Portal,
        props: {
          container: target,
          children: { type: 'span', props: { children: 'portal-text' } },
        },
      }),
      root,
    )

    expect(target.textContent).toContain('portal-text')

    dispose()
    root.remove()
    target.remove()
  })

  it('uses PortalHost container when not explicitly provided', () => {
    const root = document.createElement('div')
    const target = document.createElement('div')
    document.body.appendChild(root)
    document.body.appendChild(target)

    const dispose = render(
      () => ({
        type: PortalHost,
        props: {
          container: target,
          children: {
            type: Portal,
            props: {
              children: { type: 'span', props: { children: 'from-host' } },
            },
          },
        },
      }),
      root,
    )

    expect(target.textContent).toContain('from-host')

    dispose()
    root.remove()
    target.remove()
  })

  it('supports function children accessors', async () => {
    const root = document.createElement('div')
    const target = document.createElement('div')
    document.body.appendChild(root)
    document.body.appendChild(target)

    const open = createSignal(false)

    const dispose = render(
      () => ({
        type: Portal,
        props: {
          container: target,
          children: () => (open() ? { type: 'span', props: { children: 'visible' } } : null),
        },
      }),
      root,
    )

    expect(target.textContent).toBe('')

    open(true)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(target.textContent).toContain('visible')

    dispose()
    root.remove()
    target.remove()
  })
})
