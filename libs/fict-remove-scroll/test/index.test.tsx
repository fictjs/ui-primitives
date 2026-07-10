/** @jsxImportSource fict */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createRef, prop, render } from 'fict'
import { createSignal } from 'fict/advanced'
import { sidecar } from '@fictjs/use-sidecar'

import { RemoveScroll } from '../src/index.js'
import { RemoveScroll as RemoveScrollUI } from '../src/UI.js'

function tick(count = 4): Promise<void> {
  return new Promise((resolve) => {
    const run = (remaining: number) => {
      if (remaining <= 0) {
        resolve()
        return
      }

      if (typeof queueMicrotask === 'function') {
        queueMicrotask(() => run(remaining - 1))
        return
      }

      Promise.resolve().then(() => run(remaining - 1))
    }

    run(count)
  })
}

function getStyleTags(): HTMLStyleElement[] {
  return Array.from(document.head.querySelectorAll('style'))
}

function setScrollableMetrics(
  node: HTMLElement,
  options: {
    clientHeight?: number
    clientWidth?: number
    scrollHeight?: number
    scrollLeft?: number
    scrollTop?: number
    scrollWidth?: number
  },
): void {
  for (const [key, value] of Object.entries(options)) {
    Object.defineProperty(node, key, {
      configurable: true,
      value,
    })
  }
}

function dispatchCancelableWheel(target: EventTarget, deltaY: number): WheelEvent {
  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    deltaY,
  })

  target.dispatchEvent(event)
  return event
}

