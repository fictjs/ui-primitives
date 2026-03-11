/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useSize } from '../src/index.js'

type ResizeObserverCallback = ConstructorParameters<typeof ResizeObserver>[0]

class ResizeObserverMock {
  callback: ResizeObserverCallback
  observed: Element[] = []

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe(element: Element): void {
    this.observed.push(element)
  }

  unobserve(element: Element): void {
    this.observed = this.observed.filter((entry) => entry !== element)
  }

  disconnect(): void {
    this.observed = []
  }

  trigger(entry: Partial<ResizeObserverEntry>): void {
    this.callback([entry as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
}

function flushMicrotasks(): Promise<void> {
  return Promise.resolve()
}

const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')

describe('@fictjs/use-size', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    if (originalOffsetWidth) {
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth)
    }
    if (originalOffsetHeight) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
    }
  })

  it('tracks initial size and resize observer updates', async () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return Number((this as HTMLElement).dataset.width ?? 0)
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return Number((this as HTMLElement).dataset.height ?? 0)
      },
    })

    let observer: ResizeObserverMock | undefined
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) {
        observer = new ResizeObserverMock(callback)
        return observer
      }
    })

    function Test() {
      const target = createSignal<HTMLDivElement | null>(null)
      const size = useSize(() => target())

      return (
        <>
          <div ref={(node) => target(node)} data-width="120" data-height="48" />
          <output>
            {(() => {
              const nextSize = size()
              return nextSize ? `${nextSize.width}x${nextSize.height}` : 'none'
            }) as unknown as string}
          </output>
        </>
      )
    }

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(() => <Test />, container)
    await flushMicrotasks()

    expect(container.querySelector('output')?.textContent).toBe('120x48')

    observer?.trigger({
      borderBoxSize: [{ inlineSize: 180, blockSize: 72 } as ResizeObserverSize],
    })
    await flushMicrotasks()

    expect(container.querySelector('output')?.textContent).toBe('180x72')
  })

  it('ignores temporary ref targets that are not elements', async () => {
    const observe = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      observe = observe
      unobserve(): void {}
      disconnect(): void {}
    })

    function Test() {
      const target = {
        current: document.createComment('placeholder') as unknown as HTMLDivElement,
      }
      const size = useSize(target)

      return <output>{size() ? 'ready' : 'none'}</output>
    }

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(() => <Test />, container)
    await flushMicrotasks()

    expect(container.querySelector('output')?.textContent).toBe('none')
    expect(observe).not.toHaveBeenCalled()
  })
})
