import { describe, expect, it } from 'vitest'

import { ariaAttr, composeEventHandlers, createPrimitiveId, dataAttr } from '../src/index.js'

describe('@fictjs/ui-primitives', () => {
  it('composes handlers while respecting defaultPrevented by default', () => {
    const calls: string[] = []
    const event = { defaultPrevented: false }

    const handler = composeEventHandlers(
      (nextEvent) => {
        calls.push('first')
        nextEvent.defaultPrevented = true
      },
      () => {
        calls.push('second')
      },
    )

    handler(event)

    expect(calls).toEqual(['first'])
  })

  it('can bypass defaultPrevented checks when requested', () => {
    const calls: string[] = []
    const event = { defaultPrevented: false }

    const handler = composeEventHandlers(
      (nextEvent) => {
        calls.push('first')
        nextEvent.defaultPrevented = true
      },
      () => {
        calls.push('second')
      },
      { checkDefaultPrevented: false },
    )

    handler(event)

    expect(calls).toEqual(['first', 'second'])
  })

  it('maps boolean state to data and aria attributes', () => {
    expect(dataAttr(true)).toBe('')
    expect(dataAttr(false)).toBeUndefined()
    expect(ariaAttr(true)).toBe(true)
    expect(ariaAttr(false)).toBeUndefined()
    expect(ariaAttr('mixed')).toBe('mixed')
  })

  it('creates stable primitive ids from arbitrary segments', () => {
    expect(createPrimitiveId('Dialog Root', 'Trigger', 'User Menu')).toBe(
      'dialog-root:trigger:user-menu',
    )
    expect(createPrimitiveId('Popover', 'Content', 42)).toBe('popover:content:42')
  })
})
