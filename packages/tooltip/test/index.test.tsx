/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

vi.mock('@fictjs/popper', async () => {
  const { Primitive } = await import('@fictjs/primitive')

  const Popper = (props: { children?: unknown }) => props.children ?? null
  const PopperAnchor = (props: Record<string, unknown>) => (
    <Primitive.div {...props} data-popper-anchor="" />
  )
  const PopperContent = (props: Record<string, unknown>) => (
    <Primitive.div {...props} data-popper-content="" />
  )
  const PopperArrow = (props: Record<string, unknown>) => (
    <Primitive.svg {...props} data-popper-arrow="" />
  )

  return {
    createPopperScope: () => () => ({}),
    Popper,
    PopperAnchor,
    PopperContent,
    PopperArrow,
    Root: Popper,
    Anchor: PopperAnchor,
    Content: PopperContent,
    Arrow: PopperArrow,
  }
})

import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '../src/index.js'

function pointerMove(target: Element, clientX = 0, clientY = 0): void {
  target.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      pointerType: 'mouse',
    }),
  )
}

function pointerLeave(target: Element, clientX = 0, clientY = 0): void {
  target.dispatchEvent(
    new PointerEvent('pointerleave', {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      pointerType: 'mouse',
    }),
  )
}

function pointerDown(target: Element): void {
  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
    }),
  )
}

function pointerUp(target: Document): void {
  target.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
    }),
  )
}

function pressEscape(target: Document): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
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

async function waitForEffects(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await flushEffects()
}

async function advance(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
  await flushEffects()
}

