/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

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
    Arrow: PopperArrow
  }
})

import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger
} from '../src/index.js'

function pointerMove(target: Element): void {
  target.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse'
    })
  )
}

function pressEscape(target: Document): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape'
    })
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

    mount(() => (
      <TooltipProvider delayDuration={500} disableHoverableContent>
        <Tooltip>
          <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
          <TooltipContent data-testid="content">Tooltip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ), container)

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    pointerMove(trigger)
    await advance(499)
    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()

    await advance(1)
    const content = document.body.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(content).not.toBeNull()
    expect(content.getAttribute('data-state')).toBe('delayed-open')
  })

  it('opens on focus and closes on blur', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
          <TooltipContent data-testid="content">Tooltip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ), container)

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    trigger.focus()
    await waitForEffects()
    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()

    pressEscape(document)
    await waitForEffects()
    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('renders in a custom portal and exposes accessible hidden tooltip content', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(() => (
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
    ), container)

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

    mount(() => (
      <TooltipProvider disableHoverableContent>
        <Tooltip defaultOpen>
          <TooltipTrigger data-testid="trigger">One</TooltipTrigger>
          <TooltipContent data-testid="content">First</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ), container)

    await waitForEffects()
    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()

    document.dispatchEvent(new CustomEvent('tooltip.open'))
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
  })
})
