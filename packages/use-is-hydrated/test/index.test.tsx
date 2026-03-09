/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { useIsHydrated } from '../src/index.js'

function tick(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(resolve)
      return
    }

    Promise.resolve().then(resolve)
  })
}

describe('@fictjs/use-is-hydrated', () => {
  it('flips to true after mount', async () => {
    let hydrated: (() => boolean) | undefined

    render(() => {
      hydrated = useIsHydrated()
      return <div />
    }, document.createElement('div'))

    expect(hydrated?.()).toBe(false)

    await tick()

    expect(hydrated?.()).toBe(true)
  })
})
