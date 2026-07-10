/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import { DismissableLayer } from '@fictjs/dismissable-layer'
import { Action, Close, Description, Provider, Root, Title, Viewport } from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    }),
  )
}

function pointer(target: Element, type: string, init: PointerEventInit = {}): PointerEvent {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: 'mouse',
    ...init,
  })
  target.dispatchEvent(event)
  return event
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

    mount(
      () => (
        <Provider>
          <Viewport data-testid="viewport" />
          <Root defaultOpen data-testid="toast">
            <Title data-testid="title">Saved</Title>
            <Description data-testid="description">Changes stored.</Description>
            <Close data-testid="close">Dismiss</Close>
          </Root>
        </Provider>
      ),
      container,
    )

    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLOListElement
    const toast = viewport.querySelector('[data-testid="toast"]') as HTMLLIElement

    expect(viewport.parentElement?.getAttribute('role')).toBe('region')
    expect(viewport.parentElement?.getAttribute('aria-label')).toBe('Notifications (F8)')
    expect(toast.getAttribute('data-state')).toBe('open')
    expect(toast.querySelector('[data-testid="title"]')?.textContent).toBe('Saved')

    click(viewport.querySelector('[data-testid="close"]') as HTMLButtonElement)
    await waitForEffects()

    expect(viewport.querySelector('[data-testid="toast"]')).toBeNull()
    expect(viewport.getAttribute('data-state')).toBe('closed')
  })

  it('auto closes after the configured duration and remains paused while focus is in the viewport', async () => {
    vi.useFakeTimers()
    const onPause = vi.fn()
    const onResume = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Provider duration={50}>
          <Viewport data-testid="viewport" />
          <Root defaultOpen data-testid="toast" onPause={onPause} onResume={onResume}>
            <Title>Queued</Title>
            <Close data-testid="close">Dismiss</Close>
          </Root>
        </Provider>
      ),
      container,
    )

    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLOListElement
    const wrapper = viewport.parentElement as HTMLDivElement
    const close = viewport.querySelector('[data-testid="close"]') as HTMLButtonElement
    expect(viewport.querySelector('[data-testid="toast"]')).not.toBeNull()

    viewport.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }))
    close.focus()
    expect(onPause).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(100)
    await waitForEffects()
    expect(viewport.querySelector('[data-testid="toast"]')).not.toBeNull()

    wrapper.dispatchEvent(new PointerEvent('pointerleave'))
    vi.advanceTimersByTime(60)
    await waitForEffects()
    expect(viewport.querySelector('[data-testid="toast"]')).not.toBeNull()
    ;(document.body as HTMLElement).focus()
    close.blur()
    expect(onResume).toHaveBeenCalledOnce()
    wrapper.dispatchEvent(new PointerEvent('pointerleave'))
    vi.advanceTimersByTime(60)
    await waitForEffects()
    expect(viewport.querySelector('[data-testid="toast"]')).toBeNull()
  })

  it('allows escape dismissal to be prevented', async () => {
    const onEscapeKeyDown = vi.fn((event: KeyboardEvent) => event.preventDefault())
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Provider>
          <Viewport />
          <Root defaultOpen data-testid="toast" onEscapeKeyDown={onEscapeKeyDown}>
            Stay open
          </Root>
        </Provider>
      ),
      container,
    )

    await waitForEffects()
    const toast = container.querySelector('[data-testid="toast"]') as HTMLLIElement
    toast.focus()
    toast.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }),
    )
    await waitForEffects()

    expect(onEscapeKeyDown).toHaveBeenCalledOnce()
    expect(container.querySelector('[data-testid="toast"]')).toBe(toast)
  })

  it('announces toast content and uses action alt text only in the live region', async () => {
    const container = document.createElement('div')
    const announcerContainer = document.createElement('div')
    document.body.append(container)
    document.body.append(announcerContainer)

    mount(
      () => (
        <Provider announcerContainer={announcerContainer} label="Alert">
          <Viewport data-testid="viewport" />
          <Root defaultOpen type="background" data-testid="toast">
            <Title>Saved</Title>
            <Description>Changes stored.</Description>
            <Action data-testid="action" altText="Undo last save">
              Undo
            </Action>
            <Close>Dismiss</Close>
          </Root>
        </Provider>
      ),
      container,
    )

    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLOListElement
    const action = container.querySelector('[data-testid="action"]') as HTMLButtonElement
    const announcer = announcerContainer.querySelector(
      '[data-radix-toast-announcer]',
    ) as HTMLElement

    expect(action.getAttribute('aria-label')).toBeNull()
    expect(action.textContent).toBe('Undo')
    expect(action.type).toBe('button')
    expect(announcer.getAttribute('aria-live')).toBe('polite')
    expect(container.querySelector('[data-testid="toast"]')?.getAttribute('role')).toBeNull()
    await vi.waitFor(() => {
      expect(announcer.textContent).toContain('Alert Saved Changes stored. Undo last save')
    })
    expect(announcer.textContent).not.toContain('Dismiss')

    action.focus()
    click(action)
    await waitForEffects()

    expect(viewport.querySelector('[data-testid="toast"]')).toBeNull()
    expect(document.activeElement).toBe(viewport)
  })

  it('focuses the viewport with its hotkey and tabs into the newest toast', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Provider>
          <Viewport data-testid="viewport" />
          <Root defaultOpen data-testid="older">
            Older
          </Root>
          <Root defaultOpen data-testid="newer">
            Newer
          </Root>
        </Provider>
      ),
      container,
    )

    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLOListElement

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        code: 'F8',
      }),
    )
    await waitForEffects()

    expect(document.activeElement).toBe(viewport)

    viewport.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab' }),
    )
    expect(document.activeElement).toBe(viewport.querySelector('[data-testid="newer"]'))
  })

  it('keeps toasts with an infinite duration open', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Provider duration={Infinity}>
          <Viewport />
          <Root defaultOpen data-testid="toast">
            Persistent
          </Root>
        </Provider>
      ),
      container,
    )

    await waitForEffects()
    vi.advanceTimersByTime(100_000)
    await waitForEffects()

    expect(container.querySelector('[data-testid="toast"]')).not.toBeNull()
  })

  it('acts as a dismissable-layer branch and keeps focus in the viewport when closing', async () => {
    const onDismiss = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <>
          <DismissableLayer disableOutsidePointerEvents onDismiss={onDismiss} data-testid="dialog">
            Dialog
          </DismissableLayer>
          <Provider>
            <Viewport data-testid="viewport" />
            <Root defaultOpen data-testid="toast">
              <Action altText="Dismiss notification" data-testid="action">
                Dismiss
              </Action>
            </Root>
          </Provider>
        </>
      ),
      container,
    )

    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLOListElement
    const toast = viewport.querySelector('[data-testid="toast"]') as HTMLLIElement
    const action = toast.querySelector('[data-testid="action"]') as HTMLButtonElement

    expect(document.body.style.pointerEvents).toBe('none')
    expect(viewport.parentElement?.style.pointerEvents).toBe('auto')

    action.focus()
    pointer(action, 'pointerdown')
    click(action)
    await waitForEffects()

    expect(onDismiss).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(viewport)
  })

  it('dispatches a pointer-captured swipe lifecycle and closes past the threshold', async () => {
    const onSwipeStart = vi.fn()
    const onSwipeMove = vi.fn()
    const onSwipeEnd = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Provider swipeThreshold={50}>
          <Viewport />
          <Root
            defaultOpen
            data-testid="toast"
            onSwipeStart={onSwipeStart}
            onSwipeMove={onSwipeMove}
            onSwipeEnd={onSwipeEnd}
          >
            Swipe me
          </Root>
        </Provider>
      ),
      container,
    )

    await waitForEffects()
    const toast = container.querySelector('[data-testid="toast"]') as HTMLLIElement
    const setPointerCapture = vi.fn()
    const releasePointerCapture = vi.fn()
    Object.assign(toast, {
      setPointerCapture,
      releasePointerCapture,
      hasPointerCapture: () => true,
    })

    pointer(toast, 'pointerdown', { button: 0, clientX: 0, clientY: 0 })
    pointer(toast, 'pointermove', { clientX: 20, clientY: 1 })
    pointer(toast, 'pointermove', { clientX: 60, clientY: 1 })

    expect(toast.getAttribute('data-swipe')).toBe('move')
    expect(onSwipeStart).toHaveBeenCalledTimes(1)
    expect(onSwipeMove).toHaveBeenCalledTimes(1)
    expect(setPointerCapture).toHaveBeenCalledWith(1)
    expect(onSwipeMove.mock.calls[0]?.[0].detail.delta).toEqual({ x: 60, y: 0 })

    pointer(toast, 'pointerup', { clientX: 60, clientY: 1 })
    await waitForEffects()

    expect(onSwipeEnd).toHaveBeenCalledTimes(1)
    expect(releasePointerCapture).toHaveBeenCalledWith(1)
    expect(container.querySelector('[data-testid="toast"]')).toBeNull()
  })

  it('cancels an active swipe on pointercancel without closing', async () => {
    const onSwipeCancel = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Provider>
          <Viewport />
          <Root defaultOpen data-testid="toast" onSwipeCancel={onSwipeCancel}>
            Swipe me
          </Root>
        </Provider>
      ),
      container,
    )

    await waitForEffects()
    const toast = container.querySelector('[data-testid="toast"]') as HTMLLIElement
    Object.assign(toast, {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      hasPointerCapture: () => true,
    })

    pointer(toast, 'pointerdown', { button: 0, clientX: 0, clientY: 0 })
    pointer(toast, 'pointermove', { clientX: 20, clientY: 0 })
    pointer(toast, 'pointercancel', { clientX: 20, clientY: 0 })
    await waitForEffects()

    expect(onSwipeCancel).toHaveBeenCalledTimes(1)
    expect(toast.getAttribute('data-swipe')).toBe('cancel')
    expect(container.querySelector('[data-testid="toast"]')).toBe(toast)
  })

  it('does not render an action with empty alt text', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Provider>
          <Viewport />
          <Root defaultOpen>
            <Action altText="" data-testid="action">
              Undo
            </Action>
          </Root>
        </Provider>
      ),
      container,
    )

    await waitForEffects()

    expect(container.querySelector('[data-testid="action"]')).toBeNull()
    expect(consoleError).toHaveBeenCalledOnce()
  })
})
