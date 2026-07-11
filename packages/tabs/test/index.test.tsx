/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      button: 0,
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

async function flushEffects(cycles = 4): Promise<void> {
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
  await flushEffects(6)
}

describe('@fictjs/tabs', () => {
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

  it('selects triggers and panels on pointer interaction', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Tabs defaultValue="account">
          <TabsList data-testid="list">
            <TabsTrigger data-testid="account-trigger" value="account">
              Account
            </TabsTrigger>
            <TabsTrigger data-testid="password-trigger" value="password">
              Password
            </TabsTrigger>
          </TabsList>
          <TabsContent data-testid="account-content" value="account">
            Account content
          </TabsContent>
          <TabsContent data-testid="password-content" value="password">
            Password content
          </TabsContent>
        </Tabs>
      ),
      container,
    )

    await waitForEffects()

    const getNodes = () => {
      const accountTrigger = container.querySelector(
        '[data-testid="account-trigger"]',
      ) as HTMLButtonElement
      const passwordTrigger = container.querySelector(
        '[data-testid="password-trigger"]',
      ) as HTMLButtonElement
      const accountContent = container.querySelector(
        '[data-testid="account-content"]',
      ) as HTMLDivElement
      const passwordContent = container.querySelector(
        '[data-testid="password-content"]',
      ) as HTMLDivElement
      return { accountTrigger, passwordTrigger, accountContent, passwordContent }
    }
    let nodes = getNodes()

    expect(nodes.accountTrigger.getAttribute('aria-selected')).toBe('true')
    expect(nodes.accountContent.hidden).toBe(false)
    expect(nodes.accountContent.textContent).toBe('Account content')

    click(nodes.passwordTrigger)
    await waitForEffects()
    nodes = getNodes()

    expect(nodes.passwordTrigger.getAttribute('aria-selected')).toBe('true')
    expect(nodes.passwordContent.hidden).toBe(false)
    expect(nodes.passwordContent.textContent).toBe('Password content')
    expect(nodes.accountContent.hidden).toBe(true)
  })

  it('activates focused tabs automatically by default', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger data-testid="one-trigger" value="one">
              One
            </TabsTrigger>
            <TabsTrigger data-testid="two-trigger" value="two">
              Two
            </TabsTrigger>
          </TabsList>
          <TabsContent data-testid="one-content" value="one">
            One content
          </TabsContent>
          <TabsContent data-testid="two-content" value="two">
            Two content
          </TabsContent>
        </Tabs>
      ),
      container,
    )

    await waitForEffects()

    let twoTrigger = container.querySelector('[data-testid="two-trigger"]') as HTMLButtonElement
    twoTrigger.focus()
    await waitForEffects()

    twoTrigger = container.querySelector('[data-testid="two-trigger"]') as HTMLButtonElement
    const twoContent = container.querySelector('[data-testid="two-content"]') as HTMLDivElement
    expect(twoTrigger.getAttribute('aria-selected')).toBe('true')
    expect(twoContent.hidden).toBe(false)
  })

  it('supports manual activation with keyboard navigation', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Tabs defaultValue="one" activationMode="manual">
          <TabsList>
            <TabsTrigger data-testid="one-trigger" value="one">
              One
            </TabsTrigger>
            <TabsTrigger data-testid="two-trigger" value="two">
              Two
            </TabsTrigger>
            <TabsTrigger data-testid="three-trigger" value="three">
              Three
            </TabsTrigger>
          </TabsList>
          <TabsContent data-testid="one-content" value="one">
            One content
          </TabsContent>
          <TabsContent data-testid="two-content" value="two">
            Two content
          </TabsContent>
          <TabsContent data-testid="three-content" value="three">
            Three content
          </TabsContent>
        </Tabs>
      ),
      container,
    )

    await waitForEffects()

    let oneTrigger = container.querySelector('[data-testid="one-trigger"]') as HTMLButtonElement
    oneTrigger.focus()
    keyDown(oneTrigger, 'ArrowRight')
    await waitForEffects()

    let twoTrigger = container.querySelector('[data-testid="two-trigger"]') as HTMLButtonElement
    oneTrigger = container.querySelector('[data-testid="one-trigger"]') as HTMLButtonElement
    expect(document.activeElement).toBe(twoTrigger)
    expect(twoTrigger.getAttribute('aria-selected')).toBe('false')
    expect(oneTrigger.tabIndex).toBe(-1)
    expect(twoTrigger.tabIndex).toBe(0)

    keyDown(twoTrigger, 'Enter')
    await waitForEffects()

    twoTrigger = container.querySelector('[data-testid="two-trigger"]') as HTMLButtonElement
    const twoContent = container.querySelector('[data-testid="two-content"]') as HTMLDivElement
    expect(twoTrigger.getAttribute('aria-selected')).toBe('true')
    expect(twoContent.hidden).toBe(false)
  })

  it('keeps the root direction attribute and navigation context in sync', async () => {
    const direction = createSignal<'ltr' | 'rtl'>('ltr')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Tabs
          data-testid="root"
          defaultValue="two"
          dir={prop(() => direction()) as unknown as 'ltr'}
          activationMode="manual"
        >
          <TabsList>
            <TabsTrigger data-testid="one" value="one">
              One
            </TabsTrigger>
            <TabsTrigger data-testid="two" value="two">
              Two
            </TabsTrigger>
            <TabsTrigger data-testid="three" value="three">
              Three
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ),
      container,
    )

    await waitForEffects()
    const root = container.querySelector('[data-testid="root"]') as HTMLDivElement
    const one = container.querySelector('[data-testid="one"]') as HTMLButtonElement
    const two = container.querySelector('[data-testid="two"]') as HTMLButtonElement
    const three = container.querySelector('[data-testid="three"]') as HTMLButtonElement

    expect(root.getAttribute('dir')).toBe('ltr')
    two.focus()
    keyDown(two, 'ArrowRight')
    await waitForEffects()
    expect(document.activeElement).toBe(three)

    direction('rtl')
    await waitForEffects()
    expect(root.getAttribute('dir')).toBe('rtl')
    two.focus()
    keyDown(two, 'ArrowRight')
    await waitForEffects()
    expect(document.activeElement).toBe(one)
  })

  it('merges reactive consumer styles with the initial content animation guard', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
    const style = createSignal({ color: 'red' })
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Tabs defaultValue="one">
          <TabsContent
            data-testid="content"
            value="one"
            style={prop(() => style()) as unknown as Record<string, string>}
          >
            Content
          </TabsContent>
        </Tabs>
      ),
      container,
    )

    await waitForEffects()
    const content = container.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(content.style.color).toBe('red')
    expect(content.style.animationDuration).toBe('0s')

    style({ color: 'blue' })
    await waitForEffects()
    expect(content.style.color).toBe('blue')
    expect(content.style.animationDuration).toBe('0s')
  })

  it('keeps exactly one enabled trigger in the tab order without a valid selected value', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <>
          <Tabs data-testid="unset-tabs">
            <TabsList>
              <TabsTrigger value="one">One</TabsTrigger>
              <TabsTrigger value="two">Two</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs data-testid="invalid-tabs" value="missing">
            <TabsList>
              <TabsTrigger value="one">One</TabsTrigger>
              <TabsTrigger value="two">Two</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs data-testid="disabled-tabs" value="one">
            <TabsList>
              <TabsTrigger value="one" disabled>
                One
              </TabsTrigger>
              <TabsTrigger value="two">Two</TabsTrigger>
              <TabsTrigger value="three">Three</TabsTrigger>
            </TabsList>
          </Tabs>
        </>
      ),
      container,
    )

    await waitForEffects()

    for (const testId of ['unset-tabs', 'invalid-tabs', 'disabled-tabs']) {
      const root = container.querySelector(`[data-testid="${testId}"]`) as HTMLDivElement
      const triggers = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      const tabStops = triggers.filter((trigger) => trigger.tabIndex === 0)

      expect(tabStops).toHaveLength(1)
      expect(tabStops[0]?.disabled).toBe(false)
    }

    const disabledRoot = container.querySelector('[data-testid="disabled-tabs"]') as HTMLDivElement
    const disabledTriggers = disabledRoot.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    expect(disabledTriggers[0]?.tabIndex).toBe(-1)
    expect(disabledTriggers[1]?.tabIndex).toBe(0)
  })
})