describe('@fictjs/fict-remove-scroll', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    document.body.className = ''
    document.body.removeAttribute('data-scroll-locked')
  })

  afterEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    document.body.className = ''
    document.body.removeAttribute('data-scroll-locked')
  })

  it('renders children and exposes the helper class names', async () => {
    const container = document.createElement('div')
    const dispose = render(() => <RemoveScroll>content</RemoveScroll>, container)

    await tick()

    expect(container.textContent).toBe('content')
    expect(RemoveScroll.classNames.fullWidth).toBe('width-before-scroll-bar')
    expect(RemoveScroll.classNames.zeroRight).toBe('right-scroll-bar-position')

    dispose()
  })

  it('forwards props into a single child when forwardProps is enabled', async () => {
    const container = document.createElement('div')
    const ref = createRef<HTMLSpanElement>()

    const dispose = render(
      () => (
        <RemoveScrollUI
          forwardProps
          ref={ref}
          sideCar={sidecar(() => import('../src/sidecar.js')) as any}
        >
          <span data-testid="child">content</span>
        </RemoveScrollUI>
      ),
      container,
    )

    await tick()

    const child = container.querySelector('[data-testid="child"]')

    expect(child?.tagName).toBe('SPAN')
    expect(child?.textContent).toBe('content')
    expect(ref.current).toBe(child)

    dispose()
  })

  it('keeps wrapper DOM props reactive', async () => {
    const container = document.createElement('div')
    const title = createSignal('first title')
    const className = createSignal('first-class')

    const dispose = render(
      () => (
        <RemoveScrollUI
          enabled={false}
          title={prop(() => title())}
          className={prop(() => className()) as unknown as string}
          sideCar={sidecar(() => import('../src/sidecar.js')) as any}
        >
          content
        </RemoveScrollUI>
      ),
      container,
    )

    await tick()

    const wrapper = container.querySelector('[title]')
    expect(wrapper?.getAttribute('title')).toBe('first title')
    expect(wrapper?.className).toBe('first-class')

    title('second title')
    className('second-class')
    await tick()

    expect(wrapper?.getAttribute('title')).toBe('second title')
    expect(wrapper?.className).toBe('second-class')

    dispose()
  })

  it('keeps child DOM props reactive when forwardProps is enabled', async () => {
    const container = document.createElement('div')
    const title = createSignal('first title')

    const dispose = render(
      () => (
        <RemoveScrollUI
          enabled={false}
          forwardProps
          title={prop(() => title())}
          sideCar={sidecar(() => import('../src/sidecar.js')) as any}
        >
          <span data-testid="reactive-child">content</span>
        </RemoveScrollUI>
      ),
      container,
    )

    await tick()

    const child = container.querySelector('[data-testid="reactive-child"]')
    expect(child?.getAttribute('title')).toBe('first title')

    title('second title')
    await tick()
    expect(child?.getAttribute('title')).toBe('second title')

    dispose()
  })

  it('throws when forwardProps does not receive a single element child', () => {
    const container = document.createElement('div')

    expect(() =>
      render(
        () => (
          <RemoveScrollUI forwardProps sideCar={sidecar(() => import('../src/sidecar.js')) as any}>
            plain text
          </RemoveScrollUI>
        ),
        container,
      ),
    ).toThrow('RemoveScroll with `forwardProps` expects a single Fict element child.')
  })

  it('locks body scroll on mount and restores it on unmount', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(() => <RemoveScroll>content</RemoveScroll>, container)
    await tick()

    expect(document.body.getAttribute('data-scroll-locked')).toBe('1')
    expect(getStyleTags()).toHaveLength(1)

    dispose()
    await tick()

    expect(document.body.getAttribute('data-scroll-locked')).toBeNull()
    expect(getStyleTags()).toHaveLength(0)

    container.remove()
  })

  it('supports reactive enabled toggling', async () => {
    const enabled = createSignal(false)
    const container = document.createElement('div')

    const dispose = render(
      () => (
        <RemoveScroll enabled={prop(() => enabled())}>
          <div>content</div>
        </RemoveScroll>
      ),
      container,
    )

    await tick()
    expect(document.body.getAttribute('data-scroll-locked')).toBeNull()

    enabled(true)
    await tick()
    expect(document.body.getAttribute('data-scroll-locked')).toBe('1')

    enabled(false)
    await tick()
    expect(document.body.getAttribute('data-scroll-locked')).toBeNull()

    dispose()
  })

  it('resolves reactive options before forwarding them to the sidecar', async () => {
    const inert = createSignal(false)
    const removeScrollBar = createSignal(false)
    const container = document.createElement('div')

    const dispose = render(
      () => (
        <RemoveScroll inert={prop(() => inert())} removeScrollBar={prop(() => removeScrollBar())}>
          <div data-testid="lock">content</div>
        </RemoveScroll>
      ),
      container,
    )

    await tick()
    expect(document.body.className).toBe('')
    expect(document.body.getAttribute('data-scroll-locked')).toBeNull()

    inert(true)
    removeScrollBar(true)
    await tick()

    expect(document.body.className).toMatch(/block-interactivity-\d+/)
    expect(document.body.getAttribute('data-scroll-locked')).toBe('1')

    dispose()
  })

  it('adds and removes inert mode interactivity classes', async () => {
    const container = document.createElement('div')

    const dispose = render(
      () => (
        <RemoveScroll forwardProps inert>
          <div data-testid="lock">content</div>
        </RemoveScroll>
      ),
      container,
    )

    await tick()

    expect(document.body.className).toMatch(/block-interactivity-\d+/)
    expect(container.querySelector('[class*="allow-interactivity-"]')).not.toBeNull()

    dispose()
    await tick()

    expect(document.body.className).toBe('')
  })

  it('reference-counts nested locks', async () => {
    const first = document.createElement('div')
    const second = document.createElement('div')
    document.body.append(first, second)

    const disposeFirst = render(() => <RemoveScroll>first</RemoveScroll>, first)
    const disposeSecond = render(() => <RemoveScroll>second</RemoveScroll>, second)

    await tick()

    expect(document.body.getAttribute('data-scroll-locked')).toBe('2')
    expect(getStyleTags()).toHaveLength(1)

    disposeSecond()
    await tick()
    expect(document.body.getAttribute('data-scroll-locked')).toBe('1')

    disposeFirst()
    await tick()
    expect(document.body.getAttribute('data-scroll-locked')).toBeNull()

    first.remove()
    second.remove()
  })

  it('prevents outer wheel scrolling but allows scrolling inside the lock', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => (
        <RemoveScroll>
          <div data-testid="lock" style={{ height: '80px', overflow: 'auto' }}>
            <div data-testid="inner">content</div>
          </div>
        </RemoveScroll>
      ),
      container,
    )

    await tick()

    const lock = container.querySelector('[data-testid="lock"]') as HTMLDivElement
    const inner = container.querySelector('[data-testid="inner"]') as HTMLDivElement

    setScrollableMetrics(lock, {
      clientHeight: 80,
      scrollHeight: 240,
      scrollTop: 0,
    })

    const outsideEvent = dispatchCancelableWheel(document.body, 40)
    const insideEvent = dispatchCancelableWheel(inner, 40)

    expect(outsideEvent.defaultPrevented).toBe(true)
    expect(insideEvent.defaultPrevented).toBe(false)

    dispose()
    container.remove()
  })

  it('allows wheel scrolling inside shard nodes', async () => {
    const shard = document.createElement('div')
    shard.setAttribute('data-testid', 'shard')
    const shardInner = document.createElement('div')
    shardInner.textContent = 'shard content'
    shard.appendChild(shardInner)
    document.body.appendChild(shard)

    setScrollableMetrics(shard, {
      clientHeight: 80,
      scrollHeight: 240,
      scrollTop: 0,
    })

    const shardRef = createRef<HTMLDivElement>()
    shardRef.current = shard
    const container = document.createElement('div')

    const dispose = render(
      () => (
        <RemoveScroll shards={[shardRef]}>
          <div>content</div>
        </RemoveScroll>
      ),
      container,
    )

    await tick()

    const shardEvent = dispatchCancelableWheel(shardInner, 32)

    expect(shardEvent.defaultPrevented).toBe(false)

    dispose()
    shard.remove()
  })

  it('loads the UI entry with an async sidecar', async () => {
    const AsyncSidecar = sidecar(() => import('../src/sidecar.js')) as any
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => (
        <RemoveScrollUI sideCar={AsyncSidecar}>
          <div>content</div>
        </RemoveScrollUI>
      ),
      container,
    )

    expect(document.body.getAttribute('data-scroll-locked')).toBeNull()

    await tick(64)

    expect(document.body.getAttribute('data-scroll-locked')).toBe('1')

    dispose()
    container.remove()
  })
})
