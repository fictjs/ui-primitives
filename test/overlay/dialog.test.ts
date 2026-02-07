import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import {
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '../../src/components/overlay/dialog'

describe('Dialog', () => {
  it('opens via trigger and closes via close button', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: DialogRoot,
        props: {
          children: [
            { type: DialogTrigger, props: { 'data-testid': 'trigger', children: 'Open' } },
            {
              type: DialogContent,
              props: {
                portal: false,
                children: [
                  { type: DialogTitle, props: { children: 'My Dialog' } },
                  { type: DialogClose, props: { 'data-testid': 'close', children: 'Close' } },
                ],
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    await Promise.resolve()

    const content = container.querySelector('[data-dialog-content]')
    expect(content).not.toBeNull()
    expect(content?.getAttribute('role')).toBe('dialog')

    fireEvent.click(container.querySelector('[data-testid="close"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-dialog-content]')).toBeNull()

    dispose()
    container.remove()
  })

  it('supports controlled open state and emits onOpenChange', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const open = createSignal(false)
    const changes: boolean[] = []

    const dispose = render(
      () => ({
        type: DialogRoot,
        props: {
          open: () => open(),
          onOpenChange: (next: boolean) => changes.push(next),
          children: [
            { type: DialogTrigger, props: { 'data-testid': 'trigger', children: 'Open' } },
            {
              type: DialogContent,
              props: {
                portal: false,
                children: 'Body',
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    await Promise.resolve()

    expect(changes).toEqual([true])
    expect(container.querySelector('[data-dialog-content]')).toBeNull()

    open(true)
    await Promise.resolve()
    expect(container.querySelector('[data-dialog-content]')).not.toBeNull()

    dispose()
    container.remove()
  })

  it('renders closed state when forceMount is enabled', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: DialogRoot,
        props: {
          defaultOpen: false,
          children: [
            {
              type: DialogContent,
              props: {
                portal: false,
                forceMount: true,
                children: 'Forced body',
              },
            },
          ],
        },
      }),
      container,
    )

    await Promise.resolve()

    const content = container.querySelector('[data-dialog-content]')
    expect(content).not.toBeNull()
    expect(content?.getAttribute('data-state')).toBe('closed')

    dispose()
    container.remove()
  })

  it('dismisses via escape key', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: DialogRoot,
        props: {
          defaultOpen: true,
          children: [
            { type: DialogOverlay, props: { 'data-testid': 'overlay' } },
            {
              type: DialogContent,
              props: {
                portal: false,
                children: 'Body',
              },
            },
          ],
        },
      }),
      container,
    )

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await Promise.resolve()
    expect(container.querySelector('[data-dialog-content]')).toBeNull()

    dispose()
    container.remove()
  })

  it('dismisses via overlay click', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: DialogRoot,
        props: {
          defaultOpen: true,
          children: [
            { type: DialogOverlay, props: { 'data-testid': 'overlay-click' } },
            {
              type: DialogContent,
              props: {
                portal: false,
                children: 'Body',
              },
            },
          ],
        },
      }),
      container,
    )

    await Promise.resolve()
    const overlay = document.body.querySelector('[data-testid="overlay-click"]') as HTMLElement | null
    expect(overlay).not.toBeNull()
    fireEvent.click(overlay as HTMLElement)
    await Promise.resolve()
    expect(container.querySelector('[data-dialog-content]')).toBeNull()

    dispose()
    container.remove()
  })
})
