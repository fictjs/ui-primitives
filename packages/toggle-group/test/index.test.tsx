/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import { Item, Root } from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

function keyDown(target: Element, key: string, init: KeyboardEventInit = {}): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
      ...init,
    }),
  )
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

async function waitForDeferredFocus(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await flushEffects()
}

async function waitForUpdates(): Promise<void> {
  await waitForDeferredFocus()
  await flushEffects()
}

describe('@fictjs/toggle-group', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('supports single selection and exposes radio semantics', async () => {
    const onValueChange = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="single" onValueChange={onValueChange}>
          <Item value="one">One</Item>
          <Item value="two">Two</Item>
        </Root>
      ),
      container,
    )

    await flushEffects()

    const getButtons = () => {
      const buttons = Array.from(container.querySelectorAll('button'))
      expect(buttons).toHaveLength(2)
      return buttons as [HTMLButtonElement, HTMLButtonElement]
    }
    let [one, two] = getButtons()

    expect(one.getAttribute('role')).toBe('radio')
    expect(one.getAttribute('aria-pressed')).toBeNull()
    expect(one.getAttribute('aria-checked')).toBe('false')

    click(one)
    await waitForUpdates()
    ;[one, two] = getButtons()

    expect(onValueChange).toHaveBeenNthCalledWith(1, 'one')
    expect(one.getAttribute('aria-checked')).toBe('true')
    expect(one.getAttribute('data-state')).toBe('on')

    click(two)
    await waitForUpdates()
    ;[one, two] = getButtons()

    expect(onValueChange).toHaveBeenNthCalledWith(2, 'two')
    expect(one.getAttribute('aria-checked')).toBe('false')
    expect(two.getAttribute('aria-checked')).toBe('true')

    click(two)
    await waitForUpdates()
    ;[one, two] = getButtons()

    expect(onValueChange).toHaveBeenNthCalledWith(3, '')
    expect(two.getAttribute('aria-checked')).toBe('false')
  })

  it('supports multiple selection', async () => {
    const onValueChange = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="multiple" onValueChange={onValueChange}>
          <Item value="one">One</Item>
          <Item value="two">Two</Item>
        </Root>
      ),
      container,
    )

    await flushEffects()

    const getButtons = () => {
      const buttons = Array.from(container.querySelectorAll('button'))
      expect(buttons).toHaveLength(2)
      return buttons as [HTMLButtonElement, HTMLButtonElement]
    }
    let [one, two] = getButtons()

    click(one)
    await waitForUpdates()
    ;[one, two] = getButtons()
    click(two)
    await waitForUpdates()
    ;[one, two] = getButtons()
    click(two)
    await waitForUpdates()
    ;[one, two] = getButtons()

    expect(onValueChange).toHaveBeenNthCalledWith(1, ['one'])
    expect(onValueChange).toHaveBeenNthCalledWith(2, ['one', 'two'])
    expect(onValueChange).toHaveBeenNthCalledWith(3, ['one'])
    expect(one.getAttribute('data-state')).toBe('on')
    expect(two.getAttribute('data-state')).toBe('off')
  })

  it('moves focus to the selected item when the group receives focus', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="single" defaultValue="two" orientation="horizontal">
          <Item value="one">One</Item>
          <Item value="two">Two</Item>
          <Item value="three">Three</Item>
        </Root>
      ),
      container,
    )

    await flushEffects()

    const getGroup = () => container.querySelector('[role="group"]') as HTMLDivElement
    const getButtons = () => {
      const buttons = Array.from(container.querySelectorAll('button'))
      expect(buttons).toHaveLength(3)
      return buttons as [HTMLButtonElement, HTMLButtonElement, HTMLButtonElement]
    }
    let [one, two, three] = getButtons()

    getGroup().focus()
    await waitForUpdates()
    ;[one, two, three] = getButtons()

    expect(document.activeElement).toBe(two)
  })

  it('propagates disabled state to items', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="multiple" disabled>
          <Item value="one">One</Item>
          <Item value="two">Two</Item>
        </Root>
      ),
      container,
    )

    await flushEffects()

    const buttons = Array.from(container.querySelectorAll('button'))

    expect(buttons[0]?.getAttribute('disabled')).toBe('')
    expect(buttons[1]?.getAttribute('disabled')).toBe('')

    click(buttons[0] as HTMLButtonElement)
    await flushEffects()

    expect(buttons[0]?.getAttribute('data-state')).toBe('off')
  })
})
