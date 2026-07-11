/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { mergeProps, prop, render, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Primitive } from '@fictjs/primitive'

const floatingUiMocks = vi.hoisted(() => {
  return {
    autoUpdate: vi.fn(() => () => {}),
    offset: vi.fn((options) => ({ name: 'offset', options })),
    shift: vi.fn((options) => ({ name: 'shift', options })),
    limitShift: vi.fn(() => ({ name: 'limitShift' })),
    flip: vi.fn((options) => ({ name: 'flip', options })),
    size: vi.fn((options) => ({ name: 'size', options })),
    arrow: vi.fn((options) => ({ name: 'arrow', options })),
    hide: vi.fn((options) => ({ name: 'hide', options })),
    useFloating: vi.fn(),
  }
})

const useSizeMock = vi.hoisted(() => vi.fn())

vi.mock('@fictjs/floating-ui-dom', () => floatingUiMocks)
vi.mock('@fictjs/use-size', () => ({
  useSize: useSizeMock,
}))

import { Popper, PopperAnchor, PopperArrow, PopperContent } from '../src/index.js'

type FloatingResultOptions = {
  placement?: string
  isPositioned?: boolean
  middlewareData?: Record<string, unknown>
  floatingStyles?: Record<string, string | number>
}

function createFloatingResult(options: FloatingResultOptions = {}) {
  const refs = {
    reference: { current: null as unknown },
    floating: { current: null as HTMLElement | null },
    setReference: vi.fn((node: unknown) => {
      refs.reference.current = node
    }),
    setFloating: vi.fn((node: HTMLElement | null) => {
      refs.floating.current = node
    }),
  }

  return {
    refs,
    elements: {
      get reference() {
        return refs.reference.current
      },
      get floating() {
        return refs.floating.current
      },
    },
    floatingStyles: {
      position: 'fixed',
      left: 0,
      top: 0,
      transform: 'translate(12px, 16px)',
      ...(options.floatingStyles ?? {}),
    },
    x: () => 12,
    y: () => 16,
    strategy: () => 'fixed',
    placement: () => (options.placement ?? 'top-start') as never,
    middlewareData: () => options.middlewareData ?? {},
    isPositioned: () => options.isPositioned ?? true,
    update: vi.fn(),
  }
}

function flushEffects(): Promise<void> {
  return Promise.resolve().then(() => Promise.resolve())
}

