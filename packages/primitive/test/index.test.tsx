/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { mergeProps, onMount, prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Primitive, dispatchDiscreteCustomEvent } from '../src/index.js'

describe('@fictjs/primitive', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders intrinsic elements by default', () => {
    const container = document.createElement('div')

    render(
      () => (
        <Primitive.button data-kind="trigger" type="button">
          Open
        </Primitive.button>
      ),
      container,
    )

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.dataset.kind).toBe('trigger')
    expect(button?.textContent).toBe('Open')
  })

  it('supports asChild composition through slot', () => {
    const container = document.createElement('div')

    render(
      () => (
        <Primitive.button asChild data-kind="trigger">
          <a href="/docs">Docs</a>
        </Primitive.button>
      ),
      container,
    )

    const link = container.querySelector('a')
    expect(link).not.toBeNull()
    expect(link?.dataset.kind).toBe('trigger')
    expect(link?.getAttribute('href')).toBe('/docs')
  })

  it('resolves accessor-backed asChild synchronously and mounts descendants when connected', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const asChild = createSignal(false)
    const mountedWhileConnected: boolean[] = []
    let child: HTMLAnchorElement | null = null

    const Child = () => {
      onMount(() => {
        mountedWhileConnected.push(child?.isConnected ?? false)
      })

      return (
        <a
          ref={(node) => {
            child = node
          }}
          href="/docs"
        >
          Docs
        </a>
      )
    }

    const dispose = render(
      () => (
        <Primitive.button
          asChild={prop(() => asChild()) as unknown as boolean}
          data-kind="trigger"
          type="button"
        >
          <Child />
        </Primitive.button>
      ),
      container,
    )

    const button = container.querySelector('button')
    expect(container.childNodes).toHaveLength(1)
    expect(button?.querySelector('a')).toBe(child)
    expect(mountedWhileConnected).toEqual([true])

    asChild(true)
    await Promise.resolve()

    expect(container.querySelector('button')).toBe(button)
    expect(container.querySelector('a')).toBe(child)
    expect(mountedWhileConnected).toEqual([true])

    dispose()
  })

  it('preserves a slotted element when unrelated props change', async () => {
    const container = document.createElement('div')
    const expanded = createSignal(false)
    const ForwardedPrimitive = (props: Parameters<typeof Primitive.button>[0]) =>
      Primitive.button(
        mergeProps(prop(() => props as unknown as Record<string, unknown>)) as Parameters<
          typeof Primitive.button
        >[0],
      )

    const dispose = render(
      () => (
        <ForwardedPrimitive
          asChild
          aria-expanded={prop(() => String(expanded())) as unknown as boolean}
        >
          <button type="button">Open</button>
        </ForwardedPrimitive>
      ),
      container,
    )

    const button = container.querySelector('button')
    expect(container.childNodes).toHaveLength(1)
    expect(button?.getAttribute('aria-expanded')).toBe('false')

    expanded(true)
    await Promise.resolve()

    expect(container.querySelector('button')).toBe(button)
    expect(button?.getAttribute('aria-expanded')).toBe('true')

    dispose()
  })

  it('forwards refs to the rendered DOM element and cleans them up on unmount', () => {
    const calls: Array<string | null> = []
    const container = document.createElement('div')

    const dispose = render(
      () => (
        <Primitive.button
          ref={(node) => {
            calls.push(node?.tagName ?? null)
          }}
        >
          Open
        </Primitive.button>
      ),
      container,
    )

    expect(calls).toEqual(['BUTTON'])

    dispose()

    expect(calls).toEqual(['BUTTON', null])
  })

  it('dispatches custom events immediately', () => {
    const target = document.createElement('button')
    const handleCustomEvent = vi.fn()
    target.addEventListener('fict-custom', handleCustomEvent as EventListener)

    dispatchDiscreteCustomEvent(target, new CustomEvent('fict-custom'))

    expect(handleCustomEvent).toHaveBeenCalledTimes(1)
  })
})
