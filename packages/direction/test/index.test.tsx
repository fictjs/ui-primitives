/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { DirectionProvider, useDirection } from '../src/index.js'

describe('@fictjs/direction', () => {
  it('reads direction from the provider by default', () => {
    let direction: (() => 'ltr' | 'rtl') | undefined

    function Consumer() {
      direction = useDirection()
      return <div />
    }

    render(
      () => (
        <DirectionProvider dir="rtl">
          <Consumer />
        </DirectionProvider>
      ),
      document.createElement('div'),
    )

    expect(direction?.()).toBe('rtl')
  })

  it('prefers an explicit local direction override', () => {
    let direction: (() => 'ltr' | 'rtl') | undefined

    function Consumer() {
      direction = useDirection('ltr')
      return <div />
    }

    render(
      () => (
        <DirectionProvider dir="rtl">
          <Consumer />
        </DirectionProvider>
      ),
      document.createElement('div'),
    )

    expect(direction?.()).toBe('ltr')
  })
})
