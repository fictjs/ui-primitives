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

  it('only dismisses the top-most layer on escape', () => {
    const rootA = document.createElement('div')
    const rootB = document.createElement('div')
    document.body.appendChild(rootA)
    document.body.appendChild(rootB)

    const onDismissA = vi.fn()
    const onDismissB = vi.fn()

    const disposeA = render(
      () => ({
        type: DismissableLayer,
        props: {
          onDismiss: onDismissA,
          children: { type: 'div', props: { children: 'layer-a' } },
        },
      }),
      rootA,
    )

    const disposeB = render(
      () => ({
        type: DismissableLayer,
        props: {
          onDismiss: onDismissB,
          children: { type: 'div', props: { children: 'layer-b' } },
        },
      }),
      rootB,
    )

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(onDismissA).toHaveBeenCalledTimes(0)
    expect(onDismissB).toHaveBeenCalledTimes(1)

    disposeA()
    disposeB()
    rootA.remove()
    rootB.remove()
  })
})
