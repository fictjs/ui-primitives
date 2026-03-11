/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useLayoutEffect } from '../src/index.js'

const tick = () =>
  new Promise<void>((resolve) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(resolve)
      return
    }

    void Promise.resolve().then(resolve)
  })

describe('@fictjs/use-layout-effect', () => {
  it('runs the effect and cleanup inside a component root', () => {
    const events: string[] = []
    const container = document.createElement('div')

    function Fixture() {
      useLayoutEffect(() => {
        events.push('effect')
        return () => events.push('cleanup')
      })

      return <div />
    }

    const dispose = render(() => {
      return <Fixture />
    }, container)

    expect(events).toEqual(['effect'])

    dispose()

    expect(events).toEqual(['effect', 'cleanup'])
  })

  it('re-runs once per dependency change without duplicating the effect registration', async () => {
    const count = createSignal(0)
    const events: string[] = []
    const container = document.createElement('div')

    function Fixture() {
      useLayoutEffect(() => {
        const value = count()
        events.push(`effect:${value}`)
        return () => events.push(`cleanup:${value}`)
      })

      return <div>{count()}</div>
    }

    const dispose = render(() => {
      return <Fixture />
    }, container)

    expect(events).toEqual(['effect:0'])

    count(1)
    await tick()
    expect(events).toEqual(['effect:0', 'cleanup:0', 'effect:1'])

    count(2)
    await tick()
    expect(events).toEqual(['effect:0', 'cleanup:0', 'effect:1', 'cleanup:1', 'effect:2'])

    dispose()
    expect(events).toEqual([
      'effect:0',
      'cleanup:0',
      'effect:1',
      'cleanup:1',
      'effect:2',
      'cleanup:2',
    ])
  })
})
