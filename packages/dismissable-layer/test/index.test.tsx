/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { Presence } from '../../presence/src/index.js'

import { Branch, Root } from '../src/index.js'

function pointerDown(target: Element): void {
  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
    }),
  )
}

function pressEscape(target: Document): void {
  const KeyboardEventCtor = target.defaultView?.KeyboardEvent ?? KeyboardEvent
  target.dispatchEvent(
    new KeyboardEventCtor('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    }),
  )
}

async function flushEffects(cycles = 4): Promise<void> {
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

async function waitForListenerRegistration(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await flushEffects()
}

describe('@fictjs/dismissable-layer', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
    vi.restoreAllMocks()
  })

  it('dismisses when pointerdown happens outside', async () => {
    const onDismiss = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <div>
          <Root onDismiss={onDismiss}>
            <button data-testid="inside" type="button">
              Inside
            </button>
          </Root>
          <button data-testid="outside" type="button">
            Outside
          </button>
        </div>
      ),
      container,
    )

    await waitForListenerRegistration()

    pointerDown(container.querySelector('[data-testid="outside"]') as HTMLButtonElement)
    await flushEffects()

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('dismisses through the latest handler supplied by component props', async () => {
    const calls: string[] = []
    const onDismiss = createSignal<() => void>(() => calls.push('first'))
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <div>
          <Root onDismiss={prop(() => onDismiss())}>
            <button type="button">Inside</button>
          </Root>
          <button data-testid="outside" type="button">
            Outside
          </button>
        </div>
      ),
      container,
    )

    await waitForListenerRegistration()

    const outside = container.querySelector('[data-testid="outside"]') as HTMLButtonElement
    pointerDown(outside)
    onDismiss(() => calls.push('second'))
    pointerDown(outside)
    await flushEffects()

    expect(calls).toEqual(['first', 'second'])
  })

  it('does not dismiss when pointerdown happens inside a branch', async () => {
    const onDismiss = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <div>
          <Root onDismiss={onDismiss}>
            <button data-testid="inside" type="button">
              Inside
            </button>
          </Root>
          <Branch>
            <button data-testid="branch" type="button">
              Branch
            </button>
          </Branch>
        </div>
      ),
      container,
    )

    await waitForListenerRegistration()

    pointerDown(container.querySelector('[data-testid="branch"]') as HTMLButtonElement)
    await flushEffects()

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses when focus moves outside', async () => {
    const onDismiss = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <div>
          <Root onDismiss={onDismiss}>
            <button data-testid="inside" type="button">
              Inside
            </button>
          </Root>
          <button data-testid="outside" type="button">
            Outside
          </button>
        </div>
      ),
      container,
    )

    await waitForListenerRegistration()

    const inside = container.querySelector('[data-testid="inside"]') as HTMLButtonElement
    const outside = container.querySelector('[data-testid="outside"]') as HTMLButtonElement

    inside.focus()
    outside.focus()
    await flushEffects()

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('supports Fict capture props while preserving dismissable behavior', async () => {
    const onPointerDownCapture = vi.fn()
    const captureProps = {
      'oncapture:pointerdown': onPointerDownCapture,
    } as const
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root {...captureProps}>
          <button data-testid="inside" type="button">
            Inside
          </button>
        </Root>
      ),
      container,
    )

    await waitForListenerRegistration()

    pointerDown(container.querySelector('[data-testid="inside"]') as HTMLButtonElement)
    await flushEffects()

    expect(onPointerDownCapture).toHaveBeenCalledTimes(1)
  })

  it('disables outside pointer events and restores them on unmount', async () => {
    const open = createSignal(true)
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <>
          {reactive(() =>
            open() ? (
              <Root data-testid="layer" disableOutsidePointerEvents>
                <button data-testid="inside" type="button">
                  Inside
                </button>
              </Root>
            ) : null,
          )}
        </>
      ),
      container,
    )

    await waitForListenerRegistration()

    expect(document.body.style.pointerEvents).toBe('none')

    open(false)
    await flushEffects()

    expect(document.body.style.pointerEvents).toBe('')
  })

  it('reapplies outside pointer event locking after reopening', async () => {
    const open = createSignal(true)
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <>
          {reactive(() =>
            open() ? (
              <Root data-testid="layer" disableOutsidePointerEvents>
                <button data-testid="inside" type="button">
                  Inside
                </button>
              </Root>
            ) : null,
          )}
        </>
      ),
      container,
    )

    await waitForListenerRegistration()
    expect(document.body.style.pointerEvents).toBe('none')

    open(false)
    await flushEffects()
    expect(document.body.style.pointerEvents).toBe('')

    open(true)
    await waitForListenerRegistration()
    expect(document.body.style.pointerEvents).toBe('none')
  })

  it('reapplies outside pointer event locking when presence remounts the layer', async () => {
    const present = createSignal(true)
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Presence present={present}>
          <Root data-testid="layer" disableOutsidePointerEvents>
            <button data-testid="inside" type="button">
              Inside
            </button>
          </Root>
        </Presence>
      ),
      container,
    )

    await waitForListenerRegistration()
    expect(document.body.style.pointerEvents).toBe('none')

    present(false)
    await waitForListenerRegistration()
    expect(document.body.style.pointerEvents).toBe('')

    present(true)
    await waitForListenerRegistration()
    expect(document.body.style.pointerEvents).toBe('none')
  })

  it('only dismisses the topmost layer on escape', async () => {
    const onOuterDismiss = vi.fn()
    const onInnerDismiss = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root onDismiss={onOuterDismiss}>
          <button data-testid="outer" type="button">
            Outer
          </button>
          <Root onDismiss={onInnerDismiss}>
            <button data-testid="inner" type="button">
              Inner
            </button>
          </Root>
        </Root>
      ),
      container,
    )

    await waitForListenerRegistration()

    const inner = container.querySelector('[data-testid="inner"]') as HTMLButtonElement
    inner.focus()
    pressEscape(document)
    await flushEffects()

    expect(onInnerDismiss).toHaveBeenCalledTimes(1)
    expect(onOuterDismiss).not.toHaveBeenCalled()
  })

  it('binds escape handling and pointer locks to the layer owner document', async () => {
    const iframe = document.createElement('iframe')
    const onDismiss = vi.fn()
    document.body.append(iframe)
    const frameDocument = iframe.contentDocument as Document
    const frameContainer = frameDocument.createElement('div')
    frameDocument.body.append(frameContainer)

    mount(
      () => (
        <Root disableOutsidePointerEvents onDismiss={onDismiss}>
          <button type="button">Inside frame</button>
        </Root>
      ),
      frameContainer,
    )

    await waitForListenerRegistration()

    expect(document.body.style.pointerEvents).toBe('')
    expect(frameDocument.body.style.pointerEvents).toBe('none')

    pressEscape(document)
    await flushEffects()
    expect(onDismiss).not.toHaveBeenCalled()

    pressEscape(frameDocument)
    await flushEffects()
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
