import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createEffect, createRoot, onMount, render, untrack } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { arrow, flip, hide, limitShift, offset, shift, size, useFloating } from '../src/index.js'

function tick(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(resolve)
      return
    }

    Promise.resolve().then(resolve)
  })
}

async function flush(): Promise<void> {
  await tick()
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
  await tick()
}

function createRect(width: number, height: number, x = 0, y = 0): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    toJSON() {
      return {}
    },
  } as DOMRect
}

function mockRect(element: Element, width: number, height: number, x = 0, y = 0): void {
  ;(element as HTMLElement).getBoundingClientRect = vi.fn(() => createRect(width, height, x, y))
}

function signalRef<T extends Element>(signal: (node: T | null) => void): (node: T | null) => void {
  return (node) => {
    signal(node)
  }
}

function untrackedRef<T extends Element>(ref: (node: T | null) => void): (node: T | null) => void {
  return (node) => {
    untrack(() => {
      ref(node)
    })
  }
}

describe('@fictjs/floating-ui-dom', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  it('keeps middleware fresh without entering update loops', async () => {
    const phase = createSignal<'initial' | 'step1' | 'step2' | 'step3' | 'step4'>('initial')

    const inlineDispose = render(() => {
      const inlineArrow = createSignal<HTMLDivElement | null>(null)
      const floating = useFloating({
        placement: 'right',
        middleware: [
          offset(),
          offset(10),
          offset(() => 5),
          offset(() => ({ crossAxis: 10 })),
          offset({ crossAxis: 10, mainAxis: 10 }),
          flip({ fallbackPlacements: ['top', 'bottom'] }),
          shift(),
          shift({ crossAxis: true }),
          shift({ boundary: document.createElement('div') }),
          shift({ boundary: [document.createElement('div')] }),
          shift({ limiter: limitShift() }),
          shift({ limiter: limitShift({ offset: 10 }) }),
          shift({ limiter: limitShift({ offset: { crossAxis: 10 } }) }),
          shift({ limiter: limitShift({ offset: () => 5 }) }),
          shift({ limiter: limitShift({ offset: () => ({ crossAxis: 10 }) }) }),
          arrow({ element: inlineArrow }),
          hide(),
          size({
            apply({ availableHeight, elements }) {
              Object.assign(elements.floating.style, {
                maxHeight: `${availableHeight}px`,
              })
            },
          }),
        ],
      })

      return (
        <>
          <div ref={floating.refs.setReference} />
          <div ref={floating.refs.setFloating}>
            <div ref={signalRef(inlineArrow)} />
          </div>
        </>
      )
    }, container)

    let stateful: ReturnType<typeof useFloating<HTMLDivElement>> | undefined

    const stateDispose = render(() => {
      const stateArrow = createSignal<HTMLDivElement | null>(null)
      const middleware = () => {
        switch (phase()) {
          case 'step1':
            return [offset(10)]
          case 'step2':
            return [offset(() => 5)]
          case 'step3':
            return []
          case 'step4':
            return [flip()]
          case 'initial':
          default:
            return [
              offset(),
              offset(10),
              offset(() => 5),
              offset(() => ({ crossAxis: 10 })),
              offset({ crossAxis: 10, mainAxis: 10 }),
              flip({ fallbackPlacements: ['top', 'bottom'] }),
              shift(),
              shift({ crossAxis: true }),
              shift({ boundary: document.createElement('div') }),
              shift({ boundary: [document.createElement('div')] }),
              shift({ limiter: limitShift() }),
              shift({ limiter: limitShift({ offset: 10 }) }),
              shift({ limiter: limitShift({ offset: { crossAxis: 10 } }) }),
              shift({ limiter: limitShift({ offset: () => 5 }) }),
              shift({ limiter: limitShift({ offset: () => ({ crossAxis: 10 }) }) }),
              arrow({ element: stateArrow }),
              hide(),
              size({
                apply({ availableHeight, elements }) {
                  Object.assign(elements.floating.style, {
                    maxHeight: `${availableHeight}px`,
                  })
                },
              }),
            ]
        }
      }

      const floating = useFloating<HTMLDivElement>({
        placement: () => 'right',
        middleware,
      })
      stateful = floating

      return (
        <>
          <div ref={floating.refs.setReference} />
          <div ref={floating.refs.setFloating}>
            <div ref={signalRef(stateArrow)} />
          </div>
        </>
      )
    }, container)

    phase('step1')
    await flush()
    expect(stateful!.x()).toBe(10)

    phase('step2')
    await flush()
    expect(stateful!.x()).toBe(5)

    phase('step3')
    phase('step4')
    await flush()

    inlineDispose()
    stateDispose()
  })

  it('positions mounted elements and exposes reactive accessors', async () => {
    let floating: ReturnType<typeof useFloating<HTMLButtonElement>> | undefined

    const dispose = render(() => {
      const api = useFloating<HTMLButtonElement>()
      floating = api

      return (
        <>
          <button data-testid="reference" ref={api.refs.setReference}>
            Trigger
          </button>
          <div data-testid="floating" ref={api.refs.setFloating} style={api.floatingStyles}>
            Content
          </div>
        </>
      )
    }, container)

    const reference = container.querySelector('[data-testid="reference"]') as HTMLButtonElement
    const floatingElement = container.querySelector('[data-testid="floating"]') as HTMLDivElement
    mockRect(reference, 50, 50)

    floating!.update()
    await flush()

    expect(floating!.x()).toBe(25)
    expect(floating!.y()).toBe(50)
    expect(floating!.placement()).toBe('bottom')
    expect(floating!.strategy()).toBe('absolute')
    expect(floating!.refs.reference.current).toBe(reference)
    expect(floating!.elements.reference).toBe(reference)
    expect(floatingElement.style.transform).toBe('translate(25px, 50px)')

    dispose()

    expect(floating!.refs.reference.current).toBe(null)
    expect(floating!.refs.floating.current).toBe(null)
  })

  it('supports reactive middleware and open state without rerendering the component', async () => {
    const gap = createSignal(10)
    const open = createSignal(false)
    let floating: ReturnType<typeof useFloating<HTMLButtonElement>> | undefined

    const dispose = render(() => {
      const api = useFloating<HTMLButtonElement>({
        middleware: () => [offset(gap())],
        open,
        placement: () => 'right',
      })
      floating = api

      return (
        <>
          <button data-testid="reference" ref={api.refs.setReference} onClick={() => open(!open())}>
            Toggle
          </button>
          {reactive(() =>
            open() ? (
              <div
                data-testid="floating"
                ref={untrackedRef(api.refs.setFloating)}
                style={api.floatingStyles}
              >
                Content
              </div>
            ) : null,
          )}
        </>
      )
    }, container)

    const reference = container.querySelector('[data-testid="reference"]') as HTMLButtonElement
    mockRect(reference, 50, 50)

    reference.click()
    await flush()

    expect(floating!.isPositioned()).toBe(true)
    expect(floating!.x()).toBe(60)
    expect(floating!.y()).toBe(25)

    gap(20)
    await flush()

    expect(floating!.x()).toBe(70)

    reference.click()
    await flush()

    expect(floating!.isPositioned()).toBe(false)

    dispose()
  })

  it('syncs external element sources and ref-backed arrow middleware', async () => {
    const referenceElement = createSignal<HTMLButtonElement | null>(null)
    const floatingElement = createSignal<HTMLDivElement | null>(null)
    const arrowElement = createSignal<HTMLSpanElement | null>(null)
    let floating: ReturnType<typeof useFloating<HTMLButtonElement>> | undefined

    const dispose = render(() => {
      const api = useFloating<HTMLButtonElement>({
        elements: {
          reference: referenceElement,
          floating: floatingElement,
        },
        middleware: () => [offset(4), arrow({ element: arrowElement })],
      })
      floating = api

      return (
        <>
          <button data-testid="reference" ref={signalRef(referenceElement)}>
            Trigger
          </button>
          <div data-testid="floating" ref={signalRef(floatingElement)} style={api.floatingStyles}>
            <span data-testid="arrow" ref={signalRef(arrowElement)} />
          </div>
        </>
      )
    }, container)

    const reference = container.querySelector('[data-testid="reference"]') as HTMLButtonElement
    const floatingNode = container.querySelector('[data-testid="floating"]') as HTMLDivElement
    const arrowNode = container.querySelector('[data-testid="arrow"]') as HTMLSpanElement

    mockRect(reference, 60, 40)
    mockRect(floatingNode, 80, 20)
    mockRect(arrowNode, 10, 10)

    floating!.update()
    await flush()

    expect(floating!.elements.reference).toBe(reference)
    expect(floating!.refs.reference.current).toBe(reference)
    expect(floating!.elements.floating).toBe(floatingNode)
    expect(floating!.middlewareData().arrow).toBeDefined()
    expect(floating!.y()).toBe(44)

    dispose()
  })

  it('applies layout styles when transform is disabled', async () => {
    let floating: ReturnType<typeof useFloating<HTMLButtonElement>> | undefined

    const dispose = render(() => {
      const api = useFloating<HTMLButtonElement>({
        transform: false,
      })
      floating = api

      return (
        <>
          <button data-testid="reference" ref={api.refs.setReference}>
            Trigger
          </button>
          <div data-testid="floating" ref={api.refs.setFloating} style={api.floatingStyles}>
            Content
          </div>
        </>
      )
    }, container)

    const reference = container.querySelector('[data-testid="reference"]') as HTMLButtonElement
    const floatingElement = container.querySelector('[data-testid="floating"]') as HTMLDivElement
    mockRect(reference, 50, 50)

    floating!.update()
    await flush()

    expect(floatingElement.style.position).toBe('absolute')
    expect(floatingElement.style.left).toBe('25px')
    expect(floatingElement.style.top).toBe('50px')
    expect(floatingElement.style.transform).toBe('')

    dispose()
  })

  describe('whileElementsMounted', () => {
    it('is called once when both elements mount together', async () => {
      const attachSpy = vi.fn()

      const dispose = render(() => {
        const floating = useFloating<HTMLButtonElement>({
          whileElementsMounted: attachSpy,
        })

        return (
          <>
            <button ref={floating.refs.setReference}>Trigger</button>
            <div ref={floating.refs.setFloating}>Content</div>
          </>
        )
      }, container)

      await flush()
      expect(attachSpy).toHaveBeenCalledTimes(1)

      dispose()
    })

    it('is called once after the floating element mounts conditionally', async () => {
      const open = createSignal(false)
      const attachSpy = vi.fn()

      const dispose = render(() => {
        const floating = useFloating<HTMLButtonElement>({
          whileElementsMounted: attachSpy,
        })

        return (
          <>
            <button ref={floating.refs.setReference} onClick={() => open(true)}>
              Trigger
            </button>
            {reactive(() =>
              open() ? <div ref={untrackedRef(floating.refs.setFloating)}>Content</div> : null,
            )}
          </>
        )
      }, container)

      await flush()
      expect(attachSpy).toHaveBeenCalledTimes(0)
      ;(container.querySelector('button') as HTMLButtonElement).click()
      await flush()
      expect(attachSpy).toHaveBeenCalledTimes(1)

      dispose()
    })

    it('is called once after the reference element mounts conditionally', async () => {
      const open = createSignal(false)
      const attachSpy = vi.fn()

      const dispose = render(() => {
        const floating = useFloating<HTMLButtonElement>({
          whileElementsMounted: attachSpy,
        })

        return (
          <>
            {reactive(() =>
              open() ? (
                <button ref={untrackedRef(floating.refs.setReference)}>Trigger</button>
              ) : null,
            )}
            <div role="tooltip" ref={floating.refs.setFloating} onClick={() => open(true)}>
              Content
            </div>
          </>
        )
      }, container)

      await flush()
      expect(attachSpy).toHaveBeenCalledTimes(0)
      ;(container.querySelector('[role="tooltip"]') as HTMLDivElement).click()
      await flush()
      expect(attachSpy).toHaveBeenCalledTimes(1)

      dispose()
    })

    it('is called once after both elements mount conditionally', async () => {
      const open = createSignal(false)
      const attachSpy = vi.fn()

      const dispose = render(() => {
        const floating = useFloating<HTMLButtonElement>({
          whileElementsMounted: attachSpy,
        })

        onMount(() => {
          open(true)
        })

        return (
          <>
            {reactive(() =>
              open() ? (
                <button ref={untrackedRef(floating.refs.setReference)}>Trigger</button>
              ) : null,
            )}
            {reactive(() =>
              open() ? (
                <div role="tooltip" ref={untrackedRef(floating.refs.setFloating)}>
                  Content
                </div>
              ) : null,
            )}
          </>
        )
      }, container)

      await flush()
      expect(attachSpy).toHaveBeenCalledTimes(1)

      dispose()
    })

    it('runs cleanup when the mounted pair detaches', async () => {
      const open = createSignal(true)
      const cleanupSpy = vi.fn()
      const attachSpy = vi.fn(() => cleanupSpy)

      const dispose = render(() => {
        const api = useFloating<HTMLButtonElement>({
          open,
          whileElementsMounted: attachSpy,
        })

        return (
          <>
            {reactive(() =>
              open() ? (
                <button data-testid="reference" ref={untrackedRef(api.refs.setReference)}>
                  Trigger
                </button>
              ) : null,
            )}
            {reactive(() =>
              open() ? (
                <div data-testid="floating" ref={untrackedRef(api.refs.setFloating)}>
                  Content
                </div>
              ) : null,
            )}
          </>
        )
      }, container)

      await flush()

      expect(attachSpy).toHaveBeenCalledTimes(1)

      open(false)
      await flush()

      expect(cleanupSpy).toHaveBeenCalledTimes(1)

      dispose()
    })
  })

  it('supports unstable callback wrappers around ref setters', async () => {
    const dispose = render(() => {
      const floating = useFloating<HTMLDivElement>()

      return (
        <>
          <div ref={(node: HTMLDivElement | null) => floating.refs.setReference(node)} />
          <div ref={(node: HTMLDivElement | null) => floating.refs.setFloating(node)} />
        </>
      )
    }, container)

    await flush()

    dispose()
  })

  it('tracks isPositioned across repeated open transitions', async () => {
    const open = createSignal(false)
    const seen: boolean[] = []
    let floating: ReturnType<typeof useFloating<HTMLButtonElement>> | undefined

    const dispose = render(() => {
      const api = useFloating<HTMLButtonElement>({ open })
      floating = api

      createEffect(() => {
        seen.push(api.isPositioned())
      })

      return (
        <>
          <button ref={api.refs.setReference} onClick={() => open(!open())}>
            Toggle
          </button>
          {reactive(() =>
            open() ? <div ref={untrackedRef(api.refs.setFloating)}>Content</div> : null,
          )}
        </>
      )
    }, container)

    const button = container.querySelector('button') as HTMLButtonElement

    button.click()
    await flush()
    button.click()
    await flush()
    button.click()
    await flush()
    button.click()
    await flush()

    expect(floating!.isPositioned()).toBe(false)
    expect(seen).toEqual([false, true, false, true, false])

    dispose()
  })

  it('syncs elements forwarded through refs.setReference and refs.setFloating', async () => {
    const referenceElement = createSignal<HTMLElement | null>(null)
    const floatingElement = createSignal<HTMLElement | null>(null)
    let floating: ReturnType<typeof useFloating> | undefined

    const dispose = render(() => {
      const api = useFloating()
      floating = api

      createEffect(() => {
        api.refs.setReference(referenceElement())
      })

      createEffect(() => {
        api.refs.setFloating(floatingElement())
      })

      return (
        <>
          <div ref={signalRef(referenceElement)} />
          <div ref={signalRef(floatingElement)} />
        </>
      )
    }, container)

    await flush()

    expect(floating!.x()).toBe(0)
    expect(floating!.y()).toBe(0)

    dispose()
  })

  it('syncs with an external reference element source', async () => {
    const referenceElement = createSignal<HTMLElement | null>(null)
    let floating: ReturnType<typeof useFloating> | undefined

    const dispose = render(() => {
      const api = useFloating({
        elements: {
          reference: referenceElement,
        },
      })
      floating = api

      return (
        <>
          <div data-testid="reference" ref={signalRef(referenceElement)} />
          <div ref={api.refs.setFloating} />
        </>
      )
    }, container)

    const reference = container.querySelector('[data-testid="reference"]') as HTMLDivElement
    mockRect(reference, 50, 50)

    await flush()

    expect(floating!.x()).toBe(25)
    expect(floating!.y()).toBe(50)

    dispose()
  })

  it('syncs with an external floating element source', async () => {
    const floatingElement = createSignal<HTMLElement | null>(null)
    let floating: ReturnType<typeof useFloating> | undefined

    const dispose = render(() => {
      const api = useFloating({
        elements: {
          floating: floatingElement,
        },
      })
      floating = api

      return (
        <>
          <div data-testid="reference" ref={api.refs.setReference} />
          <div ref={signalRef(floatingElement)} />
        </>
      )
    }, container)

    const reference = container.querySelector('[data-testid="reference"]') as HTMLDivElement
    mockRect(reference, 50, 50)

    await flush()

    expect(floating!.x()).toBe(25)
    expect(floating!.y()).toBe(50)

    dispose()
  })

  it('syncs with external reference and floating element sources together', async () => {
    const referenceElement = createSignal<HTMLElement | null>(null)
    const floatingElement = createSignal<HTMLElement | null>(null)
    let floating: ReturnType<typeof useFloating> | undefined

    const dispose = render(() => {
      const api = useFloating({
        elements: {
          reference: referenceElement,
          floating: floatingElement,
        },
      })
      floating = api

      return (
        <>
          <div data-testid="reference" ref={signalRef(referenceElement)} />
          <div ref={signalRef(floatingElement)} />
        </>
      )
    }, container)

    const reference = container.querySelector('[data-testid="reference"]') as HTMLDivElement
    mockRect(reference, 50, 50)

    await flush()

    expect(floating!.x()).toBe(25)
    expect(floating!.y()).toBe(50)

    dispose()
  })

  it('keeps external element sync stable before geometry is available', async () => {
    const referenceElement = createSignal<HTMLElement | null>(null)
    const floatingElement = createSignal<HTMLElement | null>(null)
    let floating: ReturnType<typeof useFloating> | undefined

    const dispose = render(() => {
      const api = useFloating({
        elements: {
          reference: referenceElement,
          floating: floatingElement,
        },
      })
      floating = api

      return (
        <>
          <div data-testid="reference" ref={signalRef(referenceElement)} />
          <div ref={signalRef(floatingElement)} />
        </>
      )
    }, container)

    await flush()

    expect(floating!.x()).toBe(0)
    expect(floating!.y()).toBe(0)

    dispose()
  })

  it('applies transform styles by default', async () => {
    const dispose = render(() => {
      const floating = useFloating()

      return (
        <>
          <div data-testid="reference" ref={floating.refs.setReference} />
          <div
            data-testid="floating"
            ref={floating.refs.setFloating}
            style={floating.floatingStyles}
          />
        </>
      )
    }, container)

    const reference = container.querySelector('[data-testid="reference"]') as HTMLDivElement
    const floatingElement = container.querySelector('[data-testid="floating"]') as HTMLDivElement
    mockRect(reference, 50, 50)

    expect(floatingElement.style.position).toBe('absolute')
    expect(floatingElement.style.top).toBe('0px')
    expect(floatingElement.style.left).toBe('0px')
    expect(floatingElement.style.transform).toBe('translate(0px, 0px)')

    await flush()

    expect(floatingElement.style.position).toBe('absolute')
    expect(floatingElement.style.top).toBe('0px')
    expect(floatingElement.style.left).toBe('0px')
    expect(floatingElement.style.transform).toBe('translate(25px, 50px)')

    dispose()
  })

  it('can be used from a root without DOM rendering for imperative consumers', async () => {
    const offsetValue = createSignal(12)
    const reference = {
      getBoundingClientRect() {
        return createRect(40, 20)
      },
    }
    const floatingElement = document.createElement('div')

    const root = createRoot(() => {
      const floating = useFloating({
        middleware: () => [offset(offsetValue())],
        placement: () => 'right',
      })

      floating.refs.setReference(reference)
      floating.refs.setFloating(floatingElement)

      return floating
    })

    root.value.update()
    await flush()

    expect(root.value.x()).toBe(52)

    offsetValue(24)
    await flush()

    expect(root.value.x()).toBe(64)

    root.dispose()
  })
})
