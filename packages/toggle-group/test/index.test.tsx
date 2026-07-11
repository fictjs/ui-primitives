/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

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
    let one = getButtons()[0]
    let two: HTMLButtonElement

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
    two = getButtons()[1]

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
    let one = getButtons()[0]
    let two: HTMLButtonElement

    click(one)
    await waitForUpdates()
    two = getButtons()[1]
    click(two)
    await waitForUpdates()
    two = getButtons()[1]
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
    getGroup().focus()
    await waitForUpdates()
    const two = getButtons()[1]

    expect(document.activeElement).toBe(two)
  })

  it('preserves root focus entry while invoking the latest focus handler', async () => {
    const firstHandler = vi.fn()
    const secondHandler = vi.fn()
    const onFocus = createSignal<(event: FocusEvent) => void>(firstHandler)
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root
          type="single"
          defaultValue="two"
          onFocus={prop(() => onFocus()) as unknown as (event: FocusEvent) => void}
        >
          <Item value="one">One</Item>
          <Item value="two">Two</Item>
        </Root>
      ),
      container,
    )

    await flushEffects()
    onFocus(secondHandler)
    ;(container.querySelector('[role="group"]') as HTMLDivElement).focus()
    await waitForUpdates()

    const buttons = Array.from(container.querySelectorAll('button'))
    expect(firstHandler).not.toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalled()
    expect(document.activeElement).toBe(buttons[1])
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

  it('moves the only item tab stop when the current item becomes disabled', async () => {
    const container = document.createElement('div')
    const firstDisabled = createSignal(false)
    document.body.append(container)

    mount(
      () => (
        <Root type="single" defaultValue="one">
          <Item data-testid="one" value="one" disabled={firstDisabled}>
            One
          </Item>
          <Item data-testid="two" value="two">
            Two
          </Item>
        </Root>
      ),
      container,
    )

    await waitForUpdates()

    const one = container.querySelector('[data-testid="one"]') as HTMLButtonElement
    const two = container.querySelector('[data-testid="two"]') as HTMLButtonElement
    expect(one.tabIndex).toBe(0)
    expect(two.tabIndex).toBe(-1)

    firstDisabled(true)
    await waitForUpdates()

    expect(one.tabIndex).toBe(-1)
    expect(two.tabIndex).toBe(0)
    expect(
      Array.from(container.querySelectorAll<HTMLButtonElement>('button')).filter(
        (item) => item.tabIndex === 0,
      ),
    ).toHaveLength(1)
  })

  it('uses current DOM order for arrow navigation after items are reordered', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="single" defaultValue="one" orientation="horizontal">
          <div data-testid="one-wrapper">
            <Item data-testid="one" value="one">
              One
            </Item>
          </div>
          <div data-testid="two-wrapper">
            <Item data-testid="two" value="two">
              Two
            </Item>
          </div>
          <div data-testid="three-wrapper">
            <Item data-testid="three" value="three">
              Three
            </Item>
          </div>
        </Root>
      ),
      container,
    )

    await waitForUpdates()

    const one = container.querySelector('[data-testid="one"]') as HTMLButtonElement
    const twoWrapper = container.querySelector('[data-testid="two-wrapper"]') as HTMLDivElement
    const threeWrapper = container.querySelector('[data-testid="three-wrapper"]') as HTMLDivElement
    twoWrapper.parentElement?.insertBefore(threeWrapper, twoWrapper)

    one.focus()
    keyDown(one, 'ArrowRight')
    await waitForUpdates()

    const three = container.querySelector('[data-testid="three"]') as HTMLButtonElement
    expect(document.activeElement).toBe(three)
  })
})
