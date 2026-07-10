/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Item, Root } from '../src/index.js'

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

function getByTestId<T extends Element>(container: ParentNode, testId: string): T {
  return container.querySelector(`[data-testid="${testId}"]`) as T
}

async function waitForDeferredFocus(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await flushEffects()
}

describe('@fictjs/roving-focus', () => {
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

  it('focuses the current tab stop on group entry and moves with arrow keys', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root data-testid="group" defaultCurrentTabStopId="one">
          <Item data-testid="one" tabStopId="one">
            One
          </Item>
          <Item data-testid="two" tabStopId="two">
            Two
          </Item>
          <Item data-testid="three" tabStopId="three">
            Three
          </Item>
        </Root>
      ),
      container,
    )

    await flushEffects()

    const group = getByTestId<HTMLDivElement>(container, 'group')
    let one = getByTestId<HTMLSpanElement>(container, 'one')

    group.focus()
    await flushEffects()

    expect(document.activeElement).toBe(one)
    expect(one.tabIndex).toBe(0)

    keyDown(one, 'ArrowRight')
    await waitForDeferredFocus()
    one = getByTestId<HTMLSpanElement>(container, 'one')
    const two = getByTestId<HTMLSpanElement>(container, 'two')

    expect(document.activeElement).toBe(two)
    expect(two.tabIndex).toBe(0)
    expect(one.tabIndex).toBe(-1)
  })

  it('generates unique tab stop ids when tabStopId is omitted', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root data-testid="group">
          <Item data-testid="one">One</Item>
          <Item data-testid="two">Two</Item>
        </Root>
      ),
      container,
    )

    await flushEffects()

    const group = getByTestId<HTMLDivElement>(container, 'group')
    const one = getByTestId<HTMLSpanElement>(container, 'one')
    const two = getByTestId<HTMLSpanElement>(container, 'two')

    group.focus()
    await flushEffects()

    expect(document.activeElement).toBe(one)
    expect(one.tabIndex).toBe(0)
    expect(two.tabIndex).toBe(-1)

    keyDown(one, 'ArrowRight')
    await waitForDeferredFocus()

    expect(document.activeElement).toBe(two)
    expect(one.tabIndex).toBe(-1)
    expect(two.tabIndex).toBe(0)
  })

  it('loops focus when loop is enabled', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root data-testid="group" defaultCurrentTabStopId="three" loop>
          <Item data-testid="one" tabStopId="one">
            One
          </Item>
          <Item data-testid="two" tabStopId="two">
            Two
          </Item>
          <Item data-testid="three" tabStopId="three">
            Three
          </Item>
        </Root>
      ),
      container,
    )

    await flushEffects()

    const group = getByTestId<HTMLDivElement>(container, 'group')
    const three = getByTestId<HTMLSpanElement>(container, 'three')

    group.focus()
    await flushEffects()
    expect(document.activeElement).toBe(three)

    keyDown(three, 'ArrowRight')
    await waitForDeferredFocus()
    const one = getByTestId<HTMLSpanElement>(container, 'one')

    expect(document.activeElement).toBe(one)
  })

  it('respects rtl direction for horizontal navigation', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root data-testid="group" defaultCurrentTabStopId="two" dir="rtl" orientation="horizontal">
          <Item data-testid="one" tabStopId="one">
            One
          </Item>
          <Item data-testid="two" tabStopId="two">
            Two
          </Item>
          <Item data-testid="three" tabStopId="three">
            Three
          </Item>
        </Root>
      ),
      container,
    )

    await flushEffects()

    const group = getByTestId<HTMLDivElement>(container, 'group')
    const two = getByTestId<HTMLSpanElement>(container, 'two')

    group.focus()
    await flushEffects()
    expect(document.activeElement).toBe(two)

    keyDown(two, 'ArrowLeft')
    await waitForDeferredFocus()
    const three = getByTestId<HTMLSpanElement>(container, 'three')

    expect(document.activeElement).toBe(three)
  })

  it('ignores horizontal arrows in a vertical group', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root data-testid="group" defaultCurrentTabStopId="one" orientation="vertical">
          <Item data-testid="one" tabStopId="one">
            One
          </Item>
          <Item data-testid="two" tabStopId="two">
            Two
          </Item>
        </Root>
      ),
      container,
    )

    await flushEffects()

    const group = container.querySelector('[data-testid="group"]') as HTMLDivElement
    const one = container.querySelector('[data-testid="one"]') as HTMLSpanElement

    group.focus()
    await flushEffects()
    expect(document.activeElement).toBe(one)

    keyDown(one, 'ArrowRight')
    await waitForDeferredFocus()

    expect(document.activeElement).toBe(one)
  })

  it('allows entry focus to be prevented', async () => {
    const onEntryFocus = vi.fn((event: Event) => {
      event.preventDefault()
    })
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root data-testid="group" defaultCurrentTabStopId="one" onEntryFocus={onEntryFocus}>
          <Item data-testid="one" tabStopId="one">
            One
          </Item>
          <Item data-testid="two" tabStopId="two">
            Two
          </Item>
        </Root>
      ),
      container,
    )

    await flushEffects()

    const group = container.querySelector('[data-testid="group"]') as HTMLDivElement

    group.focus()
    await flushEffects()

    expect(onEntryFocus).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(group)
  })

  it('uses the latest entry-focus handler from component props', async () => {
    const calls: string[] = []
    const onEntryFocus = createSignal<(event: Event) => void>(() => calls.push('first'))
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root
          data-testid="group"
          defaultCurrentTabStopId="one"
          onEntryFocus={prop(() => onEntryFocus())}
        >
          <Item data-testid="one" tabStopId="one">
            One
          </Item>
        </Root>
      ),
      container,
    )

    await flushEffects()
    onEntryFocus((event) => {
      calls.push('second')
      event.preventDefault()
    })

    const group = getByTestId<HTMLDivElement>(container, 'group')
    group.focus()
    await flushEffects()

    expect(calls).toEqual(['second'])
    expect(document.activeElement).toBe(group)
  })

  it('supports render-prop children state', async () => {
    const currentTabStopId = createSignal<string | null>('alpha')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root currentTabStopId={currentTabStopId}>
          <Item tabStopId="alpha">
            {({ hasTabStop, isCurrentTabStop }) => (
              <span data-testid="state">{String(hasTabStop) + ':' + String(isCurrentTabStop)}</span>
            )}
          </Item>
        </Root>
      ),
      container,
    )

    await flushEffects()

    expect(container.querySelector('[data-testid="state"]')?.textContent).toBe('true:true')

    currentTabStopId(null)
    await flushEffects()

    expect(container.querySelector('[data-testid="state"]')?.textContent).toBe('false:false')
  })

  it('updates focusable item counts and collection metadata reactively', async () => {
    const firstFocusable = createSignal(true)
    const secondFocusable = createSignal(false)
    const secondActive = createSignal(false)
    const secondId = createSignal('two')
    const currentTabStopId = createSignal<string | null>(null)
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root
          data-testid="group"
          currentTabStopId={currentTabStopId}
          onCurrentTabStopIdChange={currentTabStopId}
        >
          <Item data-testid="one" tabStopId="one" focusable={firstFocusable}>
            One
          </Item>
          <Item
            data-testid="two"
            tabStopId={secondId}
            focusable={secondFocusable}
            active={secondActive}
          >
            Two
          </Item>
        </Root>
      ),
      container,
    )

    await flushEffects()

    const group = getByTestId<HTMLDivElement>(container, 'group')
    expect(group.tabIndex).toBe(0)

    firstFocusable(false)
    await flushEffects()
    expect(group.tabIndex).toBe(-1)

    secondId('second')
    secondFocusable(true)
    secondActive(true)
    await flushEffects()
    expect(group.tabIndex).toBe(0)

    group.focus()
    await flushEffects()
    expect(document.activeElement).toBe(getByTestId(container, 'two'))

    keyDown(getByTestId(container, 'two'), 'Home')
    await waitForDeferredFocus()
    expect(currentTabStopId()).toBe('second')
  })
})
