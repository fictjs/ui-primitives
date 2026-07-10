/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Content, DropdownMenu, Item, Portal, Trigger } from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerType: 'mouse',
    }),
  )
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    }),
  )
}

function keydown(target: EventTarget, key: string): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
    }),
  )
}

async function waitForEffects(cycles = 6): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
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

async function waitForCondition(
  predicate: () => boolean,
  message: string,
  attempts = 20,
): Promise<void> {
  for (let index = 0; index < attempts; index++) {
    if (predicate()) {
      return
    }

    await waitForEffects()
  }

  throw new Error(message)
}

describe('@fictjs/dropdown-menu', () => {
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
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('opens from its trigger and renders content in a portal', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <DropdownMenu>
          <Trigger data-testid="trigger">Open</Trigger>
          <Portal container={portalRoot}>
            <Content data-testid="content" avoidCollisions={false}>
              <Item data-testid="item">Item</Item>
            </Content>
          </Portal>
        </DropdownMenu>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    click(trigger)
    await waitForEffects()
    await waitForEffects()
    const nextTrigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    expect(portalRoot.querySelector('[data-testid="content"]')).not.toBeNull()
    expect(nextTrigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('positions portaled content next to the trigger instead of leaving it in normal flow', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <DropdownMenu>
          <Trigger data-testid="trigger">Open</Trigger>
          <Portal container={portalRoot}>
            <Content data-testid="content" avoidCollisions={false}>
              <Item data-testid="item">Item</Item>
            </Content>
          </Portal>
        </DropdownMenu>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    let triggerX = 18
    vi.spyOn(trigger, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          x: triggerX,
          y: 12,
          width: 34,
          height: 24,
          top: 12,
          right: triggerX + 34,
          bottom: 36,
          left: triggerX,
          toJSON: () => ({}),
        }) as DOMRect,
    )

    click(trigger)
    await waitForEffects()
    await waitForEffects()

    const wrapper = portalRoot.querySelector(
      '[data-radix-popper-content-wrapper]',
    ) as HTMLDivElement
    const content = portalRoot.querySelector('[data-testid="content"]') as HTMLDivElement

    expect(wrapper.style.position).toBe('fixed')
    expect(wrapper.style.left).toBe('0px')
    expect(wrapper.style.top).toBe('0px')
    expect(wrapper.style.transform).toBe('translate(18px, 40px)')
    expect(wrapper.style.minWidth).toBe('max-content')
    expect(content.style.width).toBe('100%')
    expect(content.getAttribute('data-side')).toBe('bottom')

    triggerX = 48
    window.dispatchEvent(new Event('scroll'))
    await waitForEffects()
    expect(wrapper.style.transform).toBe('translate(48px, 40px)')
  })

  it('flips content above the trigger near the viewport bottom', async () => {
    vi.stubGlobal('innerWidth', 480)
    vi.stubGlobal('innerHeight', 320)

    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <DropdownMenu>
          <Trigger data-testid="trigger">Open</Trigger>
          <Portal container={portalRoot}>
            <Content data-testid="content">
              <Item data-testid="first">First item</Item>
              <Item data-testid="second">Second item</Item>
            </Content>
          </Portal>
        </DropdownMenu>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 18,
      y: 280,
      width: 96,
      height: 30,
      top: 280,
      right: 114,
      bottom: 310,
      left: 18,
      toJSON: () => ({}),
    } as DOMRect)

    click(trigger)
    await waitForEffects()
    await waitForEffects()

    const wrapper = portalRoot.querySelector(
      '[data-radix-popper-content-wrapper]',
    ) as HTMLDivElement
    const content = portalRoot.querySelector('[data-testid="content"]') as HTMLDivElement

    expect(content.getAttribute('data-side')).toBe('top')
    expect(wrapper.style.transform).toBe('translate(18px, 276px)')
    expect(wrapper.style.getPropertyValue('--radix-popper-anchor-height')).toBe('30px')
  })

  it('uses logical RTL alignment and does not leak collision configuration props', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <DropdownMenu dir="rtl">
          <Trigger data-testid="trigger">Open</Trigger>
          <Content
            data-testid="content"
            align="start"
            avoidCollisions={false}
            collisionPadding={12}
            sticky="always"
            hideWhenDetached
            updatePositionStrategy="always"
          >
            <Item>Item</Item>
          </Content>
        </DropdownMenu>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 20,
      width: 80,
      height: 30,
      top: 20,
      right: 180,
      bottom: 50,
      left: 100,
      toJSON: () => ({}),
    } as DOMRect)
    click(trigger)
    await waitForEffects()

    const content = container.querySelector('[data-testid="content"]') as HTMLDivElement
    Object.defineProperties(content, {
      offsetWidth: { configurable: true, value: 60 },
      offsetHeight: { configurable: true, value: 40 },
    })
    vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 60,
      height: 40,
      top: 0,
      right: 60,
      bottom: 40,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect)
    window.dispatchEvent(new Event('resize'))
    await waitForEffects()

    const wrapper = content.parentElement as HTMLDivElement
    expect(wrapper.getAttribute('dir')).toBe('rtl')
    expect(wrapper.style.transform).toBe('translate(180px, 54px)')
    expect(content.getAttribute('data-align')).toBe('start')
    expect(content.hasAttribute('avoidcollisions')).toBe(false)
    expect(content.hasAttribute('collisionpadding')).toBe(false)
    expect(content.hasAttribute('sticky')).toBe(false)
    expect(content.hasAttribute('hidewhendetached')).toBe(false)
    expect(content.hasAttribute('updatepositionstrategy')).toBe(false)
  })

  it('restores body pointer events after closing one menu so another trigger can open', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <>
          <DropdownMenu>
            <Trigger data-testid="first-trigger">First</Trigger>
            <Content data-testid="first-content">
              <Item data-testid="first-item">First item</Item>
            </Content>
          </DropdownMenu>
          <DropdownMenu>
            <Trigger data-testid="second-trigger">Second</Trigger>
            <Content data-testid="second-content">
              <Item>Second item</Item>
            </Content>
          </DropdownMenu>
        </>
      ),
      container,
    )

    const firstTrigger = container.querySelector(
      '[data-testid="first-trigger"]',
    ) as HTMLButtonElement
    const secondTrigger = container.querySelector(
      '[data-testid="second-trigger"]',
    ) as HTMLButtonElement

    click(firstTrigger)
    await waitForEffects()
    await waitForEffects()

    click(container.querySelector('[data-testid="first-item"]') as HTMLDivElement)
    await waitForCondition(
      () => container.querySelector('[data-testid="first-content"]') === null,
      'expected the first dropdown menu to close after selecting an item',
    )

    click(secondTrigger)
    await waitForEffects()
    await waitForEffects()

    expect(container.querySelector('[data-testid="second-content"]')).not.toBeNull()
  })

  it('restores the trigger closed state when content closes', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <DropdownMenu defaultOpen>
          <Trigger data-testid="trigger">Open</Trigger>
          <Content data-testid="content">
            <Item data-testid="item">Item</Item>
          </Content>
        </DropdownMenu>
      ),
      container,
    )

    await waitForEffects()

    click(container.querySelector('[data-testid="item"]') as HTMLDivElement)
    await waitForEffects()
    await waitForEffects()
    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    expect(container.querySelector('[data-testid="content"]')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('reopens from the same trigger after closing', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <DropdownMenu>
          <Trigger data-testid="trigger">Open</Trigger>
          <Content data-testid="content">
            <Item data-testid="item">Item</Item>
          </Content>
        </DropdownMenu>
      ),
      container,
    )

    let trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    click(trigger)
    await waitForEffects()
    await waitForEffects()

    click(container.querySelector('[data-testid="item"]') as HTMLDivElement)
    await waitForEffects()
    await waitForEffects()

    trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    click(trigger)
    await waitForEffects()
    await waitForEffects()

    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('reopens from the same trigger after closing with escape', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <DropdownMenu>
          <Trigger data-testid="trigger">Open</Trigger>
          <Content data-testid="content">
            <Item data-testid="item">Item</Item>
          </Content>
        </DropdownMenu>
      ),
      container,
    )

    let trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    click(trigger)
    await waitForEffects()
    await waitForEffects()

    keydown(document, 'Escape')
    await waitForEffects()
    await waitForEffects()

    trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    click(trigger)
    await waitForEffects()
    await waitForEffects()

    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('closes portaled content after selecting an item in a custom portal container', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <DropdownMenu defaultOpen>
          <Trigger data-testid="trigger">Open</Trigger>
          <Portal container={portalRoot}>
            <Content data-testid="content">
              <Item data-testid="item">Item</Item>
            </Content>
          </Portal>
        </DropdownMenu>
      ),
      container,
    )

    await waitForEffects()
    click(portalRoot.querySelector('[data-testid="item"]') as HTMLDivElement)
    await waitForEffects()
    await waitForEffects()

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes portaled content after selecting an item when mounted in document.body', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <DropdownMenu defaultOpen>
          <Trigger data-testid="trigger">Open</Trigger>
          <Portal>
            <Content data-testid="content">
              <Item data-testid="item">Item</Item>
            </Content>
          </Portal>
        </DropdownMenu>
      ),
      container,
    )

    await waitForEffects()
    click(document.querySelector('[data-testid="item"]') as HTMLDivElement)
    await waitForEffects()
    await waitForEffects()

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    expect(document.querySelector('[data-testid="content"]')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('invokes the latest replaced trigger event handler', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const first = vi.fn((event: PointerEvent) => event.preventDefault())
    const second = vi.fn((event: PointerEvent) => event.preventDefault())
    const handler = createSignal<(event: PointerEvent) => void>(first)

    function DynamicTrigger() {
      const callbackProps = {
        'data-testid': 'trigger',
        children: 'Open',
        get onPointerDown() {
          return handler()
        },
      } as Parameters<typeof Trigger>[0]

      return Trigger(callbackProps)
    }

    mount(
      () => (
        <DropdownMenu>
          <DynamicTrigger />
        </DropdownMenu>
      ),
      container,
    )

    await waitForEffects()
    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    click(trigger)
    expect(first).toHaveBeenCalledOnce()

    handler(second)
    await waitForEffects()
    click(trigger)
    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})
