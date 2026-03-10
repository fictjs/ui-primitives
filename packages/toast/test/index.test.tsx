/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import {
  Action,
  Close,
  Description,
  Provider,
  Root,
  Title,
  Viewport,
} from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    }),
  )
}

async function waitForEffects(cycles = 6): Promise<void> {
  if (vi.isFakeTimers()) {
    await vi.advanceTimersByTimeAsync(0)
  } else {
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
  for (let index = 0; index < cycles; index++) {
    await new Promise<void>((resolve) => {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(resolve)
        return
      }

      Promise.resolve().then(resolve)
    })
  }
}

describe('@fictjs/toast', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    document.body.innerHTML = ''
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders toasts inside the viewport and closes through ToastClose', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <Provider>
        <Viewport data-testid="viewport" />
        <Root defaultOpen data-testid="toast">
          <Title data-testid="title">Saved</Title>
          <Description data-testid="description">Changes stored.</Description>
          <Close data-testid="close">Dismiss</Close>
        </Root>
      </Provider>
    ), container)

    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLOListElement
    const toast = viewport.querySelector('[data-testid="toast"]') as HTMLLIElement

    expect(viewport.getAttribute('role')).toBe('region')
    expect(viewport.getAttribute('aria-label')).toBe('Notifications (F8)')
    expect(toast.getAttribute('data-state')).toBe('open')
    expect(toast.querySelector('[data-testid="title"]')?.textContent).toBe('Saved')

    click(viewport.querySelector('[data-testid="close"]') as HTMLButtonElement)
    await waitForEffects()

    expect(viewport.querySelector('[data-testid="toast"]')).toBeNull()
    expect(viewport.getAttribute('data-state')).toBe('closed')
  })

  it('auto closes after the configured duration and pauses while the viewport is interacted with', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <Provider duration={50}>
        <Viewport data-testid="viewport" />
        <Root defaultOpen data-testid="toast">
          <Title>Queued</Title>
        </Root>
      </Provider>
    ), container)

    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLOListElement
    expect(viewport.querySelector('[data-testid="toast"]')).not.toBeNull()

    viewport.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }))
    vi.advanceTimersByTime(100)
    await waitForEffects()
    expect(viewport.querySelector('[data-testid="toast"]')).not.toBeNull()

    viewport.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
    vi.advanceTimersByTime(60)
    await waitForEffects()
    expect(viewport.querySelector('[data-testid="toast"]')).toBeNull()
  })

  it('wires ToastAction alt text and viewport hotkey focus management', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <Provider>
        <Viewport data-testid="viewport" />
        <Root defaultOpen>
          <Action data-testid="action" altText="Undo last save">
            Undo
          </Action>
        </Root>
      </Provider>
    ), container)

    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLOListElement
    const action = container.querySelector('[data-testid="action"]') as HTMLButtonElement

    expect(action.getAttribute('aria-label')).toBe('Undo last save')

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        code: 'F8',
      }),
    )
    await waitForEffects()

    expect(document.activeElement).toBe(viewport)
  })
})
