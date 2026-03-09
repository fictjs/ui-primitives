/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useControllableState } from '../src/index.js'

describe('@fictjs/use-controllable-state', () => {
  it('updates uncontrolled state and emits changes', () => {
    let value: (() => string) | undefined
    let setValue: ((next: string) => void) | undefined
    const onChange = vi.fn()

    render(() => {
      ;[value, setValue] = useControllableState({ defaultProp: 'alpha', onChange })
      return <div />
    }, document.createElement('div'))

    expect(value?.()).toBe('alpha')
    setValue?.('beta')
    expect(value?.()).toBe('beta')
    expect(onChange).toHaveBeenCalledWith('beta')
  })

  it('treats defined prop values as controlled', () => {
    const controlled = createSignal('first')
    let value: (() => string) | undefined
    let setValue: ((next: string) => void) | undefined
    const onChange = vi.fn()

    render(() => {
      ;[value, setValue] = useControllableState({ prop: () => controlled(), defaultProp: 'fallback', onChange })
      return <div />
    }, document.createElement('div'))

    expect(value?.()).toBe('first')
    setValue?.('second')
    expect(value?.()).toBe('first')
    expect(onChange).toHaveBeenCalledWith('second')
  })
})
