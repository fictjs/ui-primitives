/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import { Content, DropdownMenu, Item, Portal, Trigger } from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', {
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
    vi.clearAllMocks()
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
            <Content data-testid="content">
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

    let trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    click(container.querySelector('[data-testid="item"]') as HTMLDivElement)
    await waitForEffects()
    await waitForEffects()
    trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    expect(container.querySelector('[data-testid="content"]')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})
