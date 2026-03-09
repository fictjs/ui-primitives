/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { useLayoutEffect } from '../src/index.js'

describe('@fictjs/use-layout-effect', () => {
  it('runs the effect and cleanup inside a component root', () => {
    const events: string[] = []
    const container = document.createElement('div')

    const dispose = render(() => {
      useLayoutEffect(() => {
        events.push('effect')
        return () => events.push('cleanup')
      })

      return <div />
    }, container)

    expect(events).toEqual(['effect'])

    dispose()

    expect(events).toEqual(['effect', 'cleanup'])
  })
})
