/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { usePrevious } from '../src/index.js'

function tick(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(resolve)
      return
    }

    Promise.resolve().then(resolve)
  })
}

describe('@fictjs/use-previous', () => {
  it('tracks the last resolved value from an accessor', async () => {
    const count = createSignal(1)
    let previous: (() => number | undefined) | undefined

    render(() => {
      previous = usePrevious(() => count())
      return <div />
    }, document.createElement('div'))

    expect(previous?.()).toBeUndefined()

    count(2)
    await tick()
    expect(previous?.()).toBe(1)

    count(3)
    await tick()
    expect(previous?.()).toBe(2)
  })
})
