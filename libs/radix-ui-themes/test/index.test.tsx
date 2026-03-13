/** @jsxImportSource fict */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from 'fict'
import { createSignal } from 'fict/advanced'

import { Avatar, Button, CheckboxGroup, Popover, TabNav, Theme, ThemePanel } from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

async function flushEffects(cycles = 6): Promise<void> {
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

describe('@fictjs/radix-ui-themes', () => {
  const cleanups: Array<() => void> = []

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  it('applies root and nested theme data attributes', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme accentColor="ruby" radius="large">
          <Button>Outer</Button>
          <Theme accentColor="blue" scaling="110%">
            <Button>Inner</Button>
          </Theme>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const themes = Array.from(container.querySelectorAll('.radix-themes'))
    expect(themes).toHaveLength(2)
    expect(themes[0]?.getAttribute('data-accent-color')).toBe('ruby')
    expect(themes[0]?.getAttribute('data-radius')).toBe('large')
    expect(themes[1]?.getAttribute('data-accent-color')).toBe('blue')
    expect(themes[1]?.getAttribute('data-scaling')).toBe('110%')
    expect(container.textContent).toContain('Outer')
    expect(container.textContent).toContain('Inner')
  })

  it('renders avatar fallback content without an image source', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Avatar fallback="AB" />
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const fallback = container.querySelector('.rt-AvatarFallback')
    expect(fallback?.textContent).toBe('AB')
    expect(container.querySelector('.rt-AvatarImage')).not.toBeNull()
  })

  it('updates checkbox group values through themed items', async () => {
    const onValueChange = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <CheckboxGroup.Root defaultValue={['alpha']} onValueChange={onValueChange}>
            <CheckboxGroup.Item value="alpha">Alpha</CheckboxGroup.Item>
            <CheckboxGroup.Item value="beta">Beta</CheckboxGroup.Item>
          </CheckboxGroup.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const checkboxes = Array.from(container.querySelectorAll('button[role="checkbox"]'))
    expect(checkboxes).toHaveLength(2)

    click(checkboxes[1] as HTMLButtonElement)
    await flushEffects()
    expect(onValueChange).toHaveBeenLastCalledWith(['alpha', 'beta'])

    expect((checkboxes[0] as HTMLButtonElement).getAttribute('aria-checked')).toBe('true')
  })

  it('copies a theme snippet from the theme panel', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme accentColor="teal" radius="large">
          <ThemePanel defaultOpen />
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const buttons = Array.from(container.querySelectorAll('button'))
    const copyButton = buttons.find((button) => button.textContent === 'Copy Theme')
    expect(copyButton).not.toBeUndefined()

    click(copyButton as HTMLButtonElement)
    await flushEffects()
    await flushEffects()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      '<Theme accentColor="teal" radius="large">',
    )
  })

  it('renders tab nav links without crashing when props are getter-backed', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <TabNav.Root size="1">
            <TabNav.Link href="/account" active>
              Account
            </TabNav.Link>
            <TabNav.Link href="/documents">Documents</TabNav.Link>
          </TabNav.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const root = container.querySelector('.rt-TabNavRoot')
    const links = Array.from(container.querySelectorAll('.rt-TabNavLink'))

    expect(root).not.toBeNull()
    expect(links).toHaveLength(2)
    expect(links[0]?.getAttribute('data-active')).toBe('true')
  })

  it('updates getter-backed DOM props through themed buttons', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const expanded = createSignal(false)

    mount(
      () => (
        <Theme>
          <Button data-testid="getter-button" aria-expanded={prop(() => String(expanded()))}>
            Toggle
          </Button>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const button = container.querySelector('[data-testid="getter-button"]') as HTMLButtonElement
    expect(button.getAttribute('aria-expanded')).toBe('false')

    expanded(true)
    await flushEffects()
    expect(button.getAttribute('aria-expanded')).toBe('true')

    expanded(false)
    await flushEffects()
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes themed popover content when the trigger is pressed again', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Popover.Root>
            <Popover.Trigger>
              <Button data-testid="popover-trigger">Toggle</Button>
            </Popover.Trigger>
            <Popover.Content data-testid="popover-content">
              <Button>Inside</Button>
            </Popover.Content>
          </Popover.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const trigger = container.querySelector('[data-testid="popover-trigger"]') as HTMLButtonElement
    expect(trigger).not.toBeNull()

    click(trigger)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="popover-content"]')).not.toBeNull()

    const nextTrigger = container.querySelector(
      '[data-testid="popover-trigger"]',
    ) as HTMLButtonElement
    click(nextTrigger)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="popover-content"]')).toBeNull()
  })

  it('closes themed popover content with a plain trigger child', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Popover.Root>
            <Popover.Trigger>
              <button data-testid="plain-popover-trigger" type="button">
                Toggle
              </button>
            </Popover.Trigger>
            <Popover.Content data-testid="plain-popover-content">Content</Popover.Content>
          </Popover.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const trigger = container.querySelector(
      '[data-testid="plain-popover-trigger"]',
    ) as HTMLButtonElement

    click(trigger)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="plain-popover-content"]')).not.toBeNull()

    click(trigger)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="plain-popover-content"]')).toBeNull()
  })

  it('invokes themed popover trigger state changes once per click', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(false)
    const changes: boolean[] = []

    mount(
      () => (
        <Theme>
          <Popover.Root
            open={open}
            onOpenChange={(nextOpen) => {
              changes.push(nextOpen)
              open(nextOpen)
            }}
          >
            <Popover.Trigger>
              <Button data-testid="controlled-popover-trigger">Toggle</Button>
            </Popover.Trigger>
            <Popover.Content data-testid="controlled-popover-content">Content</Popover.Content>
          </Popover.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const trigger = container.querySelector(
      '[data-testid="controlled-popover-trigger"]',
    ) as HTMLButtonElement

    click(trigger)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="controlled-popover-content"]')).not.toBeNull()
    const nextTrigger = container.querySelector(
      '[data-testid="controlled-popover-trigger"]',
    ) as HTMLButtonElement
    click(nextTrigger)
    await flushEffects()

    expect(changes).toEqual([true, false])
    expect(container.querySelectorAll('[data-testid="controlled-popover-trigger"]')).toHaveLength(1)
    const finalTrigger = container.querySelector(
      '[data-testid="controlled-popover-trigger"]',
    ) as HTMLButtonElement
    expect(finalTrigger.getAttribute('aria-expanded')).toBe('false')
  })
})
