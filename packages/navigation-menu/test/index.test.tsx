/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Content, Indicator, Item, Link, List, Root, Sub, Trigger, Viewport } from '../src/index.js'

const resizeObservers: MockResizeObserver[] = []

class MockResizeObserver {
  readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    resizeObservers.push(this)
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}

  trigger(): void {
    this.callback([], this as unknown as ResizeObserver)
  }
}

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    }),
  )
}

function pointer(
  target: Element,
  type: 'pointerdown' | 'pointerenter' | 'pointerleave' | 'pointermove',
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
    }),
  )
}

function keydown(
  target: EventTarget,
  key: string,
  init: Omit<KeyboardEventInit, 'bubbles' | 'cancelable' | 'key'> = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
    ...init,
  })
  target.dispatchEvent(event)
  return event
}

async function waitForEffects(cycles = 6): Promise<void> {
  if (!vi.isFakeTimers()) await new Promise<void>((resolve) => setTimeout(resolve, 0))
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

describe('@fictjs/navigation-menu', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    document.body.innerHTML = ''
    resizeObservers.length = 0
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders root semantics and keeps configuration props off the DOM', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root
          data-testid="root"
          defaultValue="docs"
          delayDuration={40}
          skipDelayDuration={80}
          orientation="vertical"
          dir="rtl"
        >
          <List>
            <Item value="docs">
              <Trigger>Docs</Trigger>
              <Content>Panel</Content>
            </Item>
          </List>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const root = container.querySelector('[data-testid="root"]') as HTMLElement
    expect(root.tagName).toBe('NAV')
    expect(root.getAttribute('aria-label')).toBe('Main')
    expect(root.getAttribute('dir')).toBe('rtl')
    expect(root.getAttribute('data-orientation')).toBe('vertical')
    expect(root.hasAttribute('defaultvalue')).toBe(false)
    expect(root.hasAttribute('delayduration')).toBe(false)
    expect(root.hasAttribute('skipdelayduration')).toBe(false)
    expect(root.hasAttribute('orientation')).toBe(false)
  })

  it('opens matching content from a trigger and shows the indicator', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <List>
            <Item value="docs">
              <Trigger data-testid="trigger">Docs</Trigger>
              <Content
                data-testid="content"
                onEscapeKeyDown={() => {}}
                onFocusOutside={() => {}}
                onInteractOutside={() => {}}
                onPointerDownOutside={() => {}}
              >
                Panel
              </Content>
            </Item>
          </List>
          <Indicator data-testid="indicator">i</Indicator>
        </Root>
      ),
      container,
    )

    click(container.querySelector('[data-testid="trigger"]') as HTMLButtonElement)
    await waitForEffects()

    expect(container.querySelector('[data-testid="content"]')?.textContent).toBe('Panel')
    expect(container.querySelector('[data-testid="indicator"]')?.textContent).toBe('i')
  })

  it('ports active content into the viewport when one is present', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue="docs">
          <List>
            <Item value="docs">
              <Trigger>Docs</Trigger>
              <Content data-testid="content">Panel</Content>
            </Item>
          </List>
          <Viewport data-testid="viewport" />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    const content = viewport.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(content.textContent).toBe('Panel')
    expect(container.querySelector('[aria-owns]')?.getAttribute('aria-owns')).toBe(content.id)
  })

  it('honors prevented trigger events and wires stable trigger/content aria ids', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const shouldPrevent = createSignal(true)

    mount(
      () => (
        <Root>
          <List>
            <Item value="docs">
              <Trigger
                data-testid="trigger"
                onClick={(event) => {
                  if (shouldPrevent()) event.preventDefault()
                }}
              >
                Docs
              </Trigger>
              <Content data-testid="content">Panel</Content>
            </Item>
          </List>
        </Root>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    expect(trigger.getAttribute('aria-controls')).toBeNull()

    click(trigger)
    await waitForEffects()
    expect(container.querySelector('[data-testid="content"]')).toBeNull()

    shouldPrevent(false)
    click(trigger)
    await waitForEffects()

    const content = container.querySelector('[data-testid="content"]') as HTMLDivElement
    const contentId = trigger.getAttribute('aria-controls')
    expect(contentId).toBeTruthy()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(content.id).toBe(contentId)
    expect(content.getAttribute('aria-labelledby')).toBe(trigger.id)
    expect(content.hasAttribute('onescapekeydown')).toBe(false)
    expect(content.hasAttribute('onfocusoutside')).toBe(false)
    expect(content.hasAttribute('oninteractoutside')).toBe(false)
    expect(content.hasAttribute('onpointerdownoutside')).toBe(false)
  })

  it('opens after the hover delay and skips the delay while moving between items', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root delayDuration={50} skipDelayDuration={100}>
          <List>
            <Item value="docs">
              <Trigger data-testid="docs-trigger">Docs</Trigger>
              <Content data-testid="docs-content">Docs panel</Content>
            </Item>
            <Item value="blog">
              <Trigger data-testid="blog-trigger">Blog</Trigger>
              <Content data-testid="blog-content">Blog panel</Content>
            </Item>
          </List>
        </Root>
      ),
      container,
    )

    const docsTrigger = container.querySelector('[data-testid="docs-trigger"]') as HTMLElement
    const blogTrigger = container.querySelector('[data-testid="blog-trigger"]') as HTMLElement
    pointer(docsTrigger, 'pointerenter')
    pointer(docsTrigger, 'pointermove')
    await vi.advanceTimersByTimeAsync(49)
    expect(container.querySelector('[data-testid="docs-content"]')).toBeNull()

    await vi.advanceTimersByTimeAsync(1)
    await waitForEffects()
    expect(container.querySelector('[data-testid="docs-content"]')?.textContent).toBe('Docs panel')

    click(docsTrigger)
    await waitForEffects()
    expect(container.querySelector('[data-testid="docs-content"]')).toBeNull()

    pointer(blogTrigger, 'pointerenter')
    pointer(blogTrigger, 'pointermove')
    await waitForEffects()
    expect(container.querySelector('[data-testid="blog-content"]')?.textContent).toBe('Blog panel')
  })

  it('uses direction-aware roving focus and restores trigger focus after Escape', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue="docs" dir="rtl">
          <List>
            <Item value="docs">
              <Trigger data-testid="docs-trigger">Docs</Trigger>
              <Content data-testid="docs-content">
                <a href="/docs" data-testid="docs-link">
                  Guide
                </a>
              </Content>
            </Item>
            <Item value="blog">
              <Trigger data-testid="blog-trigger">Blog</Trigger>
              <Content>Blog panel</Content>
            </Item>
          </List>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const docsTrigger = container.querySelector('[data-testid="docs-trigger"]') as HTMLButtonElement
    const blogTrigger = container.querySelector('[data-testid="blog-trigger"]') as HTMLButtonElement
    docsTrigger.focus()
    keydown(docsTrigger, 'ArrowLeft')
    await waitForEffects()
    expect(document.activeElement).toBe(blogTrigger)

    keydown(blogTrigger, 'Home')
    await waitForEffects()
    expect(document.activeElement).toBe(docsTrigger)

    keydown(docsTrigger, 'ArrowDown')
    const docsLink = container.querySelector('[data-testid="docs-link"]') as HTMLAnchorElement
    expect(document.activeElement).toBe(docsLink)

    keydown(document, 'Escape')
    await waitForEffects()
    expect(container.querySelector('[data-testid="docs-content"]')).toBeNull()
    expect(document.activeElement).toBe(docsTrigger)
  })

  it('bridges trigger and content tab order through a hidden focus proxy', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue="docs">
          <List>
            <Item value="docs">
              <Trigger data-testid="trigger">Docs</Trigger>
              <Content forceMount data-testid="content">
                <a href="/first" data-testid="first-link">
                  First
                </a>
                <button data-testid="last-button">Last</button>
              </Content>
            </Item>
          </List>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    const firstLink = container.querySelector('[data-testid="first-link"]') as HTMLAnchorElement
    const lastButton = container.querySelector('[data-testid="last-button"]') as HTMLButtonElement
    const proxy = container.querySelector('[data-navigation-menu-focus-proxy]') as HTMLSpanElement
    const content = container.querySelector('[data-testid="content"]') as HTMLDivElement

    expect(trigger.nextElementSibling?.contains(proxy)).toBe(true)
    expect(trigger.compareDocumentPosition(proxy) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(proxy.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(proxy.tabIndex).toBe(0)
    expect(proxy.getAttribute('aria-hidden')).toBe('true')

    trigger.focus()
    proxy.focus()
    expect(document.activeElement).toBe(firstLink)

    const forwardTab = keydown(firstLink, 'Tab')
    expect(forwardTab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(lastButton)

    const exitTab = keydown(lastButton, 'Tab')
    expect(exitTab.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(proxy)

    firstLink.focus()
    keydown(firstLink, 'Tab', { shiftKey: true })
    expect(document.activeElement).toBe(proxy)

    click(trigger)
    await waitForEffects()
    const closedFirstLink = container.querySelector(
      '[data-testid="first-link"]',
    ) as HTMLAnchorElement
    const closedLastButton = container.querySelector(
      '[data-testid="last-button"]',
    ) as HTMLButtonElement
    expect(closedFirstLink.tabIndex).toBe(-1)
    expect(closedLastButton.tabIndex).toBe(-1)
    expect(container.querySelector('[data-navigation-menu-focus-proxy]')).toBeNull()

    click(trigger)
    await waitForEffects()
    expect(
      container.querySelector('[data-testid="first-link"]')?.getAttribute('tabindex'),
    ).toBeNull()
    expect(
      container.querySelector('[data-testid="last-button"]')?.getAttribute('tabindex'),
    ).toBeNull()
  })

  it('moves through trigger and link focus items in DOM order and skips disabled triggers', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root dir="rtl">
          <List>
            <Item value="docs">
              <Trigger data-testid="docs-trigger">Docs</Trigger>
            </Item>
            <Item value="pricing">
              <Link href="/pricing" data-testid="pricing-link">
                Pricing
              </Link>
            </Item>
            <Item value="disabled">
              <Trigger disabled data-testid="disabled-trigger">
                Disabled
              </Trigger>
              <Content forceMount data-testid="disabled-content">
                Disabled panel
              </Content>
            </Item>
            <Item value="blog">
              <Trigger data-testid="blog-trigger">Blog</Trigger>
            </Item>
          </List>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const docsTrigger = container.querySelector('[data-testid="docs-trigger"]') as HTMLButtonElement
    const pricingLink = container.querySelector('[data-testid="pricing-link"]') as HTMLAnchorElement
    const disabledTrigger = container.querySelector(
      '[data-testid="disabled-trigger"]',
    ) as HTMLButtonElement
    const blogTrigger = container.querySelector('[data-testid="blog-trigger"]') as HTMLButtonElement

    expect(disabledTrigger.disabled).toBe(true)
    expect(disabledTrigger.getAttribute('data-disabled')).toBe('')
    expect(disabledTrigger.getAttribute('aria-controls')).toBeNull()
    click(disabledTrigger)
    await waitForEffects()
    expect(disabledTrigger.getAttribute('aria-expanded')).toBe('false')

    docsTrigger.focus()
    keydown(docsTrigger, 'ArrowLeft')
    await waitForEffects()
    expect(document.activeElement).toBe(pricingLink)

    keydown(pricingLink, 'End')
    await waitForEffects()
    expect(document.activeElement).toBe(blogTrigger)

    keydown(blogTrigger, 'Home')
    await waitForEffects()
    expect(document.activeElement).toBe(docsTrigger)

    blogTrigger.focus()
    keydown(blogTrigger, 'ArrowRight')
    await waitForEffects()
    expect(document.activeElement).toBe(pricingLink)
  })

  it('does not reopen from incidental pointer moves after Escape or click-close', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root delayDuration={0} skipDelayDuration={1000}>
          <List>
            <Item value="docs">
              <Trigger data-testid="trigger">Docs</Trigger>
              <Content data-testid="content">Panel</Content>
            </Item>
          </List>
        </Root>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    pointer(trigger, 'pointerenter')
    pointer(trigger, 'pointermove')
    await waitForEffects()
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()

    keydown(document, 'Escape')
    await waitForEffects()
    expect(container.querySelector('[data-testid="content"]')).toBeNull()

    pointer(trigger, 'pointerleave')
    pointer(trigger, 'pointermove')
    await waitForEffects()
    expect(container.querySelector('[data-testid="content"]')).toBeNull()

    pointer(trigger, 'pointerenter')
    pointer(trigger, 'pointermove')
    await waitForEffects()
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()

    click(trigger)
    await waitForEffects()
    expect(container.querySelector('[data-testid="content"]')).toBeNull()

    pointer(trigger, 'pointerleave')
    pointer(trigger, 'pointermove')
    await waitForEffects()
    expect(container.querySelector('[data-testid="content"]')).toBeNull()

    pointer(trigger, 'pointerenter')
    pointer(trigger, 'pointermove')
    await waitForEffects()
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()
  })

  it('runs Link onSelect during cancelable dispatch and dismisses despite click prevention', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const preventSelection = createSignal(true)
    let selectEventPhase: number = Event.NONE

    mount(
      () => (
        <Root defaultValue="docs">
          <List>
            <Item value="docs">
              <Trigger>Docs</Trigger>
              <Content data-testid="content">
                <Link
                  href="/guide"
                  data-testid="link"
                  onClick={(event) => event.preventDefault()}
                  onSelect={(event) => {
                    selectEventPhase = event.eventPhase
                    if (preventSelection()) event.preventDefault()
                  }}
                >
                  Guide
                </Link>
              </Content>
            </Item>
          </List>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const link = container.querySelector('[data-testid="link"]') as HTMLAnchorElement
    expect(link.hasAttribute('onselect')).toBe(false)

    click(link)
    await waitForEffects()
    expect(selectEventPhase).toBe(Event.AT_TARGET)
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()

    preventSelection(false)
    click(link)
    await waitForEffects()
    expect(container.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('keeps root trigger, viewport, and submenu interactions inside the dismiss boundary', async () => {
    const container = document.createElement('div')
    const outside = document.createElement('button')
    outside.textContent = 'Outside'
    document.body.append(container, outside)

    mount(
      () => (
        <Root defaultValue="docs">
          <List>
            <Item value="docs">
              <Trigger data-testid="docs-trigger">Docs</Trigger>
              <Content data-testid="root-content">
                <span data-testid="parent-surface">Parent surface</span>
                <Sub defaultValue="child">
                  <List>
                    <Item value="child">
                      <Trigger data-testid="child-trigger">Child</Trigger>
                      <Content data-testid="child-content">Child panel</Content>
                    </Item>
                  </List>
                </Sub>
              </Content>
            </Item>
            <Item value="blog">
              <Trigger data-testid="blog-trigger">Blog</Trigger>
              <Content>Blog panel</Content>
            </Item>
          </List>
          <Viewport data-testid="viewport" />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const blogTrigger = container.querySelector('[data-testid="blog-trigger"]') as HTMLElement
    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLElement
    const parentSurface = container.querySelector('[data-testid="parent-surface"]') as HTMLElement

    pointer(blogTrigger, 'pointerdown')
    await waitForEffects()
    expect(container.querySelector('[data-testid="root-content"]')).not.toBeNull()

    pointer(viewport, 'pointerdown')
    await waitForEffects()
    expect(container.querySelector('[data-testid="root-content"]')).not.toBeNull()

    pointer(parentSurface, 'pointerdown')
    await waitForEffects()
    expect(container.querySelector('[data-testid="child-content"]')).not.toBeNull()

    pointer(outside, 'pointerdown')
    await waitForEffects()
    expect(container.querySelector('[data-testid="root-content"]')).toBeNull()
  })

  it('tracks indicator geometry, viewport size, and directional content motion', async () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue="docs">
          <List>
            <Item value="docs">
              <Trigger data-testid="docs-trigger">Docs</Trigger>
              <Content data-testid="docs-content">Docs panel</Content>
            </Item>
            <Item value="blog">
              <Trigger data-testid="blog-trigger">Blog</Trigger>
              <Content data-testid="blog-content">Blog panel</Content>
            </Item>
          </List>
          <Indicator data-testid="indicator" />
          <Viewport data-testid="viewport" />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const docsTrigger = container.querySelector('[data-testid="docs-trigger"]') as HTMLButtonElement
    const docsContent = container.querySelector('[data-testid="docs-content"]') as HTMLDivElement
    Object.defineProperties(docsTrigger, {
      offsetLeft: { configurable: true, value: 24 },
      offsetWidth: { configurable: true, value: 88 },
    })
    Object.defineProperties(docsContent, {
      offsetWidth: { configurable: true, value: 320 },
      offsetHeight: { configurable: true, value: 180 },
    })
    ;[...resizeObservers].forEach((observer) => observer.trigger())
    await waitForEffects()

    const indicator = container.querySelector('[data-testid="indicator"]') as HTMLDivElement
    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    expect(indicator.style.width).toBe('88px')
    expect(indicator.style.transform).toBe('translateX(24px)')
    expect(viewport.style.getPropertyValue('--radix-navigation-menu-viewport-width')).toBe('320px')
    expect(viewport.style.getPropertyValue('--radix-navigation-menu-viewport-height')).toBe('180px')

    click(container.querySelector('[data-testid="blog-trigger"]') as HTMLButtonElement)
    await waitForEffects()
    expect(
      container.querySelector('[data-testid="blog-content"]')?.getAttribute('data-motion'),
    ).toBe('from-end')
  })

  it('reactively switches active viewport content that was already force-mounted', async () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    const container = document.createElement('div')
    document.body.append(container)
    const value = createSignal('')

    mount(
      () => (
        <Root value={value}>
          <List>
            <Item value="docs">
              <Trigger>Docs</Trigger>
              <Content forceMount data-testid="docs-content">
                Docs panel
              </Content>
            </Item>
            <Item value="blog">
              <Trigger>Blog</Trigger>
              <Content forceMount data-testid="blog-content">
                Blog panel
              </Content>
            </Item>
          </List>
          <Viewport forceMount data-testid="viewport" />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement

    value('docs')
    await waitForEffects()
    const docsContent = container.querySelector('[data-testid="docs-content"]') as HTMLDivElement
    expect(viewport.contains(docsContent)).toBe(true)

    value('blog')
    await waitForEffects()
    const blogContent = container.querySelector('[data-testid="blog-content"]') as HTMLDivElement
    Object.defineProperties(blogContent, {
      offsetWidth: { configurable: true, value: 360 },
      offsetHeight: { configurable: true, value: 180 },
    })
    ;[...resizeObservers].forEach((observer) => observer.trigger())
    await waitForEffects()
    expect(viewport.style.getPropertyValue('--radix-navigation-menu-viewport-width')).toBe('360px')
    expect(blogContent.getAttribute('data-state')).toBe('open')
    const docsContents = container.querySelectorAll('[data-testid="docs-content"]')
    expect(docsContents).toHaveLength(1)
    expect(docsContents[0]?.getAttribute('data-state')).toBe('closed')
    expect(viewport.contains(docsContents[0] ?? null)).toBe(true)
  })

  it('preserves the previous content while a force-mounted viewport exits', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue="docs">
          <List>
            <Item value="docs">
              <Trigger data-testid="trigger">Docs</Trigger>
              <Content
                data-testid="content"
                ref={(node) => {
                  if (!node) return
                  Object.defineProperties(node, {
                    offsetWidth: { configurable: true, value: 280 },
                    offsetHeight: { configurable: true, value: 140 },
                  })
                }}
              >
                <a href="/guide" data-testid="content-link">
                  Guide
                </a>
              </Content>
            </Item>
          </List>
          <Viewport forceMount data-testid="viewport" />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    click(container.querySelector('[data-testid="trigger"]') as HTMLButtonElement)
    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    const content = viewport.querySelector('[data-testid="content"]') as HTMLDivElement
    const contentLink = content.querySelector('[data-testid="content-link"]') as HTMLAnchorElement
    expect(viewport.getAttribute('data-state')).toBe('closed')
    expect(viewport.style.getPropertyValue('--radix-navigation-menu-viewport-width')).toBe('280px')
    expect(content.getAttribute('data-state')).toBe('closed')
    expect(contentLink.tabIndex).toBe(-1)
  })

  it('uses the content owner document for focus traversal and timer cleanup', async () => {
    const frame = document.createElement('iframe')
    document.body.append(frame)
    const frameWindow = frame.contentWindow as Window
    const frameDocument = frame.contentDocument as Document
    const container = frameDocument.createElement('div')
    frameDocument.body.append(container)
    const clearTimeoutSpy = vi.spyOn(frameWindow, 'clearTimeout')
    vi.stubGlobal('NodeFilter', undefined)

    const cleanup = render(
      () => (
        <Root defaultValue="docs">
          <List>
            <Item value="docs">
              <Trigger data-testid="trigger">Docs</Trigger>
              <Content>
                <a href="/guide" data-testid="link">
                  Guide
                </a>
              </Content>
            </Item>
          </List>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    const link = container.querySelector('[data-testid="link"]') as HTMLAnchorElement
    trigger.focus()
    keydown(trigger, 'ArrowDown')
    expect(frameDocument.activeElement).toBe(link)

    clearTimeoutSpy.mockClear()
    cleanup()
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThanOrEqual(3)
  })

  it('updates link active state reactively', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const current = createSignal('docs')

    mount(
      () => (
        <Root>
          <List>
            <Item>
              <Link href="/docs" data-testid="docs-link" active={() => current() === 'docs'}>
                Docs
              </Link>
            </Item>
            <Item>
              <Link href="/blog" data-testid="blog-link" active={() => current() === 'blog'}>
                Blog
              </Link>
            </Item>
          </List>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const docsLink = container.querySelector('[data-testid="docs-link"]') as HTMLAnchorElement
    const blogLink = container.querySelector('[data-testid="blog-link"]') as HTMLAnchorElement

    expect(docsLink.getAttribute('data-active')).toBe('')
    expect(docsLink.hasAttribute('active')).toBe(false)
    expect(blogLink.hasAttribute('data-active')).toBe(false)
    expect(blogLink.hasAttribute('active')).toBe(false)

    current('blog')
    await waitForEffects()

    expect(docsLink.hasAttribute('data-active')).toBe(false)
    expect(blogLink.getAttribute('data-active')).toBe('')
  })

  it('invokes the latest replaced Link onSelect handler', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const first = vi.fn((event: Event) => event.preventDefault())
    const second = vi.fn((event: Event) => event.preventDefault())
    const handler = createSignal<(event: Event) => void>(first)

    function DynamicLink() {
      const callbackProps = {
        href: '/guide',
        'data-testid': 'link',
        children: 'Guide',
        get onSelect() {
          return handler()
        },
      } as Parameters<typeof Link>[0]

      return Link(callbackProps)
    }

    mount(
      () => (
        <Root>
          <List>
            <Item>
              <DynamicLink />
            </Item>
          </List>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const link = container.querySelector('[data-testid="link"]') as HTMLAnchorElement
    click(link)
    expect(first).toHaveBeenCalledOnce()

    handler(second)
    await waitForEffects()
    click(link)
    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
  })
})
