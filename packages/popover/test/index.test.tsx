/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prop, render, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

const hideOthersMock = vi.hoisted(() => vi.fn(() => () => {}))

vi.mock('aria-hidden', () => ({
  hideOthers: hideOthersMock,
}))

vi.mock('@fictjs/fict-remove-scroll', () => ({
  RemoveScroll: (props: { children?: unknown }) => props.children ?? null,
}))

vi.mock('@fictjs/popper', async () => {
  const { mergeProps, prop } = await import('@fictjs/runtime')
  const { Primitive } = await import('@fictjs/primitive')

  const Popper = (props: { children?: unknown }) => props.children ?? null
  const PopperAnchor = (props: Record<string, unknown>) => (
    <Primitive.div {...props} data-popper-anchor="" />
  )
  const PopperContent = (props: Record<string, unknown>) => (
    <Primitive.div {...mergeProps(prop(() => props))} data-popper-content="" />
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
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
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

describe('@fictjs/popover', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    document.body.innerHTML = ''
    hideOthersMock.mockClear()
    vi.clearAllMocks()
  })

  it('opens in a portal and closes via PopoverClose', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <Popover>
          <PopoverTrigger data-testid="trigger">Toggle</PopoverTrigger>
          <PopoverPortal container={portalRoot}>
            <PopoverContent data-testid="content">
              <PopoverArrow data-testid="arrow" />
              <PopoverClose data-testid="close">Close</PopoverClose>
            </PopoverContent>
          </PopoverPortal>
        </Popover>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    click(trigger)
    await waitForEffects()

    const content = portalRoot.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(content).not.toBeNull()
    expect(content.getAttribute('role')).toBe('dialog')
    expect(content.getAttribute('data-state')).toBe('open')
    expect(content.getAttribute('id')).toBe(trigger.getAttribute('aria-controls'))
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(portalRoot.querySelector('[data-testid="arrow"]')).not.toBeNull()

    click(portalRoot.querySelector('[data-testid="close"]') as HTMLButtonElement)
    await waitForEffects()

    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(hideOthersMock).not.toHaveBeenCalled()
  })

  it('preserves latest callbacks and reactive props through modal content wrappers', async () => {
    const container = document.createElement('div')
    const calls: string[] = []
    const label = createSignal('first label')
    const onEscapeKeyDown = createSignal<(event: KeyboardEvent) => void>(() => {
      calls.push('first')
    })
    document.body.append(container)

    mount(
      () => (
        <Popover defaultOpen modal>
          <PopoverTrigger>Toggle</PopoverTrigger>
          <PopoverPortal>
            <PopoverContent
              data-testid="content"
              aria-label={prop(() => label()) as unknown as string}
              onEscapeKeyDown={
                prop(() => onEscapeKeyDown()) as unknown as (event: KeyboardEvent) => void
              }
            />
          </PopoverPortal>
        </Popover>
      ),
      container,
    )

    await waitForEffects()
    label('second label')
    onEscapeKeyDown(() => calls.push('second'))
    await flushEffects()

    const content = document.body.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(content.getAttribute('aria-label')).toBe('second label')

    pressEscape(document)
    await waitForEffects()

    expect(calls).toEqual(['second'])
  })

  it('wraps the trigger in a default popper anchor when no custom anchor exists', () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Popover>
          <PopoverTrigger data-testid="trigger">Toggle</PopoverTrigger>
        </Popover>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    expect(trigger.hasAttribute('data-popper-anchor')).toBe(true)
  })

  it('uses PopoverAnchor instead of wrapping the trigger', () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Popover>
          <PopoverAnchor data-testid="anchor">Anchor</PopoverAnchor>
          <PopoverTrigger data-testid="trigger">Toggle</PopoverTrigger>
        </Popover>
      ),
      container,
    )

    return waitForEffects().then(() => {
      const anchor = container.querySelector('[data-testid="anchor"]') as HTMLDivElement
      const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

      expect(anchor.hasAttribute('data-popper-anchor')).toBe(true)
      expect(trigger.hasAttribute('data-popper-anchor')).toBe(false)
    })
  })

  it('locks modal focus flow and restores trigger focus on escape', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Popover modal>
          <PopoverTrigger data-testid="trigger">Toggle</PopoverTrigger>
          <PopoverPortal>
            <PopoverContent data-testid="content">
              <button data-testid="inside" type="button">
                Inside
              </button>
            </PopoverContent>
          </PopoverPortal>
        </Popover>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    trigger.focus()

    click(trigger)
    await waitForEffects()

    expect(document.body.style.pointerEvents).toBe('none')
    expect(hideOthersMock).toHaveBeenCalledTimes(1)

    pressEscape(document)
    await waitForEffects()
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
    expect(document.body.style.pointerEvents).toBe('')
    expect(document.activeElement).toBe(trigger)
  })

  it('closes when the trigger is pressed a second time', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <Popover>
          <PopoverTrigger data-testid="trigger">Toggle</PopoverTrigger>
          <PopoverPortal container={portalRoot}>
            <PopoverContent data-testid="content">Content</PopoverContent>
          </PopoverPortal>
        </Popover>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    click(trigger)
    await waitForEffects()
    expect(portalRoot.querySelector('[data-testid="content"]')).not.toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    click(trigger)
    await waitForEffects()

    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes when composed through a custom trigger component', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    function TriggerButton(props: { 'data-testid'?: string; children?: FictNode }) {
      return (
        <button type="button" data-testid={props['data-testid']}>
          {props.children}
        </button>
      )
    }

    mount(
      () => (
        <Popover>
          <PopoverTrigger>
            <TriggerButton data-testid="trigger">Toggle</TriggerButton>
          </PopoverTrigger>
          <PopoverPortal container={portalRoot}>
            <PopoverContent data-testid="content">Content</PopoverContent>
          </PopoverPortal>
        </Popover>
      ),
      container,
    )

    await waitForEffects()

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    click(trigger)
    await waitForEffects()
    expect(portalRoot.querySelector('[data-testid="content"]')).not.toBeNull()

    const nextTrigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    click(nextTrigger)
    await waitForEffects()

    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('closes when composed through a forwardRef trigger component', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    function ForwardRefTriggerButton(props: {
      'data-testid'?: string
      children?: FictNode
      ref?: { current: HTMLButtonElement | null } | ((node: HTMLButtonElement | null) => void)
    }) {
      return (
        <button type="button" data-testid={props['data-testid']} ref={props.ref as never}>
          {props.children}
        </button>
      )
    }

    mount(
      () => (
        <Popover>
          <PopoverTrigger>
            <ForwardRefTriggerButton data-testid="trigger">Toggle</ForwardRefTriggerButton>
          </PopoverTrigger>
          <PopoverPortal container={portalRoot}>
            <PopoverContent data-testid="content">Content</PopoverContent>
          </PopoverPortal>
        </Popover>
      ),
      container,
    )

    await waitForEffects()

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    click(trigger)
    await waitForEffects()
    expect(portalRoot.querySelector('[data-testid="content"]')).not.toBeNull()

    const nextTrigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    click(nextTrigger)
    await waitForEffects()

    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('closes portal content when controlled open changes to false', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)
    const open = createSignal(false)

    mount(
      () => (
        <Popover open={open} onOpenChange={open}>
          <PopoverTrigger data-testid="trigger">Toggle</PopoverTrigger>
          <PopoverPortal container={portalRoot}>
            <PopoverContent data-testid="content">Content</PopoverContent>
          </PopoverPortal>
        </Popover>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    click(trigger)
    await waitForEffects()
    expect(portalRoot.querySelector('[data-testid="content"]')).not.toBeNull()

    open(false)
    await waitForEffects()

    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()
  })
})
