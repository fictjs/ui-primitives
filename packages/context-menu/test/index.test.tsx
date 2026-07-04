/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import { Content, ContextMenu, Item, Portal, Trigger } from '../src/index.js'

function contextMenu(target: Element, clientX = 40, clientY = 80): void {
  target.dispatchEvent(
    new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
    }),
  )
}

function escape(): void {
  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
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

describe('@fictjs/context-menu', () => {
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
  })

  it('opens at the pointer position from the trigger context menu event', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <ContextMenu>
          <Trigger data-testid="trigger">Area</Trigger>
          <Content data-testid="content">
            <Item data-testid="item">Action</Item>
          </Content>
        </ContextMenu>
      ),
      container,
    )

    contextMenu(container.querySelector('[data-testid="trigger"]') as HTMLDivElement, 32, 64)
    await waitForEffects()

    const wrapper = container.querySelector('[data-radix-popper-content-wrapper]') as HTMLDivElement
    const content = container.querySelector('[data-testid="content"]') as HTMLDivElement

    expect(wrapper).not.toBeNull()
    expect(content).not.toBeNull()
    expect(wrapper.style.position).toBe('fixed')
    expect(wrapper.style.left).toBe('0px')
    expect(wrapper.style.top).toBe('0px')
    expect(wrapper.style.transform).toBe('translate(34px, 64px)')
    expect(wrapper.style.minWidth).toBe('max-content')
    expect(content.style.width).toBe('100%')
  })

  it('can reopen after closing the first context menu instance', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <>
          <ContextMenu>
            <Trigger data-testid="first-trigger">Area 1</Trigger>
            <Portal container={portalRoot}>
              <Content data-testid="first-content">
                <Item data-testid="first-item">First action</Item>
              </Content>
            </Portal>
          </ContextMenu>
          <ContextMenu>
            <Trigger data-testid="second-trigger">Area 2</Trigger>
            <Portal container={portalRoot}>
              <Content data-testid="second-content">
                <Item data-testid="second-item">Second action</Item>
              </Content>
            </Portal>
          </ContextMenu>
        </>
      ),
      container,
    )

    const firstTrigger = container.querySelector('[data-testid="first-trigger"]') as HTMLDivElement
    const secondTrigger = container.querySelector(
      '[data-testid="second-trigger"]',
    ) as HTMLDivElement

    contextMenu(firstTrigger)
    await waitForEffects()
    await waitForEffects()
    escape()
    await waitForEffects()
    await waitForEffects()
    expect(portalRoot.querySelector('[data-testid="first-content"]')).toBeNull()

    contextMenu(secondTrigger, 72, 96)
    await waitForEffects()
    await waitForEffects()

    expect(portalRoot.querySelector('[data-testid="second-content"]')).not.toBeNull()
  })

  it('can reopen from the same trigger after closing with escape', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <ContextMenu>
          <Trigger data-testid="trigger">Area</Trigger>
          <Portal container={portalRoot}>
            <Content data-testid="content">
              <Item data-testid="item">Action</Item>
            </Content>
          </Portal>
        </ContextMenu>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLDivElement

    contextMenu(trigger, 32, 64)
    await waitForEffects()
    await waitForEffects()
    expect(portalRoot.querySelector('[data-testid="content"]')).not.toBeNull()

    escape()
    await waitForEffects()
    await waitForEffects()
    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()

    contextMenu(trigger, 72, 96)
    await waitForEffects()
    await waitForEffects()

    expect(portalRoot.querySelector('[data-testid="content"]')).not.toBeNull()
  })
})
