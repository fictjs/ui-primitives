/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Button, Link, Root, Separator, ToggleGroup, ToggleItem } from '../src/index.js'

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

describe('@fictjs/toolbar', () => {
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

  it('renders toolbar semantics and orients separators opposite to the toolbar', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root orientation="horizontal">
          <Button>One</Button>
          <Separator data-testid="separator" />
          <Button>Two</Button>
        </Root>
      ),
      container,
    )

    await flushEffects()

    const toolbar = container.querySelector('[role="toolbar"]')
    const separator = container.querySelector('[data-testid="separator"]')

    expect(toolbar?.getAttribute('aria-orientation')).toBe('horizontal')
    expect(separator?.getAttribute('data-orientation')).toBe('vertical')
  })

  it('exposes disabled buttons and toolbar item markers', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root orientation="horizontal">
          <Button>One</Button>
          <Button disabled>Two</Button>
          <Button>Three</Button>
        </Root>
      ),
      container,
    )

    await waitForDeferredFocus()

    const buttons = Array.from(container.querySelectorAll('button')) as HTMLButtonElement[]
    expect(buttons[1]?.getAttribute('disabled')).toBe('')
    expect(buttons[0]?.hasAttribute('data-toolbar-item')).toBe(true)
    expect(buttons[2]?.hasAttribute('data-toolbar-item')).toBe(true)
  })

  it('activates links with Space and keeps toggle items inside the toolbar roving order', async () => {
    const onLinkClick = vi.fn((event: MouseEvent) => event.preventDefault())
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root orientation="horizontal">
          <Button>One</Button>
          <Link href="#target" onClick={onLinkClick}>
            Docs
          </Link>
          <ToggleGroup type="single" defaultValue="bold">
            <ToggleItem value="bold">Bold</ToggleItem>
            <ToggleItem value="italic">Italic</ToggleItem>
          </ToggleGroup>
        </Root>
      ),
      container,
    )

    await waitForDeferredFocus()

    const link = container.querySelector('a') as HTMLAnchorElement
    const toggleItems = Array.from(
      container.querySelectorAll('[data-toggle-group-item]'),
    ) as HTMLButtonElement[]

    link.focus()
    keyDown(link, ' ')
    await flushEffects()

    expect(onLinkClick).toHaveBeenCalledTimes(1)

    click(toggleItems[1] as HTMLButtonElement)
    await waitForDeferredFocus()

    const updatedToggleItems = Array.from(
      container.querySelectorAll('[data-toggle-group-item]'),
    ) as HTMLButtonElement[]

    expect(updatedToggleItems[1]?.getAttribute('data-state')).toBe('on')
  })

  it('preserves roving focus when links and buttons provide key handlers', async () => {
    const onLinkKeyDown = vi.fn()
    const onButtonKeyDown = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root orientation="horizontal">
          <Link href="#docs" onKeyDown={onLinkKeyDown}>
            Docs
          </Link>
          <Button onKeyDown={onButtonKeyDown}>Action</Button>
          <Button>Last</Button>
        </Root>
      ),
      container,
    )

    await waitForDeferredFocus()

    const link = container.querySelector('a') as HTMLAnchorElement
    const buttons = Array.from(container.querySelectorAll('button')) as HTMLButtonElement[]

    link.focus()
    keyDown(link, 'ArrowRight')
    expect(onLinkKeyDown).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(buttons[0])

    keyDown(buttons[0] as HTMLButtonElement, 'ArrowRight')
    expect(onButtonKeyDown).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(buttons[1])
  })

  it('scans toolbar items once when synchronizing tab stops', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Button data-testid="one">One</Button>
          <Button>Two</Button>
        </Root>
      ),
      container,
    )

    await waitForDeferredFocus()
    const toolbar = container.querySelector('[role="toolbar"]') as HTMLDivElement
    const querySelectorAll = vi.spyOn(toolbar, 'querySelectorAll')

    ;(container.querySelector('[data-testid="one"]') as HTMLButtonElement).focus()
    await waitForDeferredFocus()

    expect(querySelectorAll).toHaveBeenCalledTimes(1)
  })

  it('keeps the root direction attribute and navigation context in sync', async () => {
    const direction = createSignal<'ltr' | 'rtl'>('ltr')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root data-testid="root" dir={prop(() => direction())} orientation="horizontal">
          <Button data-testid="one">One</Button>
          <Button data-testid="two">Two</Button>
          <Button data-testid="three">Three</Button>
        </Root>
      ),
      container,
    )

    await waitForDeferredFocus()
    const root = container.querySelector('[data-testid="root"]') as HTMLDivElement
    const one = container.querySelector('[data-testid="one"]') as HTMLButtonElement
    const two = container.querySelector('[data-testid="two"]') as HTMLButtonElement
    const three = container.querySelector('[data-testid="three"]') as HTMLButtonElement

    expect(root.getAttribute('dir')).toBe('ltr')
    two.focus()
    keyDown(two, 'ArrowRight')
    expect(document.activeElement).toBe(three)

    direction('rtl')
    await flushEffects()
    expect(root.getAttribute('dir')).toBe('rtl')
    two.focus()
    keyDown(two, 'ArrowRight')
    expect(document.activeElement).toBe(one)
  })
})
