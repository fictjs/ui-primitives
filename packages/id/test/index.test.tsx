/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useId } from '../src/index.js'

describe('@fictjs/id', () => {
  it('creates unique generated ids', () => {
    let first: (() => string) | undefined
    let second: (() => string) | undefined

    render(() => {
      first = useId()
      second = useId()
      return <div />
    }, document.createElement('div'))

    expect(first?.()).toMatch(/^fict-/)
    expect(second?.()).toMatch(/^fict-/)
    expect(first?.()).not.toBe(second?.())
  })

  it('prefers an explicit id when provided', () => {
    let explicit: (() => string) | undefined

    render(() => {
      explicit = useId('custom-id')
      return <div />
    }, document.createElement('div'))

    expect(explicit?.()).toBe('custom-id')
  })

  it('generates an id when an accessor returns undefined', () => {
    let resolved: (() => string) | undefined

    render(() => {
      resolved = useId(() => undefined)
      return <div />
    }, document.createElement('div'))

    expect(resolved?.()).toMatch(/^fict-/)
  })

  it('falls back to its generated id when a determined id becomes undefined', async () => {
    const determinedId = createSignal<string | undefined>('custom-id')
    let resolved: (() => string) | undefined

    render(() => {
      resolved = useId(() => determinedId())
      return <div />
    }, document.createElement('div'))

    expect(resolved?.()).toBe('custom-id')

    determinedId(undefined)
    await Promise.resolve()

    expect(resolved?.()).toMatch(/^fict-/)
  })
})
