/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

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
})
