/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import { Content, ContextMenu, Item, Trigger } from '../src/index.js'

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
    vi.clearAllMocks()
  })

  it('opens at the pointer position from the trigger context menu event', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <ContextMenu>
        <Trigger data-testid="trigger">Area</Trigger>
        <Content data-testid="content">
          <Item data-testid="item">Action</Item>
        </Content>
      </ContextMenu>
    ), container)

    contextMenu(container.querySelector('[data-testid="trigger"]') as HTMLDivElement, 32, 64)
    await waitForEffects()

    const content = container.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(content).not.toBeNull()
    expect(content.style.left).toBe('32px')
    expect(content.style.top).toBe('64px')
  })
})
