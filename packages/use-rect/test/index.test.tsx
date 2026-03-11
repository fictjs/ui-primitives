/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useRect } from '../src/index.js'

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

function flushMicrotasks(): Promise<void> {
  return Promise.resolve()
}

const originalGetBoundingClientRect = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'getBoundingClientRect',
)

describe('@fictjs/use-rect', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    frameId = 0
    frameQueue = new Map()
    vi.unstubAllGlobals()
    if (originalGetBoundingClientRect) {
      Object.defineProperty(
        HTMLElement.prototype,
        'getBoundingClientRect',
        originalGetBoundingClientRect,
      )
    }
  })

  it('returns the current rect and updates when the element moves', async () => {
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

    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: function () {
        return new DOMRect(
          0,
          0,
          Number((this as HTMLElement).dataset.width ?? 0),
          Number((this as HTMLElement).dataset.height ?? 0),
        )
      },
    })

    let latestTarget: ReturnType<typeof createSignal<HTMLDivElement | null>> | undefined

    function Test() {
      const target = createSignal<HTMLDivElement | null>(null)
      const rect = useRect(() => target())
      latestTarget = target

      return (
        <>
          <div ref={(node) => target(node)} data-width="120" data-height="64" />
          <output>
            {
              (() => {
                const nextRect = rect()
                return nextRect ? `${nextRect.width}x${nextRect.height}` : 'none'
              }) as unknown as string
            }
          </output>
        </>
      )
    }

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(() => <Test />, container)
    await flushMicrotasks()
    flushAnimationFrames()
    await flushMicrotasks()

    const output = container.querySelector('output')

    expect(output?.textContent).toBe('120x64')

    const target = latestTarget?.()
    expect(target).toBeInstanceOf(HTMLDivElement)

    target!.dataset.width = '160'
    target!.dataset.height = '96'
    flushAnimationFrames()
    await flushMicrotasks()

    expect(container.querySelector('output')?.textContent).toBe('160x96')
  })
})
