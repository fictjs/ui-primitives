/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

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
})
