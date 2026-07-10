/** @jsxImportSource fict */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from 'fict'
import { createSignal } from 'fict/advanced'

import {
  Avatar,
  Button,
  Card,
  CheckboxGroup,
  ContextMenu,
  DropdownMenu,
  IconButton,
  Kbd,
  Link,
  Popover,
  ScrollArea,
  Select,
  Skeleton,
  TabNav,
  Text,
  Theme,
  ThemePanel,
} from '../src/index.js'

const OriginalImage = window.Image

class MockImage extends EventTarget {
  protected currentSrc = ''

  get src(): string {
    return this.currentSrc
  }

  set src(src: string) {
    this.currentSrc = src
    window.setTimeout(() => {
      this.dispatchEvent(new Event('load'))
    }, 0)
  }
}

class MockErrorImage extends MockImage {
  override get src(): string {
    return this.currentSrc
  }

  override set src(src: string) {
    this.currentSrc = src
    window.setTimeout(() => {
      this.dispatchEvent(new Event('error'))
    }, 0)
  }
}

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

function rightClick(target: Element): void {
  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 2,
      pointerType: 'mouse',
    }),
  )
  target.dispatchEvent(
    new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      button: 2,
    }),
  )
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
    window.Image = OriginalImage
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

  it('updates theme data attributes from getter-backed props', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const accentColor = createSignal<'ruby' | 'blue'>('ruby')

    mount(
      () => (
        <Theme accentColor={prop(() => accentColor()) as unknown as 'ruby'}>
          <Button>Action</Button>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const theme = container.querySelector('.radix-themes')
    expect(theme?.getAttribute('data-accent-color')).toBe('ruby')

    accentColor('blue')
    await flushEffects()
    expect(theme?.getAttribute('data-accent-color')).toBe('blue')
  })

  it('preserves getter-backed DOM props through extractProps wrappers', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const label = createSignal('first')

    mount(
      () => (
        <Theme>
          <Text
            as="span"
            data-testid="reactive-text"
            aria-label={prop(() => label()) as unknown as string}
          >
            Label
          </Text>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const text = container.querySelector('[data-testid="reactive-text"]')
    expect(text?.getAttribute('aria-label')).toBe('first')

    label('second')
    await flushEffects()
    expect(text?.getAttribute('aria-label')).toBe('second')
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
    expect(container.querySelector('.rt-AvatarImage')).toBeNull()
  })

  it('renders avatar image only after the source loads', async () => {
    window.Image = MockImage as unknown as typeof window.Image
    const onLoadingStatusChange = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Avatar
            alt="User avatar"
            fallback="AB"
            onLoadingStatusChange={onLoadingStatusChange}
            src="/api/avatar"
          />
        </Theme>
      ),
      container,
    )

    await flushEffects()
    await flushEffects()

    const image = container.querySelector('.rt-AvatarImage')
    expect(image?.getAttribute('src')).toBe('/api/avatar')
    expect(image?.getAttribute('alt')).toBe('User avatar')
    expect(container.textContent).not.toContain('AB')
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith('loaded')
  })

  it('forwards avatar image load errors from the preload image', async () => {
    window.Image = MockErrorImage as unknown as typeof window.Image
    const onError = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Avatar alt="User avatar" fallback="AB" onError={onError} src="/api/missing-avatar" />
        </Theme>
      ),
      container,
    )

    await flushEffects()
    await flushEffects()

    expect(container.querySelector('.rt-AvatarImage')).toBeNull()
    expect(container.querySelector('.rt-AvatarFallback')?.textContent).toBe('AB')
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('applies skeleton props to element children without adding a wrapper', async () => {
    const ref = { current: null as Element | null }
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Skeleton ref={ref}>
          <div data-testid="skeleton-child">
            <span>Submit</span>
          </div>
        </Skeleton>
      ),
      container,
    )

    await flushEffects()

    const child = container.querySelector('[data-testid="skeleton-child"]')
    expect(container.firstElementChild).toBe(child)
    expect(child?.classList.contains('rt-Skeleton')).toBe(true)
    expect(child?.getAttribute('aria-hidden')).not.toBeNull()
    expect(ref.current).toBe(child)
  })

  it('wraps painted form controls so the real control can be hidden', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Skeleton>
          <Button data-testid="skeleton-button">Submit</Button>
        </Skeleton>
      ),
      container,
    )

    await flushEffects()

    const wrapper = container.firstElementChild
    const button = container.querySelector('[data-testid="skeleton-button"]')
    expect(wrapper?.tagName).toBe('SPAN')
    expect(wrapper).not.toBe(button)
    expect(wrapper?.classList.contains('rt-Skeleton')).toBe(true)
    expect(button?.closest('.rt-Skeleton')).toBe(wrapper)
  })

  it('wraps replaced skeleton children so the painted element can be hidden', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Skeleton>
          <img alt="" data-testid="skeleton-image" src="/avatar.png" />
        </Skeleton>
      ),
      container,
    )

    await flushEffects()

    const wrapper = container.firstElementChild
    const image = container.querySelector('[data-testid="skeleton-image"]')
    expect(wrapper?.tagName).toBe('SPAN')
    expect(wrapper).not.toBe(image)
    expect(wrapper?.classList.contains('rt-Skeleton')).toBe(true)
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

  it('updates themed checkbox items from a controlled getter-backed value', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const value = createSignal<string[]>(['alpha'])

    mount(
      () => (
        <Theme>
          <CheckboxGroup.Root value={prop(() => value())}>
            <CheckboxGroup.Item value="alpha">Alpha</CheckboxGroup.Item>
            <CheckboxGroup.Item value="beta">Beta</CheckboxGroup.Item>
          </CheckboxGroup.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const checkboxes = Array.from(container.querySelectorAll('button[role="checkbox"]'))
    expect(checkboxes.map((checkbox) => checkbox.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
    ])

    value(['beta'])
    await flushEffects()
    expect(checkboxes.map((checkbox) => checkbox.getAttribute('aria-checked'))).toEqual([
      'false',
      'true',
    ])
  })

  it('renders select content with themed scroll viewport classes', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Select.Root defaultValue="apple" defaultOpen>
            <Select.Trigger />
            <Select.Content position="popper">
              <Select.Item value="apple">Apple</Select.Item>
              <Select.Item value="orange">Orange</Select.Item>
            </Select.Content>
          </Select.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const content = document.body.querySelector('.rt-SelectContent')
    expect(content).not.toBeNull()
    expect(content?.querySelector('.rt-ScrollAreaRoot')).not.toBeNull()
    expect(content?.querySelector('.rt-SelectViewport')).not.toBeNull()
    expect(content?.querySelector('.rt-ScrollAreaViewport')).not.toBeNull()
    expect(content?.querySelector('.rt-ScrollAreaScrollbar.rt-r-size-1')).not.toBeNull()
    expect(content?.querySelector('.rt-ScrollAreaThumb')).not.toBeNull()
  })

  it('forwards direction to the themed scroll area root', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <ScrollArea dir="rtl">Scrollable content</ScrollArea>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    expect(container.querySelector('.rt-ScrollAreaRoot')?.getAttribute('dir')).toBe('rtl')
  })

  it('renders themed select default value while content is closed', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    function FruitItemsDemo() {
      return (
        <>
          <Select.Group>
            <Select.Label>Fruits</Select.Label>
            <Select.Item value="orange">Orange</Select.Item>
            <Select.Item value="apple">Apple</Select.Item>
          </Select.Group>
        </>
      )
    }

    mount(
      () => (
        <Theme>
          <Select.Root defaultValue="apple">
            <Select.Trigger />
            <Select.Content>
              <FruitItemsDemo />
            </Select.Content>
          </Select.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    expect(document.body.querySelector('.rt-SelectContent')).toBeNull()
    expect(container.querySelector('.rt-SelectTrigger')?.textContent).toContain('Apple')
  })

  it('updates a themed select from a controlled getter-backed value', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const value = createSignal('apple')

    mount(
      () => (
        <Theme>
          <Select.Root value={prop(() => value())}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="apple">Apple</Select.Item>
              <Select.Item value="orange">Orange</Select.Item>
            </Select.Content>
          </Select.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const trigger = container.querySelector('.rt-SelectTrigger')
    expect(trigger?.textContent).toContain('Apple')

    value('orange')
    await flushEffects()
    expect(trigger?.textContent).toContain('Orange')
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

  it('updates the root theme from the theme panel controls', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme accentColor="teal">
          <ThemePanel defaultOpen />
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const rootTheme = container.querySelector('.radix-themes[data-is-root-theme="true"]')
    const blueInput = Array.from(
      container.querySelectorAll<HTMLInputElement>('.rt-ThemePanelSwatchInput'),
    ).find((input) => input.value === 'blue')

    expect(rootTheme?.getAttribute('data-accent-color')).toBe('teal')
    expect(blueInput).not.toBeUndefined()

    blueInput?.click()
    await flushEffects()
    expect(rootTheme?.getAttribute('data-accent-color')).toBe('blue')
  })

  it('renders only the active tab nav link with the active attribute', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const current = createSignal('account')

    mount(
      () => (
        <Theme>
          <TabNav.Root size="1">
            <TabNav.Link href="/account" active={() => current() === 'account'}>
              Account
            </TabNav.Link>
            <TabNav.Link asChild active={() => current() === 'documents'}>
              <a href="/documents">Documents</a>
            </TabNav.Link>
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
    expect(root?.querySelectorAll('.rt-TabNavLink[data-active]')).toHaveLength(1)
    expect(links[0]?.getAttribute('data-active')).toBe('')
    expect(links[1]?.hasAttribute('data-active')).toBe(false)

    current('documents')
    await flushEffects()

    expect(root?.querySelectorAll('.rt-TabNavLink[data-active]')).toHaveLength(1)
    expect(links[0]?.hasAttribute('data-active')).toBe(false)
    expect(links[1]?.getAttribute('data-active')).toBe('')
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

  it('preserves themed menu radio group classes', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <DropdownMenu.Root defaultOpen>
            <DropdownMenu.Trigger>
              <Button data-testid="dropdown-radio-trigger">Open</Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.RadioGroup className="custom-radio-group" value="one">
                <DropdownMenu.RadioItem value="one">One</DropdownMenu.RadioItem>
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <ContextMenu.Root>
            <ContextMenu.Trigger>
              <div data-testid="context-radio-trigger">Area</div>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
              <ContextMenu.RadioGroup className="custom-radio-group" value="one">
                <ContextMenu.RadioItem value="one">One</ContextMenu.RadioItem>
              </ContextMenu.RadioGroup>
            </ContextMenu.Content>
          </ContextMenu.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const dropdownGroup = document.body.querySelector('.rt-DropdownMenuRadioGroup')
    expect(dropdownGroup).not.toBeNull()
    expect(dropdownGroup?.className).toContain('rt-BaseMenuRadioGroup')
    expect(dropdownGroup?.className).toContain('custom-radio-group')

    const contextTrigger = container.querySelector('[data-testid="context-radio-trigger"]')
    expect(contextTrigger).not.toBeNull()

    rightClick(contextTrigger as Element)
    await flushEffects()

    const contextGroup = document.body.querySelector('.rt-ContextMenuRadioGroup')
    expect(contextGroup).not.toBeNull()
    expect(contextGroup?.className).toContain('rt-BaseMenuRadioGroup')
    expect(contextGroup?.className).toContain('custom-radio-group')
  })
})
