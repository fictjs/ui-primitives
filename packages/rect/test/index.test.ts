import { afterEach, describe, expect, it, vi } from 'vitest'

import { observeElementRect } from '../src/index.js'

type FrameQueueEntry = {
  callback: FrameRequestCallback
  cancelled: boolean
}

let frameId = 0
let frameQueue = new Map<number, FrameQueueEntry>()

function flushAnimationFrames(timestamp = 0): void {
  const queued = Array.from(frameQueue.entries())
  frameQueue = new Map()

  for (const [, entry] of queued) {
    if (!entry.cancelled) {
      entry.callback(timestamp)
    }
  }
}

describe('@fictjs/rect', () => {
  afterEach(() => {
    frameId = 0
    frameQueue = new Map()
    vi.unstubAllGlobals()
  })

  it('observes rect changes over animation frames', () => {
    vi.stubGlobal('requestAnimationFrame', ((callback: FrameRequestCallback) => {
      const id = ++frameId
      frameQueue.set(id, { callback, cancelled: false })
      return id
    }) as typeof requestAnimationFrame)
    vi.stubGlobal('cancelAnimationFrame', ((id: number) => {
      const entry = frameQueue.get(id)
      if (entry) {
        entry.cancelled = true
      }
    }) as typeof cancelAnimationFrame)

    let currentRect = new DOMRect(0, 0, 120, 40)
    const measurable = {
      getBoundingClientRect: () => currentRect,
    }
    const callback = vi.fn()

    const unobserve = observeElementRect(measurable, callback)
    flushAnimationFrames()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0]?.[0]).toEqual(currentRect)

    currentRect = new DOMRect(0, 0, 180, 56)
    flushAnimationFrames()

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback.mock.calls[1]?.[0]).toEqual(currentRect)

    unobserve()
    flushAnimationFrames()

    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('stops polling when the final observer unsubscribes during delivery', () => {
    vi.stubGlobal('requestAnimationFrame', ((callback: FrameRequestCallback) => {
      const id = ++frameId
      frameQueue.set(id, { callback, cancelled: false })
      return id
    }) as typeof requestAnimationFrame)
    vi.stubGlobal('cancelAnimationFrame', ((id: number) => {
      const entry = frameQueue.get(id)
      if (entry) {
        entry.cancelled = true
      }
    }) as typeof cancelAnimationFrame)

    const measurable = {
      getBoundingClientRect: () => new DOMRect(0, 0, 120, 40),
    }
    const callback = vi.fn()
    let unobserve = () => {}
    unobserve = observeElementRect(measurable, (rect) => {
      callback(rect)
      unobserve()
    })

    flushAnimationFrames()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(frameQueue.size).toBe(0)

    flushAnimationFrames()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('delivers a changed rect to every observer when one unsubscribes during delivery', () => {
    vi.stubGlobal('requestAnimationFrame', ((callback: FrameRequestCallback) => {
      const id = ++frameId
      frameQueue.set(id, { callback, cancelled: false })
      return id
    }) as typeof requestAnimationFrame)
    vi.stubGlobal('cancelAnimationFrame', ((id: number) => {
      const entry = frameQueue.get(id)
      if (entry) {
        entry.cancelled = true
      }
    }) as typeof cancelAnimationFrame)

    const measurable = {
      getBoundingClientRect: () => new DOMRect(0, 0, 120, 40),
    }
    const firstCallback = vi.fn()
    const secondCallback = vi.fn()
    let unobserveFirst = () => {}
    unobserveFirst = observeElementRect(measurable, (rect) => {
      firstCallback(rect)
      unobserveFirst()
    })
    const unobserveSecond = observeElementRect(measurable, secondCallback)

    flushAnimationFrames()

    expect(firstCallback).toHaveBeenCalledTimes(1)
    expect(secondCallback).toHaveBeenCalledTimes(2)

    unobserveSecond()
    flushAnimationFrames()
  })
})
