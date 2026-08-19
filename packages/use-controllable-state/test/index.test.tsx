/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useControllableState, useControllableStateReducer } from '../src/index.js'

describe('@fictjs/use-controllable-state', () => {
  it('warns when usage changes between uncontrolled and controlled', async () => {
    const controlled = createSignal<string | undefined>(undefined)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(() => {
      useControllableState({
        prop: () => controlled(),
        defaultProp: 'fallback',
        caller: 'Example',
      })
      return <div />
    }, document.createElement('div'))

    controlled('controlled')
    await Promise.resolve()

    expect(warn).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledWith(
      'Example is changing from uncontrolled to controlled. Components should stay either controlled or uncontrolled for their lifetime.',
    )
    warn.mockRestore()
  })

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

  it('emits to the latest handler supplied through real component props', () => {
    const calls: string[] = []
    const onChange = createSignal<(value: string) => void>((value) => {
      calls.push(`first:${value}`)
    })
    let setValue: ((next: string) => void) | undefined

    function Consumer(props: { onChange?: (value: string) => void }) {
      ;[, setValue] = useControllableState({
        defaultProp: 'alpha',
        onChange: prop(() => props.onChange),
      })
      return <div />
    }

    render(() => <Consumer onChange={prop(() => onChange())} />, document.createElement('div'))

    setValue?.('beta')
    onChange((value) => calls.push(`second:${value}`))
    setValue?.('gamma')

    expect(calls).toEqual(['first:beta', 'second:gamma'])
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

  it('reads a controlled prop once per state update', () => {
    let reads = 0
    let setValue: ((next: string) => void) | undefined

    render(() => {
      ;[, setValue] = useControllableState({
        prop: () => {
          reads += 1
          return 'first'
        },
        defaultProp: 'fallback',
      })
      return <div />
    }, document.createElement('div'))

    reads = 0
    setValue?.('second')

    expect(reads).toBe(1)
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

  it('emits reducer changes to the latest reactive handler', () => {
    type ReducerState = { count: number; state: string }
    type ReducerAction = { type: 'select'; value: string }
    const calls: string[] = []
    const onChange = createSignal<(value: string) => void>((value) => {
      calls.push(`first:${value}`)
    })
    let dispatch: ((action: ReducerAction) => void) | undefined

    function Consumer(props: { onChange?: (value: string) => void }) {
      ;[, dispatch] = useControllableStateReducer<
        string,
        Omit<ReducerState, 'state'>,
        ReducerAction
      >(
        (state, action) => ({ ...state, state: action.value }),
        {
          defaultProp: 'alpha',
          onChange: prop(() => props.onChange),
        },
        { count: 0 },
      )
      return <div />
    }

    render(() => <Consumer onChange={prop(() => onChange())} />, document.createElement('div'))

    dispatch?.({ type: 'select', value: 'beta' })
    onChange((value) => calls.push(`second:${value}`))
    dispatch?.({ type: 'select', value: 'gamma' })

    expect(calls).toEqual(['first:beta', 'second:gamma'])
  })

  it('warns when reducer usage changes between controlled and uncontrolled', async () => {
    type ReducerAction = { type: 'noop' }
    const controlled = createSignal<string | undefined>('controlled')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(() => {
      useControllableStateReducer<string, Record<string, never>, ReducerAction>(
        (state) => state,
        {
          prop: () => controlled(),
          defaultProp: 'fallback',
          caller: 'ReducerExample',
        },
        {},
      )
      return <div />
    }, document.createElement('div'))

    controlled(undefined)
    await Promise.resolve()

    expect(warn).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledWith(
      'ReducerExample is changing from controlled to uncontrolled. Components should stay either controlled or uncontrolled for their lifetime.',
    )
    warn.mockRestore()
  })
})
