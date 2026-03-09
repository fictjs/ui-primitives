/** @jsxImportSource fict */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { render } from 'fict'

import {
  RemoveScrollBar,
  fullWidthClassName,
  getGapWidth,
  lockAttribute,
  noScrollbarsClassName,
  removedBarSizeVariable,
  zeroRightClassName,
} from '../src/index.js'
import { zeroGap } from '../src/utils.js'

function tick(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(resolve)
      return
    }

    Promise.resolve().then(resolve)
  })
}

function getStyleTags(): HTMLStyleElement[] {
  return Array.from(document.head.querySelectorAll('style'))
}

function getStyleText(): string {
  return getStyleTags()[0]?.textContent ?? ''
}

function setViewport(innerWidth: number, clientWidth: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: innerWidth,
  })

  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: clientWidth,
  })
}

describe('@fictjs/fict-remove-scroll-bar', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    document.body.style.cssText = ''
    document.body.removeAttribute(lockAttribute)
    setViewport(1024, 1008)
  })

  afterEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    document.body.style.cssText = ''
    document.body.removeAttribute(lockAttribute)
  })

  it('measures the scrollbar gap using body margins by default', () => {
    document.body.style.marginLeft = '10px'
    document.body.style.marginTop = '12px'
    document.body.style.marginRight = '24px'
    setViewport(1200, 1180)

    expect(getGapWidth()).toEqual({
      left: 10,
      top: 12,
      right: 24,
      gap: 34,
    })
  })

  it('supports padding-based gap measurement', () => {
    document.body.style.paddingLeft = '6px'
    document.body.style.paddingTop = '8px'
    document.body.style.paddingRight = '18px'
    setViewport(1440, 1430)

    expect(getGapWidth('padding')).toEqual({
      left: 6,
      top: 8,
      right: 18,
      gap: 22,
    })
  })

  it('returns a zero gap when window is unavailable', () => {
    const originalWindow = globalThis.window

    try {
      vi.stubGlobal('window', undefined)
      expect(getGapWidth()).toEqual(zeroGap)
    } finally {
      vi.stubGlobal('window', originalWindow)
    }
  })

  it('locks body scroll on mount and restores it on unmount', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(() => <RemoveScrollBar />, container)

    await tick()

    expect(document.body.getAttribute(lockAttribute)).toBe('1')
    expect(getStyleTags()).toHaveLength(1)
    expect(window.getComputedStyle(document.body).overflow).toBe('hidden')

    dispose()
    await tick()

    expect(document.body.getAttribute(lockAttribute)).toBeNull()
    expect(getStyleTags()).toHaveLength(0)
    expect(window.getComputedStyle(document.body).overflow).toBe('')

    container.remove()
  })

  it('reference-counts nested locks while keeping a single style tag', async () => {
    const firstContainer = document.createElement('div')
    const secondContainer = document.createElement('div')
    document.body.append(firstContainer, secondContainer)

    const firstDispose = render(() => <RemoveScrollBar />, firstContainer)
    const secondDispose = render(() => <RemoveScrollBar />, secondContainer)

    await tick()

    expect(document.body.getAttribute(lockAttribute)).toBe('2')
    expect(getStyleTags()).toHaveLength(1)

    firstDispose()
    await tick()

    expect(document.body.getAttribute(lockAttribute)).toBe('1')
    expect(getStyleTags()).toHaveLength(1)

    secondDispose()
    await tick()

    expect(document.body.getAttribute(lockAttribute)).toBeNull()
    expect(getStyleTags()).toHaveLength(0)

    firstContainer.remove()
    secondContainer.remove()
  })

  it('injects the default helper selectors and exposes the removed gap variable', async () => {
    document.body.style.marginLeft = '4px'
    document.body.style.marginTop = '6px'
    document.body.style.marginRight = '20px'
    setViewport(1100, 1084)

    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(() => <RemoveScrollBar />, container)

    await tick()

    const styles = getStyleText()

    expect(styles).toContain(`.${noScrollbarsClassName}`)
    expect(styles).toContain(`.${zeroRightClassName}`)
    expect(styles).toContain(`.${fullWidthClassName}`)
    expect(styles).toContain('position: relative !important;')
    expect(styles).toContain('padding-left: 4px;')
    expect(styles).toContain('padding-top: 6px;')
    expect(styles).toContain('margin-right: 32px !important;')
    expect(styles).toContain(`${removedBarSizeVariable}: 32px;`)

    dispose()
    container.remove()
  })

  it('supports noRelative, noImportant, and padding gapMode', async () => {
    document.body.style.paddingLeft = '12px'
    document.body.style.paddingTop = '5px'
    document.body.style.paddingRight = '30px'
    setViewport(1280, 1264)

    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => <RemoveScrollBar gapMode="padding" noImportant noRelative />,
      container,
    )

    await tick()

    const styles = getStyleText()

    expect(styles).not.toContain('position: relative')
    expect(styles).not.toContain('!important')
    expect(styles).toContain('padding-right: 34px ;')
    expect(styles).not.toContain('margin-left: 0;')
    expect(styles).toContain(`${removedBarSizeVariable}: 34px;`)

    dispose()
    container.remove()
  })

  it('keeps the first mounted stylesheet when later instances use different options', async () => {
    document.body.style.marginRight = '16px'
    setViewport(1000, 980)

    const firstContainer = document.createElement('div')
    const secondContainer = document.createElement('div')
    document.body.append(firstContainer, secondContainer)

    const firstDispose = render(() => <RemoveScrollBar />, firstContainer)
    await tick()

    const firstStyles = getStyleText()

    const secondDispose = render(
      () => <RemoveScrollBar gapMode="padding" noImportant noRelative />,
      secondContainer,
    )
    await tick()

    expect(getStyleTags()).toHaveLength(1)
    expect(getStyleText()).toBe(firstStyles)
    expect(getStyleText()).toContain('position: relative !important;')

    firstDispose()
    secondDispose()
    firstContainer.remove()
    secondContainer.remove()
  })
})
