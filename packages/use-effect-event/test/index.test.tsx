/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

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
})