describe('@fictjs/tooltip', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    vi.useRealTimers()
    vi.clearAllTimers()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('opens after the configured delay and exposes delayed-open state', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <TooltipProvider delayDuration={500} disableHoverableContent>
          <Tooltip>
            <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
            <TooltipContent data-testid="content">Tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    pointerMove(trigger)
    await advance(499)
    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()

    await advance(1)
    const content = document.body.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(content).not.toBeNull()
    expect(content.getAttribute('data-state')).toBe('delayed-open')
  })

  it('does not keep rescheduling delayed open while the pointer is already over the trigger', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <TooltipProvider delayDuration={500} disableHoverableContent>
          <Tooltip>
            <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
            <TooltipContent data-testid="content">Tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    pointerMove(trigger)
    await flushEffects()
    expect(vi.getTimerCount()).toBe(1)

    pointerMove(trigger)
    await flushEffects()
    expect(vi.getTimerCount()).toBe(1)

    await advance(500)
    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()
  })

  it('cancels a pending delayed open when the trigger is clicked before the timer fires', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <TooltipProvider delayDuration={500} disableHoverableContent>
          <Tooltip>
            <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
            <TooltipContent data-testid="content">Tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    pointerMove(trigger)
    await flushEffects()
    trigger.click()
    await flushEffects()
    expect(vi.getTimerCount()).toBe(0)

    await advance(500)
    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('does not reschedule delayed open from pointer moves fired after a click until the pointer leaves', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <TooltipProvider delayDuration={500} disableHoverableContent>
          <Tooltip>
            <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
            <TooltipContent data-testid="content">Tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    pointerDown(trigger)
    pointerUp(document)
    trigger.click()
    await flushEffects()

    pointerMove(trigger)
    await flushEffects()
    expect(vi.getTimerCount()).toBe(0)

    pointerLeave(trigger)
    pointerMove(trigger)
    await flushEffects()
    expect(vi.getTimerCount()).toBe(1)
  })

  it('opens on focus and closes on blur', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
            <TooltipContent data-testid="content">Tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    trigger.focus()
    await waitForEffects()
    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()

    pressEscape(document)
    await waitForEffects()
    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('snapshots hoverability for each mounted content instance', async () => {
    const container = document.createElement('div')
    const disableHoverableContent = createSignal(false)
    document.body.append(container)

    mount(
      () => (
        <TooltipProvider disableHoverableContent={disableHoverableContent}>
          <Tooltip>
            <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
            <TooltipContent data-testid="content">Tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    const addEventListener = vi.spyOn(trigger, 'addEventListener')
    trigger.focus()
    await waitForEffects()

    const content = document.body.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(
      addEventListener.mock.calls.filter(([eventName]) => eventName === 'pointerleave'),
    ).toHaveLength(1)

    disableHoverableContent(true)
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).toBe(content)

    pressEscape(document)
    await waitForEffects()
    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()

    trigger.blur()
    trigger.focus()
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).not.toBe(content)
    expect(
      addEventListener.mock.calls.filter(([eventName]) => eventName === 'pointerleave'),
    ).toHaveLength(1)
  })

  it('keeps trigger leave behavior aligned with the active content mode', async () => {
    const container = document.createElement('div')
    const disableHoverableContent = createSignal(true)
    document.body.append(container)

    mount(
      () => (
        <TooltipProvider disableHoverableContent={disableHoverableContent}>
          <Tooltip>
            <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
            <TooltipContent data-testid="content">Tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    trigger.focus()
    await waitForEffects()
    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()

    disableHoverableContent(false)
    await waitForEffects()
    pointerLeave(trigger)
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()

    trigger.blur()
    trigger.focus()
    await waitForEffects()
    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()

    pointerLeave(trigger)
    await waitForEffects()
    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()
  })

  it('refreshes force-mounted hover behavior while closed for the next open cycle', async () => {
    const container = document.createElement('div')
    const disableHoverableContent = createSignal(true)
    const open = createSignal(false)
    const onOpenChange = vi.fn()
    document.body.append(container)

    mount(
      () => (
        <TooltipProvider disableHoverableContent={disableHoverableContent}>
          <Tooltip
            open={open}
            onOpenChange={(nextOpen) => {
              onOpenChange(nextOpen)
              open(nextOpen)
            }}
          >
            <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
            <TooltipContent forceMount data-testid="content">
              Tooltip
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      container,
    )

    await waitForEffects()
    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    const content = document.body.querySelector('[data-testid="content"]') as HTMLDivElement

    expect(content.getAttribute('data-state')).toBe('closed')

    disableHoverableContent(false)
    await waitForEffects()

    open(true)
    await waitForEffects()
    expect(open()).toBe(true)

    Object.defineProperty(trigger, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20 }) as DOMRect,
    })
    Object.defineProperty(content, 'getBoundingClientRect', {
      value: () =>
        ({ left: 0, top: 30, right: 100, bottom: 50, width: 100, height: 20 }) as DOMRect,
    })

    pointerLeave(trigger, 50, 20)
    await waitForEffects()
    expect(onOpenChange).not.toHaveBeenCalled()

    pointerMove(document.body, 500, 500)
    await waitForEffects()
    expect(open()).toBe(false)
    expect(content.getAttribute('data-state')).toBe('closed')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders in a custom portal and exposes accessible hidden tooltip content', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <TooltipProvider>
          <Tooltip defaultOpen>
            <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
            <TooltipPortal container={portalRoot}>
              <TooltipContent aria-label="Helpful label" data-testid="content">
                <span data-testid="visible">Visible</span>
                <TooltipArrow data-testid="arrow" />
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </TooltipProvider>
      ),
      container,
    )

    await waitForEffects()

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    const content = portalRoot.querySelector('[data-testid="content"]') as HTMLDivElement
    const accessibleNode = portalRoot.querySelector('[role="tooltip"]') as HTMLSpanElement

    expect(content).not.toBeNull()
    expect(portalRoot.querySelector('[data-testid="visible"]')).not.toBeNull()
    expect(portalRoot.querySelector('[data-testid="arrow"]')).not.toBeNull()
    expect(accessibleNode.textContent).toBe('Helpful label')
    expect(accessibleNode.getAttribute('id')).toBe(trigger.getAttribute('aria-describedby'))
  })

  it('closes an open tooltip when a tooltip-open event is dispatched', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <TooltipProvider disableHoverableContent>
          <Tooltip defaultOpen>
            <TooltipTrigger data-testid="trigger">One</TooltipTrigger>
            <TooltipContent data-testid="content">First</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()

    document.dispatchEvent(new CustomEvent('tooltip.open'))
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
  })
})
