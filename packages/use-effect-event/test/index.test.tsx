/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useEffectEvent } from '../src/index.js'

describe('@fictjs/use-effect-event', () => {
  it('returns a callable wrapper around the latest callback ref', () => {
    const logs: string[] = []
    let handler: ((value: string) => void) | undefined

    render(() => {
      handler = useEffectEvent((value: string) => {
        logs.push(value)
      })

      return <div />
    }, document.createElement('div'))

    handler?.('ready')

    expect(logs).toEqual(['ready'])
  })

  it('keeps its identity while invoking the latest reactive callback accessor', () => {
    const calls: string[] = []
    const callback = createSignal<((value: string) => void) | undefined>((value) => {
      calls.push(`first:${value}`)
    })
    let handler: ((value: string) => void) | undefined
    let initialHandler: ((value: string) => void) | undefined

    render(() => {
      handler = useEffectEvent<(value: string) => void>(callback)
      initialHandler = handler
      return <div />
    }, document.createElement('div'))

    handler?.('one')
    callback((value) => calls.push(`second:${value}`))
    handler?.('two')
    callback(undefined)
    handler?.('ignored')

    expect(handler).toBe(initialHandler)
    expect(calls).toEqual(['first:one', 'second:two'])
  })

  it('reads a replaced handler from real Fict component props', () => {
    const calls: string[] = []
    const callback = createSignal<(value: string) => void>((value) => calls.push(`first:${value}`))
    let handler: ((value: string) => void) | undefined
    let initialHandler: ((value: string) => void) | undefined

    function Consumer(props: { onEvent?: (value: string) => void }) {
      handler = useEffectEvent(prop(() => props.onEvent))
      initialHandler = handler
      return <div />
    }

    render(() => <Consumer onEvent={prop(() => callback())} />, document.createElement('div'))

    handler?.('one')
    callback((value) => calls.push(`second:${value}`))
    handler?.('two')

    expect(handler).toBe(initialHandler)
    expect(calls).toEqual(['first:one', 'second:two'])
  })
})
