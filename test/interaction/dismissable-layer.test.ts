import { describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import { DismissableLayer } from '../../src/components/interaction/dismissable-layer'

describe('DismissableLayer', () => {
  it('calls onDismiss when escape is pressed', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const onDismiss = vi.fn()

    const dispose = render(
      () => ({
        type: DismissableLayer,
        props: {
          onDismiss,
          children: { type: 'div', props: { children: 'layer' } },
        },
      }),
      container,
    )

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(onDismiss).toHaveBeenCalledTimes(1)

    dispose()
    container.remove()
  })

  it('calls onDismiss when pointer down occurs outside', () => {
    const root = document.createElement('div')
    const outside = document.createElement('button')
    document.body.appendChild(root)
    document.body.appendChild(outside)
    const onDismiss = vi.fn()

    const dispose = render(
      () => ({
        type: DismissableLayer,
        props: {
          onDismiss,
          children: { type: 'div', props: { children: 'layer' } },
        },
      }),
      root,
    )

    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))

    expect(onDismiss).toHaveBeenCalledTimes(1)

    dispose()
    root.remove()
    outside.remove()
  })
})
