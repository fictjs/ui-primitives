import { describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  HoverCardContent,
  HoverCardRoot,
  HoverCardTrigger,
} from '../../src/components/overlay/hover-card'

describe('HoverCard', () => {
  it('renders content when controlled open=true', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: HoverCardRoot,
        props: {
          open: true,
          children: [
            { type: HoverCardTrigger, props: { 'data-testid': 'trigger', children: 'Profile' } },
            {
              type: HoverCardContent,
              props: {
                portal: false,
                children: 'Hover profile',
              },
            },
          ],
        },
      }),
      container,
    )

    await Promise.resolve()

    expect(container.querySelector('[data-hover-card-content]')).not.toBeNull()

    dispose()
    container.remove()
  })

  it('opens and closes with configured hover delays', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: HoverCardRoot,
        props: {
          openDelay: 20,
          closeDelay: 20,
          children: [
            { type: HoverCardTrigger, props: { 'data-testid': 'trigger-delay', children: 'Profile' } },
            {
              type: HoverCardContent,
              props: {
                portal: false,
                children: 'Hover profile',
              },
            },
          ],
        },
      }),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger-delay"]') as HTMLElement

    fireEvent.pointerEnter(trigger)
    await vi.advanceTimersByTimeAsync(19)
    expect(container.querySelector('[data-hover-card-content]')).toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    expect(container.querySelector('[data-hover-card-content]')).not.toBeNull()

    fireEvent.pointerLeave(trigger)
    await vi.advanceTimersByTimeAsync(20)
    expect(container.querySelector('[data-hover-card-content]')).toBeNull()

    dispose()
    container.remove()
    vi.useRealTimers()
  })
})
