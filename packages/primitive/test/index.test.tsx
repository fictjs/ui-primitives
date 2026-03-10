/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import { Primitive, dispatchDiscreteCustomEvent } from '../src/index.js'

describe('@fictjs/primitive', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders intrinsic elements by default', () => {
    const container = document.createElement('div')

    render(() => (
      <Primitive.button data-kind="trigger" type="button">
        Open
      </Primitive.button>
    ), container)

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.dataset.kind).toBe('trigger')
    expect(button?.textContent).toBe('Open')
  })

  it('supports asChild composition through slot', () => {
    const container = document.createElement('div')

    render(() => (
      <Primitive.button asChild data-kind="trigger">
        <a href="/docs">Docs</a>
      </Primitive.button>
    ), container)

    const link = container.querySelector('a')
    expect(link).not.toBeNull()
    expect(link?.dataset.kind).toBe('trigger')
    expect(link?.getAttribute('href')).toBe('/docs')
  })

  it('forwards refs to the rendered DOM element and cleans them up on unmount', () => {
    const calls: Array<string | null> = []
    const container = document.createElement('div')

    const dispose = render(() => (
      <Primitive.button
        ref={(node) => {
          calls.push(node?.tagName ?? null)
        }}
      >
        Open
      </Primitive.button>
    ), container)

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
