/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useControllableState, useControllableStateReducer } from '../src/index.js'

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
      ;[value, setValue] = useControllableState({
        prop: () => controlled(),
        defaultProp: 'fallback',
        onChange,
      })
      return <div />
    }, document.createElement('div'))

    expect(value?.()).toBe('first')
    setValue?.('second')
    expect(value?.()).toBe('first')
    expect(onChange).toHaveBeenCalledWith('second')
  })

  it('treats prop getters as controlled values', () => {
    const controlled = createSignal('first')
    let value: (() => string) | undefined
    let setValue: ((next: string) => void) | undefined
    const onChange = vi.fn()

    render(() => {
      ;[value, setValue] = useControllableState({
        prop: prop(() => controlled()),
        defaultProp: 'fallback',
        onChange,
      })
      return <div />
    }, document.createElement('div'))

    expect(value?.()).toBe('first')

    controlled('second')
    expect(value?.()).toBe('second')

    setValue?.('third')
    expect(value?.()).toBe('second')
    expect(onChange).toHaveBeenCalledWith('third')
  })

  it('unwraps prop getters that return accessors', () => {
    const controlled = createSignal('first')
    let value: (() => string) | undefined
    let setValue: ((next: string) => void) | undefined
    const onChange = vi.fn()

    render(() => {
      ;[value, setValue] = useControllableState({
        prop: prop(() => controlled),
        defaultProp: 'fallback',
        onChange,
      })
      return <div />
    }, document.createElement('div'))

    expect(value?.()).toBe('first')

    controlled('second')
    expect(value?.()).toBe('second')

    setValue?.('third')
    expect(value?.()).toBe('second')
    expect(onChange).toHaveBeenCalledWith('third')
  })

  it('updates reducer state for uncontrolled usage', () => {
    type ReducerState = {
      count: number
      state: string
    }
    type ReducerAction =
      | {
          type: 'increment'
        }
      | {
          type: 'select'
          value: string
        }

    let state: (() => ReducerState) | undefined
    let dispatch: ((action: ReducerAction) => void) | undefined
    const onChange = vi.fn()

    render(() => {
      ;[state, dispatch] = useControllableStateReducer<
        string,
        Omit<ReducerState, 'state'>,
        ReducerAction
      >(
        (prevState, action) => {
          if (action.type === 'increment') {
            return { ...prevState, count: prevState.count + 1 }
          }

          return { ...prevState, state: action.value }
        },
        { defaultProp: 'alpha', onChange },
        { count: 0 },
      )
      return <div />
    }, document.createElement('div'))

    expect(state?.()).toEqual({ count: 0, state: 'alpha' })

    dispatch?.({ type: 'increment' })
    expect(state?.()).toEqual({ count: 1, state: 'alpha' })

    dispatch?.({ type: 'select', value: 'beta' })
    expect(state?.()).toEqual({ count: 1, state: 'beta' })
    expect(onChange).toHaveBeenCalledWith('beta')
  })

  it('emits reducer state changes while preserving controlled value reads', () => {
    type ReducerState = {
      count: number
      state: string
    }
    type ReducerAction =
      | {
          type: 'increment'
        }
      | {
          type: 'select'
          value: string
        }

    const controlled = createSignal('first')
    let state: (() => ReducerState) | undefined
    let dispatch: ((action: ReducerAction) => void) | undefined
    const onChange = vi.fn()

    render(() => {
      ;[state, dispatch] = useControllableStateReducer<
        string,
        Omit<ReducerState, 'state'>,
        ReducerAction
      >(
        (prevState, action) => {
          if (action.type === 'increment') {
            return { ...prevState, count: prevState.count + 1 }
          }

          return { ...prevState, state: action.value }
        },
        { prop: () => controlled(), defaultProp: 'fallback', onChange },
        { count: 0 },
      )
      return <div />
    }, document.createElement('div'))

    dispatch?.({ type: 'increment' })
    expect(state?.()).toEqual({ count: 1, state: 'first' })

    dispatch?.({ type: 'select', value: 'second' })
    expect(state?.()).toEqual({ count: 1, state: 'first' })
    expect(onChange).toHaveBeenCalledWith('second')
  })
})