describe('@fictjs/popper', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    useSizeMock.mockReset()
  })

  it('forwards floating data to content and configures middleware', async () => {
    useSizeMock.mockImplementation(() => () => ({ width: 20, height: 10 }))

    let capturedOptions:
      | {
          middleware?: () => Array<{ name: string; options?: Record<string, unknown> }>
          elements?: { reference?: () => unknown }
        }
      | undefined

    floatingUiMocks.useFloating.mockImplementation((options) => {
      capturedOptions = options
      return createFloatingResult({
        placement: 'top-start',
        middlewareData: {
          arrow: { x: 9, y: 7, centerOffset: 0 },
          transformOrigin: { x: '11px', y: '-10px' },
        },
      })
    })

    const onPlaced = vi.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      () => (
        <Popper>
          <PopperAnchor data-testid="anchor" />
          <PopperContent
            align="end"
            alignOffset={6}
            dir="rtl"
            onPlaced={onPlaced}
            side="bottom"
            sideOffset={4}
            style={{ zIndex: 40 }}
          >
            content
          </PopperContent>
        </Popper>
      ),
      container,
    )

    await flushEffects()

    const wrapper = container.querySelector('[data-radix-popper-content-wrapper]') as HTMLDivElement
    const content = container.querySelector('[data-side]') as HTMLDivElement
    const middleware = capturedOptions?.middleware?.() ?? []

    expect(onPlaced).toHaveBeenCalledTimes(1)
    expect(wrapper.getAttribute('dir')).toBe('rtl')
    expect(wrapper.style.transform).toBe('translate(12px, 16px)')
    expect(wrapper.style.minWidth).toBe('max-content')
    expect(wrapper.style.zIndex).toBe('40')
    expect(wrapper.style.getPropertyValue('--radix-popper-transform-origin')).toBe('11px -10px')
    expect(content.getAttribute('data-side')).toBe('top')
    expect(content.getAttribute('data-align')).toBe('start')
    expect(middleware.map((entry) => entry.name)).toEqual([
      'offset',
      'flip',
      'shift',
      'size',
      'transformOrigin',
    ])
    expect(floatingUiMocks.offset).toHaveBeenCalledWith({ mainAxis: 14, alignmentAxis: 6 })
    expect(floatingUiMocks.shift).toHaveBeenCalledWith({
      altBoundary: false,
      boundary: [],
      crossAxis: false,
      limiter: { name: 'limitShift' },
      mainAxis: true,
      padding: 0,
    })
    expect(floatingUiMocks.flip).toHaveBeenCalledWith({
      altBoundary: false,
      boundary: [],
      padding: 0,
    })

    const sizeOptions = floatingUiMocks.size.mock.calls[0]?.[0]
    const floatingElement = document.createElement('div')
    sizeOptions.apply({
      elements: { floating: floatingElement },
      rects: { reference: { width: 80, height: 24 } },
      availableWidth: 320,
      availableHeight: 180,
    })

    expect(floatingElement.style.getPropertyValue('--radix-popper-available-width')).toBe('320px')
    expect(floatingElement.style.getPropertyValue('--radix-popper-available-height')).toBe('180px')
    expect(floatingElement.style.getPropertyValue('--radix-popper-anchor-width')).toBe('80px')
    expect(floatingElement.style.getPropertyValue('--radix-popper-anchor-height')).toBe('24px')
    expect(capturedOptions?.elements?.reference?.()).toBeInstanceOf(HTMLDivElement)
  })

  it('calls the latest onPlaced handler from component props', async () => {
    useSizeMock.mockImplementation(() => () => ({ width: 0, height: 0 }))
    const isPositioned = createSignal(false)
    const calls: string[] = []
    const onPlaced = createSignal<() => void>(() => calls.push('first'))

    floatingUiMocks.useFloating.mockImplementation(() => ({
      ...createFloatingResult({ isPositioned: false }),
      isPositioned,
    }))

    const container = document.createElement('div')
    document.body.appendChild(container)
    const dispose = render(
      () => (
        <Popper>
          <PopperAnchor />
          <PopperContent onPlaced={prop(() => onPlaced())}>content</PopperContent>
        </Popper>
      ),
      container,
    )

    await flushEffects()
    onPlaced(() => calls.push('second'))
    isPositioned(true)
    await flushEffects()

    expect(calls).toEqual(['second'])

    dispose()
  })

  it('forwards the latest intrinsic content event handler', async () => {
    useSizeMock.mockImplementation(() => () => ({ width: 0, height: 0 }))
    floatingUiMocks.useFloating.mockImplementation(() => createFloatingResult())
    const first = vi.fn()
    const second = vi.fn()
    const handler = createSignal<(event: MouseEvent) => void>(first)
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      () => (
        <Popper>
          <PopperAnchor />
          <PopperContent data-testid="content" onClick={prop(() => handler())}>
            content
          </PopperContent>
        </Popper>
      ),
      container,
    )

    await flushEffects()
    const content = container.querySelector('[data-testid="content"]') as HTMLDivElement
    content.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(first).toHaveBeenCalledOnce()

    handler(second)
    await flushEffects()
    expect(container.querySelector('[data-testid="content"]')).toBe(content)
    content.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
  })

  it('supports virtual anchors, arrow positioning, and detached hiding', async () => {
    useSizeMock.mockImplementation(() => () => ({ width: 12, height: 6 }))

    let capturedOptions:
      | {
          middleware?: () => Array<{ name: string; options?: Record<string, unknown> }>
          elements?: { reference?: () => unknown }
        }
      | undefined

    const virtualRef = {
      current: {
        getBoundingClientRect() {
          return new DOMRect(30, 40, 60, 24)
        },
      },
    }

    floatingUiMocks.useFloating.mockImplementation((options) => {
      capturedOptions = options
      return createFloatingResult({
        placement: 'left-end',
        middlewareData: {
          arrow: { x: 3, y: 8, centerOffset: 1 },
          hide: { referenceHidden: true },
          transformOrigin: { x: '100%', y: '14px' },
        },
      })
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      () => (
        <Popper>
          <PopperAnchor virtualRef={virtualRef} />
          <PopperContent avoidCollisions={false} hideWhenDetached>
            <PopperArrow data-testid="arrow" />
          </PopperContent>
        </Popper>
      ),
      container,
    )

    await flushEffects()

    const wrapper = container.querySelector('[data-radix-popper-content-wrapper]') as HTMLDivElement
    const arrow = container.querySelector('[data-testid="arrow"]') as SVGSVGElement
    const arrowWrapper = arrow.parentElement as HTMLSpanElement
    const middleware = capturedOptions?.middleware?.() ?? []

    expect(capturedOptions?.elements?.reference?.()).toBe(virtualRef.current)
    expect(container.querySelector('[data-testid="anchor"]')).toBeNull()
    expect(wrapper.style.visibility).toBe('hidden')
    expect(wrapper.style.pointerEvents).toBe('none')
    expect(arrowWrapper.style.left).toBe('3px')
    expect(arrowWrapper.style.top).toBe('8px')
    expect(arrowWrapper.style.right).toBe('0px')
    expect(arrowWrapper.style.visibility).toBe('hidden')
    expect(arrowWrapper.style.transform).toBe('translateY(50%) rotate(-90deg) translateX(50%)')
    expect(middleware.map((entry) => entry.name)).toEqual([
      'offset',
      'size',
      'arrow',
      'transformOrigin',
      'hide',
    ])
    expect(floatingUiMocks.hide).toHaveBeenCalledWith({
      altBoundary: false,
      boundary: [],
      padding: 0,
      strategy: 'referenceHidden',
    })
  })

  it('updates the active reference without remounting the initial anchor structure', async () => {
    useSizeMock.mockImplementation(() => () => ({ width: 0, height: 0 }))
    let capturedOptions: { elements?: { reference?: () => unknown } } | undefined
    const virtualAnchor = {
      current: {
        getBoundingClientRect() {
          return new DOMRect(20, 30, 40, 10)
        },
      },
    }
    const virtualRef = createSignal<typeof virtualAnchor | undefined>(undefined)

    floatingUiMocks.useFloating.mockImplementation((options) => {
      capturedOptions = options
      return createFloatingResult()
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      () => (
        <Popper>
          <PopperAnchor data-testid="anchor" virtualRef={virtualRef} />
          <PopperContent>content</PopperContent>
        </Popper>
      ),
      container,
    )

    await flushEffects()
    expect(container.querySelector('[data-testid="anchor"]')).not.toBeNull()
    expect(capturedOptions?.elements?.reference?.()).toBeInstanceOf(HTMLDivElement)

    virtualRef(virtualAnchor)
    await flushEffects()
    const anchor = container.querySelector('[data-testid="anchor"]')
    expect(anchor).not.toBeNull()
    expect(capturedOptions?.elements?.reference?.()).toBe(virtualAnchor.current)

    virtualRef(undefined)
    await flushEffects()
    expect(container.querySelector('[data-testid="anchor"]')).toBe(anchor)
    expect(capturedOptions?.elements?.reference?.()).toBeInstanceOf(HTMLDivElement)
  })

  it('keeps an initially virtual anchor structurally virtual when its reference clears', async () => {
    useSizeMock.mockImplementation(() => () => ({ width: 0, height: 0 }))
    let capturedOptions: { elements?: { reference?: () => unknown } } | undefined
    const virtualAnchor = {
      current: {
        getBoundingClientRect() {
          return new DOMRect(20, 30, 40, 10)
        },
      },
    }
    const virtualRef = createSignal<typeof virtualAnchor | undefined>(virtualAnchor)

    floatingUiMocks.useFloating.mockImplementation((options) => {
      capturedOptions = options
      return createFloatingResult()
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      () => (
        <Popper>
          <PopperAnchor data-testid="anchor" virtualRef={virtualRef} />
          <PopperContent>content</PopperContent>
        </Popper>
      ),
      container,
    )

    await flushEffects()
    expect(container.querySelector('[data-testid="anchor"]')).toBeNull()
    expect(capturedOptions?.elements?.reference?.()).toBe(virtualAnchor.current)

    virtualRef(undefined)
    await flushEffects()

    expect(container.querySelector('[data-testid="anchor"]')).toBeNull()
    expect(capturedOptions?.elements?.reference?.()).toBeNull()
  })

  it('reads direct signal accessors for content positioning options', async () => {
    useSizeMock.mockImplementation(() => () => ({ width: 0, height: 0 }))
    const side = createSignal<'bottom' | 'right'>('bottom')
    const align = createSignal<'start' | 'end'>('start')
    const sideOffset = createSignal(4)
    let capturedOptions:
      | {
          placement?: () => string
          middleware?: () => Array<{ name: string; options?: Record<string, unknown> }>
        }
      | undefined

    floatingUiMocks.useFloating.mockImplementation((options) => {
      capturedOptions = options
      return createFloatingResult()
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      () => (
        <Popper>
          <PopperAnchor />
          <PopperContent align={align} side={side} sideOffset={sideOffset}>
            content
          </PopperContent>
        </Popper>
      ),
      container,
    )

    await flushEffects()
    expect(capturedOptions?.placement?.()).toBe('bottom-start')
    capturedOptions?.middleware?.()
    expect(floatingUiMocks.offset).toHaveBeenLastCalledWith({
      alignmentAxis: 0,
      mainAxis: 4,
    })

    side('right')
    align('end')
    sideOffset(8)
    await flushEffects()

    expect(capturedOptions?.placement?.()).toBe('right-end')
    capturedOptions?.middleware?.()
    expect(floatingUiMocks.offset).toHaveBeenLastCalledWith({
      alignmentAxis: 0,
      mainAxis: 8,
    })
  })

  it('preserves reactive props through a nested slotted anchor', async () => {
    const state = createSignal<'closed' | 'open'>('closed')
    const container = document.createElement('div')

    function ForwardedButton(props: JSX.IntrinsicElements['button']) {
      return <button {...mergeProps(prop(() => props as Record<string, unknown>))}>Trigger</button>
    }

    render(
      () => (
        <Popper>
          <PopperAnchor asChild>
            <Primitive.button asChild data-state={prop(() => state())}>
              <ForwardedButton data-testid="trigger" type="button" />
            </Primitive.button>
          </PopperAnchor>
        </Popper>
      ),
      container,
    )

    await flushEffects()
    const trigger = container.querySelector('[data-testid="trigger"]')
    expect(trigger?.getAttribute('data-state')).toBe('closed')

    state('open')
    await flushEffects()

    expect(container.querySelector('[data-testid="trigger"]')).toBe(trigger)
    expect(trigger?.getAttribute('data-state')).toBe('open')
  })

  it('keeps the arrow visible until middleware reports that centering failed', async () => {
    useSizeMock.mockImplementation(() => () => ({ width: 12, height: 6 }))

    floatingUiMocks.useFloating.mockImplementation(() =>
      createFloatingResult({
        placement: 'bottom',
        middlewareData: {},
      }),
    )

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      () => (
        <Popper>
          <PopperAnchor data-testid="anchor" />
          <PopperContent>
            <PopperArrow data-testid="arrow" />
          </PopperContent>
        </Popper>
      ),
      container,
    )

    await flushEffects()

    const arrow = container.querySelector('[data-testid="arrow"]') as SVGSVGElement
    const arrowWrapper = arrow.parentElement as HTMLSpanElement

    expect(arrowWrapper.style.visibility).toBe('')
  })

  it('preserves the arrow side anchor when a coordinate is not provided', async () => {
    useSizeMock.mockImplementation(() => () => ({ width: 12, height: 6 }))

    floatingUiMocks.useFloating.mockImplementation(() =>
      createFloatingResult({
        placement: 'bottom',
        middlewareData: {
          arrow: { x: 14, centerOffset: 0 },
        },
      }),
    )

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      () => (
        <Popper>
          <PopperAnchor data-testid="anchor" />
          <PopperContent>
            <PopperArrow data-testid="arrow" />
          </PopperContent>
        </Popper>
      ),
      container,
    )

    await flushEffects()

    const arrow = container.querySelector('[data-testid="arrow"]') as SVGSVGElement
    const arrowWrapper = arrow.parentElement as HTMLSpanElement

    expect(arrowWrapper.style.left).toBe('14px')
    expect(arrowWrapper.style.top).toBe('0px')
  })

  it('falls back to DOM geometry when floating-ui does not provide arrow coordinates', async () => {
    useSizeMock.mockImplementation(() => () => ({ width: 10, height: 5 }))

    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect
    try {
      Element.prototype.getBoundingClientRect = function () {
        if ((this as Element).getAttribute('data-testid') === 'anchor') {
          return new DOMRect(40, 80, 60, 24)
        }

        if ((this as Element).getAttribute('data-side') === 'top') {
          return new DOMRect(10, 40, 120, 24)
        }

        if (
          this instanceof HTMLSpanElement &&
          (this.querySelector('[data-testid="arrow"]') as Element | null)
        ) {
          return new DOMRect(0, 0, 10, 5)
        }

        return originalGetBoundingClientRect.call(this)
      }

      floatingUiMocks.useFloating.mockImplementation(() =>
        createFloatingResult({
          placement: 'top',
          middlewareData: {},
        }),
      )

      const container = document.createElement('div')
      document.body.appendChild(container)

      render(
        () => (
          <Popper>
            <PopperAnchor data-testid="anchor" />
            <PopperContent>
              <PopperArrow data-testid="arrow" />
            </PopperContent>
          </Popper>
        ),
        container,
      )

      await flushEffects()

      const arrow = container.querySelector('[data-testid="arrow"]') as SVGSVGElement
      const arrowWrapper = arrow.parentElement as HTMLSpanElement

      expect(arrowWrapper.style.left).toBe('55px')
      expect(arrowWrapper.style.top).toBe('')
      expect(arrowWrapper.style.bottom).toBe('0px')
    } finally {
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect
    }
  })
})
