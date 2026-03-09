/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

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
})
