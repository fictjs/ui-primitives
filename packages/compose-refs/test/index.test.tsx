/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createRef, render } from '@fictjs/runtime'

import { composeRefs, useComposedRefs } from '../src/index.js'

describe('@fictjs/compose-refs', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('assigns callback refs and ref objects together', () => {
    const container = document.createElement('div')
    const objectRef = createRef<HTMLDivElement>()
    const callbackRef = vi.fn()
    const refs = composeRefs<HTMLDivElement>(objectRef, callbackRef)

    const dispose = render(() => <div ref={refs} />, container)
    const node = container.firstElementChild as HTMLDivElement

    expect(objectRef.current).toBe(node)
    expect(callbackRef).toHaveBeenCalledWith(node)

    dispose()

    expect(objectRef.current).toBeNull()
    expect(callbackRef).toHaveBeenLastCalledWith(null)
  })

  it('returns a callback from useComposedRefs for component usage', () => {
    const container = document.createElement('div')
    const objectRef = createRef<HTMLDivElement>()

    function Example() {
      const refs = useComposedRefs<HTMLDivElement>(objectRef)
      return <div ref={refs} />
    }

    const dispose = render(() => <Example />, container)
    expect(objectRef.current).toBe(container.firstElementChild)
    dispose()
    expect(objectRef.current).toBeNull()
  })
})
