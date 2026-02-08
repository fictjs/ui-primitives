import { describe, expect, it, vi } from 'vitest'
import { onMount, type FictNode, render } from '@fictjs/runtime'

import {
  ToastAction,
  ToastClose,
  ToastProvider,
  ToastRoot,
  ToastViewport,
  useToast,
} from '../../src/components/feedback/toast'

function EmitToast(): FictNode {
  const { show } = useToast()

  onMount(() => {
    show({ title: 'Saved', description: 'Record updated', duration: 2000 })
  })

  return null
}

function EmitShortToast(): FictNode {
  const { show } = useToast()

  onMount(() => {
    show({ title: 'Short', description: 'Expires quickly', duration: 50 })
  })

  return null
}

function EmitAndDismissToast(): FictNode {
  const { show, dismiss } = useToast()

  onMount(() => {
    const id = show({ title: 'Transient', description: 'Will dismiss', duration: 5000 })
    dismiss(id)
  })

  return null
}

describe('Toast', () => {
  it('renders provider queued toast in viewport', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: ToastProvider,
        props: {
          children: [
            { type: EmitToast, props: {} },
            { type: ToastViewport, props: { 'data-testid': 'viewport' } },
          ],
        },
      }),
      container,
    )

    await Promise.resolve()

    const viewport = container.querySelector('[data-testid="viewport"]')
    expect(viewport?.textContent).toContain('Saved')
    expect(viewport?.textContent).toContain('Record updated')

    dispose()
    container.remove()
  })

  it('auto-dismisses toast by duration', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: ToastProvider,
        props: {
          children: [
            { type: EmitShortToast, props: {} },
            { type: ToastViewport, props: { 'data-testid': 'viewport-auto' } },
          ],
        },
      }),
      container,
    )

    await Promise.resolve()
    const viewport = container.querySelector('[data-testid="viewport-auto"]')
    expect(viewport?.textContent).toContain('Short')

    vi.advanceTimersByTime(60)
    await Promise.resolve()
    expect(viewport?.textContent).not.toContain('Short')

    dispose()
    container.remove()
    vi.useRealTimers()
  })

  it('supports immediate dismiss through hook API', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: ToastProvider,
        props: {
          children: [
            { type: EmitAndDismissToast, props: {} },
            { type: ToastViewport, props: { 'data-testid': 'viewport-dismiss' } },
          ],
        },
      }),
      container,
    )

    await Promise.resolve()
    const viewport = container.querySelector('[data-testid="viewport-dismiss"]')
    expect(viewport?.textContent).not.toContain('Transient')

    dispose()
    container.remove()
  })

  it('renders toast action with accessible label', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: ToastRoot,
        props: {
          title: 'Actionable',
          children: {
            type: ToastAction,
            props: {
              altText: 'Undo change',
              'data-testid': 'action',
              children: 'Undo',
            },
          },
        },
      }),
      container,
    )

    const action = container.querySelector('[data-testid="action"]')
    expect(action?.getAttribute('aria-label')).toBe('Undo change')
    expect(action?.textContent).toContain('Undo')

    dispose()
    container.remove()
  })

  it('supports asChild on toast close control', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const onClick = vi.fn()

    const dispose = render(
      () => ({
        type: ToastClose,
        props: {
          asChild: true,
          onClick,
          children: {
            type: 'span',
            props: {
              role: 'button',
              'data-testid': 'toast-close-child',
              children: 'Close',
            },
          },
        },
      }),
      container,
    )

    const close = container.querySelector('[data-testid="toast-close-child"]') as HTMLElement
    close.click()
    await Promise.resolve()

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(close.getAttribute('data-toast-close')).toBe('')

    dispose()
    container.remove()
  })
})
