import { describe, expect, it } from 'vitest'

import { Primitive, PrimitiveElements } from '../../src/components/core/primitive'

describe('Primitive', () => {
  it('renders with provided `as` tag', () => {
    const vnode = Primitive({ as: 'button', type: 'button', children: 'Open' }) as {
      type: string
      props: Record<string, unknown>
    }
    expect(vnode.type).toBe('button')
    expect(vnode.props.type).toBe('button')
  })

  it('supports asChild', () => {
    const vnode = Primitive({
      asChild: true,
      class: 'extra',
      children: {
        type: 'a',
        props: { href: '/docs', class: 'base', children: 'Docs' },
      },
    }) as { props: Record<string, unknown> }

    expect(vnode.props.class).toBe('base extra')
  })

  it('exports intrinsic element helpers', () => {
    const vnode = PrimitiveElements.button({ children: 'Click' }) as {
      type: string
      props: Record<string, unknown>
    }
    expect(vnode.type).toBe('button')
    expect(vnode.props.children).toBe('Click')
  })
})
