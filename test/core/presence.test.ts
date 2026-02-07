import { describe, expect, it } from 'vitest'

import { Presence } from '../../src/components/core/presence'

describe('Presence', () => {
  it('renders child when present', () => {
    const view = Presence({ present: true, children: 'content' })
    expect(view()).toBe('content')
  })

  it('returns null when not present and not force mounted', () => {
    const view = Presence({ present: false, children: 'content' })
    expect(view()).toBe(null)
  })

  it('supports render function child', () => {
    const view = Presence({
      present: false,
      forceMount: true,
      children: ({ present }) => (present ? 'on' : 'off'),
    })

    expect(view()).toBe('off')
  })
})
