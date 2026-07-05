/** @jsxImportSource fict */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from 'fict'
import { createSignal } from 'fict/advanced'

import {
  Avatar,
  Button,
  Card,
  CheckboxGroup,
  DropdownMenu,
  IconButton,
  Kbd,
  Link,
  Popover,
  TabNav,
  Theme,
  ThemePanel,
} from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerType: 'mouse',
    }),
  )
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

function keydown(target: EventTarget, key: string): void {
  const eventTarget =
    target instanceof Document ? (target.body ?? target.documentElement ?? target) : target

  eventTarget.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
    }),
  )
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

    expect(container.querySelector('.rt-ThemePanelShortcut')).not.toBeNull()
    expect(container.querySelectorAll('.rt-ThemePanelSwatch').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.rt-ThemePanelSwatchInput').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.rt-ThemePanelRadioCard').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.rt-ThemePanelRadioCardInput').length).toBeGreaterThan(0)

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
          <Button
            data-testid="getter-button"
            aria-expanded={prop(() => (expanded() ? 'true' : 'false'))}
          >
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

  it('renders slotted themed children through asChild wrappers', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Card asChild>
            <a data-testid="card-child" href="#card">
              Card
            </a>
          </Card>
          <Button asChild>
            <a data-testid="button-child" href="#button">
              Action
            </a>
          </Button>
          <IconButton asChild>
            <button data-testid="icon-button-child" type="button" aria-label="Open">
              +
            </button>
          </IconButton>
          <Link asChild>
            <button data-testid="link-child" type="button">
              Link
            </button>
          </Link>
          <Kbd asChild>
            <button data-testid="kbd-child" type="button">
              Enter
            </button>
          </Kbd>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const card = container.querySelector('[data-testid="card-child"]')
    const button = container.querySelector('[data-testid="button-child"]')
    const iconButton = container.querySelector('[data-testid="icon-button-child"]')
    const link = container.querySelector('[data-testid="link-child"]')
    const kbd = container.querySelector('[data-testid="kbd-child"]')

    expect(card?.textContent).toBe('Card')
    expect(card?.className).toContain('rt-Card')
    expect(button?.textContent).toBe('Action')
    expect(button?.className).toContain('rt-BaseButton')
    expect(iconButton?.getAttribute('aria-label')).toBe('Open')
    expect(iconButton?.className).toContain('rt-IconButton')
    expect(link?.textContent).toBe('Link')
    expect(link?.className).toContain('rt-Text')
    expect(kbd?.textContent).toBe('Enter')
    expect(kbd?.className).toContain('rt-Kbd')
  })

  it.skip('closes themed popover content when the trigger is pressed again', async () => {
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

  it.skip('closes themed popover content with a plain trigger child', async () => {
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

  it.skip('invokes themed popover trigger state changes once per click', async () => {
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

  it('reopens themed dropdown menu content from the same trigger after closing with escape', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button data-testid="dropdown-trigger">Open</Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content data-testid="dropdown-content">
              <DropdownMenu.Item data-testid="dropdown-item">Item</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    let trigger = container.querySelector('[data-testid="dropdown-trigger"]') as HTMLButtonElement
    expect(trigger).not.toBeNull()

    click(trigger)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="dropdown-content"]')).not.toBeNull()

    keydown(document, 'Escape')
    await flushEffects()
    expect(document.body.querySelector('[data-testid="dropdown-content"]')).toBeNull()

    trigger = container.querySelector('[data-testid="dropdown-trigger"]') as HTMLButtonElement
    click(trigger)
    await flushEffects()

    expect(document.body.querySelector('[data-testid="dropdown-content"]')).not.toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })
})
