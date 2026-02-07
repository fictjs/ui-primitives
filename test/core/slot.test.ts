import { describe, expect, it, vi } from 'vitest'

import { Slot } from '../../src/components/core/slot'

describe('Slot', () => {
  it('returns non-vnode child unchanged', () => {
    expect(Slot({ children: 'hello' })).toBe('hello')
  })

  it('merges props into child vnode', () => {
    const child = {
      type: 'button',
      props: {
        type: 'button',
        class: 'base',
      },
    }

    const vnode = Slot({ children: child, class: 'extra', 'data-x': '1' }) as {
      type: string
      props: Record<string, unknown>
    }

    expect(vnode.type).toBe('button')
    expect(vnode.props.class).toBe('base extra')
    expect(vnode.props['data-x']).toBe('1')
  })

  it('composes event handlers', () => {
    const childClick = vi.fn()
    const slotClick = vi.fn()

    const vnode = Slot({
      children: {
        type: 'button',
        props: {
          onClick: childClick,
        },
      },
      onClick: slotClick,
    }) as unknown as { props: { onClick: (event: Event) => void } }

    vnode.props.onClick(new Event('click'))

    expect(childClick).toHaveBeenCalledTimes(1)
    expect(slotClick).toHaveBeenCalledTimes(1)
  })
})
