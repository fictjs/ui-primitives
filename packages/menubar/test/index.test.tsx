/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Content, Item, Menu, Menubar, Trigger } from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    }),
  )
}

function keyDown(target: Element, key: string): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
    }),
  )
}

function pointerDown(target: Element): void {
  const PointerEventCtor = globalThis.PointerEvent ?? MouseEvent
  target.dispatchEvent(
    new PointerEventCtor('pointerdown', {
      bubbles: true,
      cancelable: true,
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

describe('@fictjs/menubar', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('opens a menu from its trigger and closes after selecting an item', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Menubar>
          <Menu value="file">
            <Trigger data-testid="file-trigger">File</Trigger>
            <Content data-testid="file-content">
              <Item data-testid="file-item">New</Item>
            </Content>
          </Menu>
        </Menubar>
      ),
      container,
    )

    click(container.querySelector('[data-testid="file-trigger"]') as HTMLButtonElement)
    await waitForEffects()

    expect(container.querySelector('[data-testid="file-content"]')).not.toBeNull()

    click(container.querySelector('[data-testid="file-item"]') as HTMLDivElement)
    await waitForEffects()

    expect(container.querySelector('[data-testid="file-content"]')).toBeNull()
  })

  it('moves focus across triggers with horizontal arrow keys', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Menubar>
          <Menu value="file">
            <Trigger data-testid="file-trigger">File</Trigger>
            <Content />
          </Menu>
          <Menu value="edit">
            <Trigger data-testid="edit-trigger">Edit</Trigger>
            <Content />
          </Menu>
        </Menubar>
      ),
      container,
    )

    await waitForEffects()

    const fileTrigger = container.querySelector('[data-testid="file-trigger"]') as HTMLButtonElement
    const editTrigger = container.querySelector('[data-testid="edit-trigger"]') as HTMLButtonElement

    fileTrigger.focus()
    keyDown(fileTrigger, 'ArrowRight')
    await waitForEffects()
    expect(document.activeElement).toBe(editTrigger)

    keyDown(editTrigger, 'ArrowLeft')
    await waitForEffects()
    expect(document.activeElement).toBe(fileTrigger)
  })

  it('anchors content to its trigger and repositions after scrolling', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Menubar>
          <Menu value="file">
            <Trigger data-testid="file-trigger">File</Trigger>
            <Content data-testid="file-content" avoidCollisions={false}>
              <Item>New</Item>
            </Content>
          </Menu>
        </Menubar>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="file-trigger"]') as HTMLButtonElement
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

    const content = container.querySelector('[data-testid="file-content"]') as HTMLDivElement
    const wrapper = content.parentElement as HTMLDivElement
    expect(container.querySelectorAll('[data-radix-popper-content-wrapper]')).toHaveLength(1)
    expect(wrapper.style.position).toBe('fixed')
    expect(wrapper.style.transform).toBe('translate(18px, 36px)')
    expect(content.getAttribute('data-side')).toBe('bottom')
    expect(content.getAttribute('data-align')).toBe('start')
    expect(content.style.getPropertyValue('--radix-menubar-trigger-width')).toBe(
      'var(--radix-popper-anchor-width)',
    )

    triggerX = 48
    window.dispatchEvent(new Event('scroll'))
    await waitForEffects()
    expect(wrapper.style.transform).toBe('translate(48px, 36px)')
  })

  it('keeps content open when outside interaction is prevented', async () => {
    const container = document.createElement('div')
    const outside = document.createElement('button')
    document.body.append(container, outside)

    mount(
      () => (
        <Menubar>
          <Menu value="file">
            <Trigger data-testid="file-trigger">File</Trigger>
            <Content
              data-testid="file-content"
              onInteractOutside={(event) => event.preventDefault()}
            >
              <Item>New</Item>
            </Content>
          </Menu>
        </Menubar>
      ),
      container,
    )

    click(container.querySelector('[data-testid="file-trigger"]') as HTMLButtonElement)
    await waitForEffects()
    pointerDown(outside)
    await waitForEffects()

    expect(container.querySelector('[data-testid="file-content"]')).not.toBeNull()
  })

  it('invokes the latest replaced trigger event handler', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const first = vi.fn((event: MouseEvent) => event.preventDefault())
    const second = vi.fn((event: MouseEvent) => event.preventDefault())
    const handler = createSignal<(event: MouseEvent) => void>(first)

    function DynamicTrigger() {
      const callbackProps = {
        'data-testid': 'trigger',
        children: 'File',
        get onClick() {
          return handler()
        },
      } as Parameters<typeof Trigger>[0]

      return Trigger(callbackProps)
    }

    mount(
      () => (
        <Menubar>
          <Menu value="file">
            <DynamicTrigger />
          </Menu>
        </Menubar>
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
