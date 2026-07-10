/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import { Icon, Input, Root, Slot, Toggle } from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

function pointerDown(target: Element): void {
  target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
}

async function flushEffects(cycles = 6): Promise<void> {
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

describe('@fictjs/password-toggle-field', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('toggles the input type and returns focus to the input after click-triggered toggles', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Input data-testid="input" defaultValue="secret" />
          <Toggle data-testid="toggle">Show</Toggle>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const input = container.querySelector('[data-testid="input"]') as HTMLInputElement
    const toggle = container.querySelector('[data-testid="toggle"]') as HTMLButtonElement
    input.focus()
    input.setSelectionRange(1, 3)
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true, cancelable: true }))

    pointerDown(toggle)
    click(toggle)
    await waitForEffects()

    expect(input.getAttribute('type')).toBe('text')
    expect(document.activeElement).toBe(input)
    expect(toggle.getAttribute('aria-controls')).toBe(input.getAttribute('id'))
  })

  it('notifies visibility changes through the documented callback', async () => {
    const container = document.createElement('div')
    const onVisibilityChange = vi.fn()
    document.body.append(container)

    mount(
      () => (
        <Root onVisibilityChange={onVisibilityChange}>
          <Input defaultValue="secret" />
          <Toggle data-testid="toggle">Show</Toggle>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    click(container.querySelector('[data-testid="toggle"]') as HTMLButtonElement)
    await waitForEffects()

    expect(onVisibilityChange).toHaveBeenCalledOnce()
    expect(onVisibilityChange).toHaveBeenCalledWith(true)
  })

  it('links the toggle to a provided input id after hydration', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Input data-testid="input" id="account-password" defaultValue="secret" />
          <Toggle data-testid="toggle">Show</Toggle>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const toggle = container.querySelector('[data-testid="toggle"]') as HTMLButtonElement
    expect(toggle.getAttribute('aria-controls')).toBe('account-password')
  })

  it('renders slot and icon variants from visibility state', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Input data-testid="input" defaultValue="secret" />
          <Toggle data-testid="toggle">Show</Toggle>
          <Slot
            visible={<span data-testid="slot-visible">Visible</span>}
            hidden={<span data-testid="slot-hidden">Hidden</span>}
          />
          <Icon
            data-testid="icon"
            visible={<path data-testid="icon-visible" d="M0 0" />}
            hidden={<path data-testid="icon-hidden" d="M1 1" />}
          />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const toggle = container.querySelector('[data-testid="toggle"]') as HTMLButtonElement
    expect(container.querySelector('[data-testid="slot-hidden"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="icon-hidden"]')).not.toBeNull()

    click(toggle)
    await waitForEffects()

    expect(container.querySelector('[data-testid="slot-visible"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="icon-visible"]')).not.toBeNull()
  })
})
