/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useEscapeKeydown } from '../src/index.js'

describe('@fictjs/use-escape-keydown', () => {
  it('invokes the handler for Escape only', () => {
    const onEscape = vi.fn()
    const container = document.createElement('div')

    const dispose = render(() => {
      useEscapeKeydown(onEscape, document)
      return <div />
    }, container)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(onEscape).toHaveBeenCalledTimes(1)

    dispose()
  })

  it('invokes the latest handler supplied through real component props', () => {
    const calls: string[] = []
    const onEscape = createSignal<(event: KeyboardEvent) => void>(() => calls.push('first'))
    const container = document.createElement('div')

    function Consumer(props: { onEscape?: (event: KeyboardEvent) => void }) {
      useEscapeKeydown(
        prop(() => props.onEscape),
        document,
      )
      return <div />
    }

    const dispose = render(() => <Consumer onEscape={prop(() => onEscape())} />, container)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    onEscape(() => calls.push('second'))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(calls).toEqual(['first', 'second'])

    dispose()
  })
})
