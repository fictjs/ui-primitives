import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from '../../src/components/overlay/popover'

describe('Popover', () => {
  it('supports asChild trigger composition', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: PopoverRoot,
        props: {
          children: [
            {
              type: PopoverTrigger,
              props: {
                asChild: true,
                children: {
                  type: 'span',
                  props: {
                    role: 'button',
                    'data-testid': 'trigger-as-child',
                    children: 'Open',
                  },
                },
              },
            },
            {
              type: PopoverContent,
              props: {
                portal: false,
                children: 'Popover Body',
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="trigger-as-child"]') as HTMLElement)
    await Promise.resolve()
    expect(container.querySelector('[data-popover-content]')).not.toBeNull()

    dispose()
    container.remove()
  })

  it('toggles content visibility via trigger', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: PopoverRoot,
        props: {
          children: [
            { type: PopoverTrigger, props: { 'data-testid': 'trigger', children: 'Open' } },
            {
              type: PopoverContent,
              props: {
                portal: false,
                children: 'Popover Body',
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-popover-content]')).not.toBeNull()

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-popover-content]')).toBeNull()

    dispose()
    container.remove()
  })

  it('exposes onEscapeKeyDown and allows preventing dismissal', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    let intercepted = false

    const dispose = render(
      () => ({
        type: PopoverRoot,
        props: {
          defaultOpen: true,
          children: {
            type: PopoverContent,
            props: {
              portal: false,
              onEscapeKeyDown: (event: KeyboardEvent) => {
                intercepted = true
                event.preventDefault()
              },
              children: 'Popover Body',
            },
          },
        },
      }),
      container,
    )

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await Promise.resolve()

    expect(intercepted).toBe(true)
    expect(container.querySelector('[data-popover-content]')).not.toBeNull()

    dispose()
    container.remove()
  })

  it('supports explicit id injection for deterministic aria wiring', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: PopoverRoot,
        props: {
          id: 'profile-popover',
          children: [
            { type: PopoverTrigger, props: { 'data-testid': 'popover-trigger', children: 'Open' } },
            {
              type: PopoverContent,
              props: {
                portal: false,
                children: 'Popover Body',
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="popover-trigger"]') as HTMLElement)
    await Promise.resolve()

    const trigger = container.querySelector('[data-testid="popover-trigger"]') as HTMLElement
    const content = container.querySelector('[data-popover-content]') as HTMLElement
    expect(trigger.getAttribute('aria-controls')).toBe('profile-popover-content')
    expect(content.id).toBe('profile-popover-content')

    dispose()
    container.remove()
  })
})
