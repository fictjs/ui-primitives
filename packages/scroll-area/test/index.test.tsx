/** @jsxImportSource @fictjs/runtime */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Corner, Root, Scrollbar, Thumb, Viewport } from '../src/index.js'

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

function pointer(target: Element, type: string, init: PointerEventInit): void {
  const PointerEventCtor = globalThis.PointerEvent ?? MouseEvent
  const event = new PointerEventCtor(type, {
    bubbles: true,
    cancelable: true,
    ...init,
  }) as PointerEvent
  if (!('pointerId' in event)) {
    Object.defineProperty(event, 'pointerId', { value: init.pointerId ?? 1 })
  }
  target.dispatchEvent(event)
}

function dispatchAnimationEvent(node: HTMLElement, type: string, animationName: string): void {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, 'animationName', { configurable: true, value: animationName })
  node.dispatchEvent(event)
}

async function waitForEffects(cycles = 6): Promise<void> {
  if (vi.isFakeTimers()) {
    await vi.advanceTimersByTimeAsync(0)
  } else {
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
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

describe('@fictjs/scroll-area', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  beforeEach(() => {
    resizeObservers.length = 0
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
  })

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    document.body.innerHTML = ''
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('updates a vertical thumb size and offset from viewport scroll state', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="always">
          <Viewport data-testid="viewport">
            <div style={{ height: '400px' }}>Content</div>
          </Viewport>
          <Scrollbar data-testid="scrollbar" orientation="vertical">
            <Thumb data-testid="thumb" forceMount />
          </Scrollbar>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    const scrollbar = container.querySelector('[data-testid="scrollbar"]') as HTMLDivElement
    const thumb = container.querySelector('[data-testid="thumb"]') as HTMLDivElement

    Object.defineProperty(viewport, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(viewport, 'scrollHeight', { value: 400, configurable: true })
    Object.defineProperty(viewport, 'scrollTop', { value: 100, configurable: true, writable: true })
    Object.defineProperty(scrollbar, 'clientHeight', { value: 80, configurable: true })

    viewport.dispatchEvent(new Event('scroll'))
    await waitForEffects()

    expect(thumb.style.height).toBe('20px')
    expect(thumb.style.transform).toBe('translate3d(0, 20px, 0)')
  })

  it('reverses horizontal thumb motion and drag mapping in RTL', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="always" dir="rtl">
          <Viewport data-testid="viewport">Content</Viewport>
          <Scrollbar data-testid="scrollbar" orientation="horizontal">
            <Thumb data-testid="thumb" />
          </Scrollbar>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    const scrollbar = container.querySelector('[data-testid="scrollbar"]') as HTMLDivElement
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 400 },
      scrollLeft: { configurable: true, value: -100, writable: true },
    })
    Object.defineProperty(scrollbar, 'clientWidth', { configurable: true, value: 80 })
    vi.spyOn(scrollbar, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 80,
      height: 10,
      top: 0,
      right: 80,
      bottom: 10,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect)
    Object.assign(scrollbar, {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      hasPointerCapture: () => true,
    })
    resizeObservers.forEach((observer) => observer.trigger())
    viewport.dispatchEvent(new Event('scroll'))
    await waitForEffects()

    const thumb = container.querySelector('[data-testid="thumb"]') as HTMLDivElement
    expect(thumb.style.width).toBe('20px')
    expect(thumb.style.transform).toBe('translate3d(-20px, 0, 0)')

    vi.spyOn(thumb, 'getBoundingClientRect').mockReturnValue({
      x: 40,
      y: 0,
      width: 20,
      height: 10,
      top: 0,
      right: 60,
      bottom: 10,
      left: 40,
      toJSON: () => ({}),
    } as DOMRect)
    pointer(thumb, 'pointerdown', { button: 0, pointerId: 3, clientX: 45 })
    pointer(scrollbar, 'pointermove', { pointerId: 3, clientX: 25 })
    expect(viewport.scrollLeft).toBe(-200)
    pointer(scrollbar, 'pointerup', { pointerId: 3, clientX: 25 })
  })

  it('accounts for track padding in thumb sizing and pointer mapping', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="always">
          <Viewport data-testid="viewport">Content</Viewport>
          <Scrollbar
            data-testid="scrollbar"
            orientation="vertical"
            style={{ paddingTop: '10px', paddingBottom: '10px' }}
          >
            <Thumb data-testid="thumb" />
          </Scrollbar>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    const scrollbar = container.querySelector('[data-testid="scrollbar"]') as HTMLDivElement
    Object.defineProperties(viewport, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, value: 100, writable: true },
    })
    Object.defineProperty(scrollbar, 'clientHeight', { configurable: true, value: 80 })
    vi.spyOn(scrollbar, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 10,
      height: 80,
      top: 0,
      right: 10,
      bottom: 80,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect)
    Object.assign(scrollbar, {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      hasPointerCapture: () => true,
    })
    resizeObservers.forEach((observer) => observer.trigger())
    viewport.dispatchEvent(new Event('scroll'))
    await waitForEffects()

    const thumb = container.querySelector('[data-testid="thumb"]') as HTMLDivElement
    expect(thumb.style.height).toBe('18px')
    expect(thumb.style.transform).toBe('translate3d(0, 14px, 0)')

    pointer(scrollbar, 'pointerdown', { button: 0, pointerId: 4, clientY: 19 })
    expect(viewport.scrollTop).toBe(0)
    pointer(scrollbar, 'pointerup', { pointerId: 4, clientY: 19 })
  })

  it('handles wheel input on a sibling scrollbar without trapping boundary scrolling', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="always">
          <Viewport data-testid="viewport">Content</Viewport>
          <Scrollbar data-testid="scrollbar" orientation="vertical">
            <Thumb />
          </Scrollbar>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    const scrollbar = container.querySelector('[data-testid="scrollbar"]') as HTMLDivElement
    Object.defineProperties(viewport, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, value: 0, writable: true },
    })

    const middleWheel = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 50,
    })
    scrollbar.dispatchEvent(middleWheel)
    expect(viewport.scrollTop).toBe(50)
    expect(middleWheel.defaultPrevented).toBe(true)

    viewport.scrollTop = 280
    const boundaryWheel = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 50,
    })
    scrollbar.dispatchEvent(boundaryWheel)
    expect(viewport.scrollTop).toBe(300)
    expect(boundaryWheel.defaultPrevented).toBe(false)
  })

  it('keeps configuration off the DOM and hides native scrollbars', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="hover" scrollHideDelay={25} dir="rtl" data-testid="root">
          <Viewport data-testid="viewport" nonce="test-nonce">
            Content
          </Viewport>
          <Scrollbar data-testid="scrollbar" orientation="vertical" forceMount>
            <Thumb forceMount />
          </Scrollbar>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const root = container.querySelector('[data-testid="root"]') as HTMLDivElement
    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    const scrollbar = container.querySelector('[data-testid="scrollbar"]') as HTMLDivElement
    const style = container.querySelector('style') as HTMLStyleElement

    expect(root.getAttribute('dir')).toBe('rtl')
    expect(root.hasAttribute('type')).toBe(false)
    expect(root.hasAttribute('scrollhidedelay')).toBe(false)
    expect(viewport.hasAttribute('data-radix-scroll-area-viewport')).toBe(true)
    expect(viewport.style.overflowY).toBe('scroll')
    expect(viewport.style.scrollbarWidth).toBe('none')
    expect(style.nonce).toBe('test-nonce')
    expect(style.textContent).toContain('::-webkit-scrollbar{display:none}')
    expect(scrollbar.getAttribute('data-state')).toBe('hidden')
    expect(scrollbar.style.left).toBe('0px')
    expect(scrollbar.style.right).toBe('')
  })

  it('updates getter-backed scrollbar and style metadata', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const orientation = createSignal<'horizontal' | 'vertical'>('vertical')
    const nonce = createSignal('first-nonce')

    mount(
      () => (
        <Root type="always">
          <Viewport nonce={prop(() => nonce()) as unknown as string}>Content</Viewport>
          <Scrollbar
            data-testid="scrollbar"
            orientation={prop(() => orientation()) as unknown as 'vertical'}
            forceMount
          >
            <Thumb data-testid="thumb" forceMount />
          </Scrollbar>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const style = container.querySelector('style') as HTMLStyleElement
    const scrollbar = container.querySelector('[data-testid="scrollbar"]') as HTMLDivElement
    const thumb = container.querySelector('[data-testid="thumb"]') as HTMLDivElement
    expect(style.nonce).toBe('first-nonce')
    expect(scrollbar.getAttribute('data-orientation')).toBe('vertical')
    expect(thumb.getAttribute('data-orientation')).toBe('vertical')

    orientation('horizontal')
    nonce('second-nonce')
    await waitForEffects()

    expect(container.querySelector('style')).toBe(style)
    expect(container.querySelector('[data-testid="scrollbar"]')).toBe(scrollbar)
    expect(style.nonce).toBe('second-nonce')
    expect(scrollbar.getAttribute('data-orientation')).toBe('horizontal')
    expect(thumb.getAttribute('data-orientation')).toBe('horizontal')
  })

  it('uses overflow observation and the hover hide delay to mount the scrollbar', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="hover" scrollHideDelay={40} data-testid="root">
          <Viewport data-testid="viewport">Content</Viewport>
          <Scrollbar data-testid="scrollbar" orientation="vertical">
            <Thumb />
          </Scrollbar>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const root = container.querySelector('[data-testid="root"]') as HTMLDivElement
    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    Object.defineProperty(viewport, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(viewport, 'scrollHeight', { value: 400, configurable: true })
    resizeObservers.forEach((observer) => observer.trigger())
    await waitForEffects()

    expect(container.querySelector('[data-testid="scrollbar"]')).toBeNull()

    root.dispatchEvent(new PointerEvent('pointerenter'))
    await waitForEffects()
    expect(container.querySelector('[data-testid="scrollbar"]')).not.toBeNull()

    root.dispatchEvent(new PointerEvent('pointerleave'))
    vi.advanceTimersByTime(39)
    await waitForEffects()
    expect(container.querySelector('[data-testid="scrollbar"]')).not.toBeNull()

    vi.advanceTimersByTime(1)
    await waitForEffects()
    expect(container.querySelector('[data-testid="scrollbar"]')).toBeNull()
  })

  it('tracks scroll, interaction, and idle states while preserving exit animations', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="scroll" scrollHideDelay={40}>
          <Viewport data-testid="viewport">Content</Viewport>
          <Scrollbar data-testid="horizontal" orientation="horizontal">
            <Thumb />
          </Scrollbar>
          <Scrollbar data-testid="vertical" orientation="vertical">
            <Thumb />
          </Scrollbar>
          <Corner data-testid="corner" />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    Object.defineProperties(viewport, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, value: 0, writable: true },
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 400 },
      scrollLeft: { configurable: true, value: 0, writable: true },
    })
    resizeObservers.forEach((observer) => observer.trigger())
    await waitForEffects()

    expect(container.querySelector('[data-testid="horizontal"]')).toBeNull()
    expect(container.querySelector('[data-testid="vertical"]')).toBeNull()
    expect(container.querySelector('[data-testid="corner"]')).toBeNull()

    viewport.scrollTop = 25
    viewport.dispatchEvent(new Event('scroll'))
    await waitForEffects()

    expect(container.querySelector('[data-testid="horizontal"]')).toBeNull()
    let vertical = container.querySelector('[data-testid="vertical"]') as HTMLDivElement
    expect(vertical.getAttribute('data-state')).toBe('visible')
    expect(container.querySelector('[data-testid="corner"]')).toBeNull()
    vertical.style.animationName = 'fade-in'
    dispatchAnimationEvent(vertical, 'animationstart', 'fade-in')

    await vi.advanceTimersByTimeAsync(100)
    await waitForEffects()
    vertical = container.querySelector('[data-testid="vertical"]') as HTMLDivElement
    expect(vertical.getAttribute('data-state')).toBe('visible')

    pointer(vertical, 'pointerenter', { pointerId: 5 })
    await vi.advanceTimersByTimeAsync(40)
    await waitForEffects()
    expect(container.querySelector('[data-testid="vertical"]')).not.toBeNull()

    vertical.style.animationName = 'fade-out'
    pointer(vertical, 'pointerleave', { pointerId: 5 })
    await vi.advanceTimersByTimeAsync(40)
    await waitForEffects()

    vertical = container.querySelector('[data-testid="vertical"]') as HTMLDivElement
    expect(vertical.getAttribute('data-state')).toBe('hidden')
    vertical.style.animationName = 'fade-out'
    dispatchAnimationEvent(vertical, 'animationstart', 'fade-out')
    dispatchAnimationEvent(vertical, 'animationend', 'fade-out')
    await waitForEffects()
    expect(container.querySelector('[data-testid="vertical"]')).toBeNull()
  })

  it('updates auto visibility after viewport or content resize', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="auto">
          <Viewport data-testid="viewport">Content</Viewport>
          <Scrollbar data-testid="scrollbar" orientation="vertical">
            <Thumb />
          </Scrollbar>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    Object.defineProperty(viewport, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(viewport, 'scrollHeight', { value: 400, configurable: true })
    resizeObservers.forEach((observer) => observer.trigger())
    await waitForEffects()
    expect(container.querySelector('[data-testid="scrollbar"]')).not.toBeNull()

    Object.defineProperty(viewport, 'scrollHeight', { value: 100, configurable: true })
    resizeObservers.forEach((observer) => observer.trigger())
    await waitForEffects()
    expect(container.querySelector('[data-testid="scrollbar"]')).toBeNull()
  })

  it('drags the thumb with pointer capture and supports track clicks', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="always">
          <Viewport data-testid="viewport">Content</Viewport>
          <Scrollbar data-testid="scrollbar" orientation="vertical">
            <Thumb data-testid="thumb" />
          </Scrollbar>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    const scrollbar = container.querySelector('[data-testid="scrollbar"]') as HTMLDivElement
    Object.defineProperty(viewport, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(viewport, 'scrollHeight', { value: 400, configurable: true })
    Object.defineProperty(viewport, 'scrollTop', { value: 0, configurable: true, writable: true })
    Object.defineProperty(scrollbar, 'clientHeight', { value: 80, configurable: true })
    vi.spyOn(scrollbar, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 80,
      left: 0,
      right: 10,
      width: 10,
      height: 80,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)
    resizeObservers.forEach((observer) => observer.trigger())
    window.dispatchEvent(new Event('resize'))
    await waitForEffects()

    const thumb = container.querySelector('[data-testid="thumb"]') as HTMLDivElement
    vi.spyOn(thumb, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 20,
      left: 0,
      right: 10,
      width: 10,
      height: 20,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)
    const setPointerCapture = vi.fn()
    const releasePointerCapture = vi.fn()
    Object.assign(scrollbar, {
      setPointerCapture,
      releasePointerCapture,
      hasPointerCapture: () => true,
    })

    pointer(thumb, 'pointerdown', { button: 0, pointerId: 7, clientY: 5 })
    pointer(scrollbar, 'pointermove', { pointerId: 7, clientY: 45 })
    expect(viewport.scrollTop).toBe(200)
    expect(setPointerCapture).toHaveBeenCalledWith(7)
    expect(document.body.style.userSelect).toBe('none')

    pointer(scrollbar, 'pointerup', { pointerId: 7, clientY: 45 })
    expect(releasePointerCapture).toHaveBeenCalledWith(7)
    expect(document.body.style.userSelect).toBe('')

    viewport.scrollTop = 0
    pointer(scrollbar, 'pointerdown', { button: 0, pointerId: 8, clientY: 70 })
    expect(viewport.scrollTop).toBe(300)
    pointer(scrollbar, 'pointercancel', { pointerId: 8, clientY: 70 })
    expect(document.body.style.userSelect).toBe('')
  })

  it('measures both tracks for corner sizing and scrollbar avoidance', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="always" data-testid="root">
          <Viewport />
          <Scrollbar data-testid="horizontal" orientation="horizontal">
            <Thumb />
          </Scrollbar>
          <Scrollbar data-testid="vertical" orientation="vertical">
            <Thumb />
          </Scrollbar>
          <Corner data-testid="corner" />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const root = container.querySelector('[data-testid="root"]') as HTMLDivElement
    const horizontal = container.querySelector('[data-testid="horizontal"]') as HTMLDivElement
    const vertical = container.querySelector('[data-testid="vertical"]') as HTMLDivElement
    Object.defineProperty(horizontal, 'offsetHeight', { value: 12, configurable: true })
    Object.defineProperty(vertical, 'offsetWidth', { value: 16, configurable: true })

    resizeObservers.forEach((observer) => observer.trigger())
    await waitForEffects()
    const corner = container.querySelector('[data-testid="corner"]') as HTMLDivElement

    expect(root.style.getPropertyValue('--radix-scroll-area-corner-width')).toBe('16px')
    expect(root.style.getPropertyValue('--radix-scroll-area-corner-height')).toBe('12px')
    expect(horizontal.style.right).toBe('var(--radix-scroll-area-corner-width, 0px)')
    expect(vertical.style.bottom).toBe('var(--radix-scroll-area-corner-height, 0px)')
    expect(corner.style.width).toBe('var(--radix-scroll-area-corner-width, 0px)')
    expect(corner.style.height).toBe('var(--radix-scroll-area-corner-height, 0px)')
  })

  it('restores document styles and pointer capture when unmounted during a drag', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    const cleanup = render(
      () => (
        <Root type="always">
          <Viewport data-testid="viewport">Content</Viewport>
          <Scrollbar data-testid="scrollbar" orientation="vertical">
            <Thumb />
          </Scrollbar>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    const scrollbar = container.querySelector('[data-testid="scrollbar"]') as HTMLDivElement
    const releasePointerCapture = vi.fn()
    Object.assign(scrollbar, {
      setPointerCapture: vi.fn(),
      releasePointerCapture,
      hasPointerCapture: () => true,
    })
    vi.spyOn(scrollbar, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 80,
      left: 0,
      right: 10,
      width: 10,
      height: 80,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)
    Object.defineProperty(viewport, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(viewport, 'scrollHeight', { value: 400, configurable: true })
    Object.defineProperty(scrollbar, 'clientHeight', { value: 80, configurable: true })
    document.body.style.userSelect = 'text'
    document.body.style.webkitUserSelect = 'text'
    viewport.style.scrollBehavior = 'smooth'

    pointer(scrollbar, 'pointerdown', { button: 0, pointerId: 11, clientY: 40 })
    expect(document.body.style.userSelect).toBe('none')
    expect(document.body.style.webkitUserSelect).toBe('none')
    expect(viewport.style.scrollBehavior).toBe('auto')

    cleanup()

    expect(releasePointerCapture).toHaveBeenCalledWith(11)
    expect(document.body.style.userSelect).toBe('text')
    expect(document.body.style.webkitUserSelect).toBe('text')
    expect(viewport.style.scrollBehavior).toBe('smooth')
  })

  it('invokes the latest replaced scrollbar event handler', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const first = vi.fn((event: PointerEvent) => event.preventDefault())
    const second = vi.fn((event: PointerEvent) => event.preventDefault())
    const handler = createSignal<(event: PointerEvent) => void>(first)

    function DynamicScrollbar() {
      const callbackProps = {
        orientation: 'vertical',
        forceMount: true,
        'data-testid': 'scrollbar',
        children: <Thumb forceMount />,
        get onPointerEnter() {
          return handler()
        },
      } as Parameters<typeof Scrollbar>[0]

      return Scrollbar(callbackProps)
    }

    mount(
      () => (
        <Root type="always">
          <Viewport>Content</Viewport>
          <DynamicScrollbar />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const scrollbar = container.querySelector('[data-testid="scrollbar"]') as HTMLDivElement
    pointer(scrollbar, 'pointerenter', { pointerId: 21 })
    expect(first).toHaveBeenCalledOnce()

    handler(second)
    await waitForEffects()
    pointer(scrollbar, 'pointerenter', { pointerId: 22 })
    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
  })
})
