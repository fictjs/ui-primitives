/** @jsxImportSource @fictjs/runtime */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

vi.mock('@fictjs/popper', async () => {
  const { Primitive } = await import('@fictjs/primitive')
  const { mergeProps, prop } = await import('@fictjs/runtime')

  const Popper = (props: { children?: unknown }) => props.children ?? null
  const PopperAnchor = (props: Record<string, unknown>) => {
    const primitiveProps = mergeProps(
      prop(() => props),
      { 'data-popper-anchor': '' },
    )
    return <Primitive.div {...primitiveProps} />
  }
  const PopperContent = (props: Record<string, unknown>) => {
    const primitiveProps = mergeProps(
      prop(() => props),
      { 'data-popper-content': '' },
    )
    return <Primitive.div {...primitiveProps} />
  }
  const PopperArrow = (props: Record<string, unknown>) => {
    const primitiveProps = mergeProps(
      prop(() => props),
      { 'data-popper-arrow': '' },
    )
    return <Primitive.svg {...primitiveProps} />
  }

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

import { Arrow, Content, HoverCard, HoverCardPortal, Trigger } from '../src/index.js'

function pointerEvent(target: Element, type: string, init: PointerEventInit = {}): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
      ...init,
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

async function advance(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
  await flushEffects()
}

describe('@fictjs/hover-card', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('opens after the open delay and closes after the close delay', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <HoverCard openDelay={50} closeDelay={20}>
          <Trigger data-testid="trigger">Profile</Trigger>
          <HoverCardPortal container={portalRoot}>
            <Content data-testid="content">Preview</Content>
          </HoverCardPortal>
        </HoverCard>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLAnchorElement
    pointerEvent(trigger, 'pointerenter')
    await advance(49)
    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()

    await advance(1)
    expect(portalRoot.querySelector('[data-testid="content"]')).not.toBeNull()

    pointerEvent(trigger, 'pointerleave')
    await advance(19)
    expect(portalRoot.querySelector('[data-testid="content"]')).not.toBeNull()

    await advance(1)
    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('keeps the card open while the pointer moves into content', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <HoverCard openDelay={0} closeDelay={30}>
          <Trigger data-testid="trigger">Profile</Trigger>
          <HoverCardPortal container={portalRoot}>
            <Content data-testid="content">Preview</Content>
          </HoverCardPortal>
        </HoverCard>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLAnchorElement
    pointerEvent(trigger, 'pointerenter')
    await advance(0)

    const content = portalRoot.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(content).not.toBeNull()

    pointerEvent(trigger, 'pointerleave')
    pointerEvent(content, 'pointerenter')
    await advance(30)
    expect(portalRoot.querySelector('[data-testid="content"]')).not.toBeNull()

    pointerEvent(content, 'pointerleave')
    await advance(30)
    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('closes after leaving the current trigger once the card is open', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <HoverCard openDelay={0} closeDelay={20}>
          <Trigger data-testid="trigger">Profile</Trigger>
          <HoverCardPortal container={portalRoot}>
            <Content data-testid="content">Preview</Content>
          </HoverCardPortal>
        </HoverCard>
      ),
      container,
    )

    const initialTrigger = container.querySelector('[data-testid="trigger"]') as HTMLAnchorElement
    pointerEvent(initialTrigger, 'pointerenter')
    await advance(0)

    const currentTrigger = container.querySelector('[data-testid="trigger"]') as HTMLAnchorElement
    expect(portalRoot.querySelector('[data-testid="content"]')).not.toBeNull()

    pointerEvent(currentTrigger, 'pointerleave')
    await advance(20)
    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('supports forced mounting and renders the arrow inside the portal', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <HoverCard openDelay={0}>
          <Trigger data-testid="trigger">Profile</Trigger>
          <HoverCardPortal container={portalRoot} forceMount>
            <Content data-testid="content">
              <Arrow data-testid="arrow" />
            </Content>
          </HoverCardPortal>
        </HoverCard>
      ),
      container,
    )

    await flushEffects()

    const content = portalRoot.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(content).not.toBeNull()
    expect(content.getAttribute('data-state')).toBe('closed')
    expect(portalRoot.querySelector('[data-testid="arrow"]')).not.toBeNull()

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLAnchorElement
    pointerEvent(trigger, 'pointerenter')
    await advance(0)

    expect(trigger.getAttribute('data-state')).toBe('open')
    expect(portalRoot.querySelectorAll('[data-testid="content"]')).toHaveLength(1)

    const updatedContent = portalRoot.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(updatedContent.getAttribute('data-state')).toBe('open')
  })
})
