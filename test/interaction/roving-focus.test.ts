import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import {
  RovingFocusGroup,
  RovingFocusItem,
} from '../../src/components/interaction/roving-focus'

describe('RovingFocusGroup', () => {
  it('assigns initial roving tabIndex state', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: RovingFocusGroup,
        props: {
          children: [
            { type: RovingFocusItem, props: { 'data-testid': 'a', children: 'A' } },
            { type: RovingFocusItem, props: { 'data-testid': 'b', children: 'B' } },
          ],
        },
      }),
      container,
    )

    const first = container.querySelector('[data-testid="a"]') as HTMLButtonElement
    const second = container.querySelector('[data-testid="b"]') as HTMLButtonElement

    await Promise.resolve()
    expect(first.tabIndex).toBe(0)
    expect(second.tabIndex).toBe(-1)

    dispose()
    container.remove()
  })

  it('supports asChild composition for roving items', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: RovingFocusGroup,
        props: {
          children: [
            {
              type: RovingFocusItem,
              props: {
                asChild: true,
                children: {
                  type: 'span',
                  props: { role: 'button', 'data-testid': 'roving-a', children: 'A' },
                },
              },
            },
            {
              type: RovingFocusItem,
              props: {
                asChild: true,
                children: {
                  type: 'span',
                  props: { role: 'button', 'data-testid': 'roving-b', children: 'B' },
                },
              },
            },
          ],
        },
      }),
      container,
    )

    const first = container.querySelector('[data-testid="roving-a"]') as HTMLElement
    const second = container.querySelector('[data-testid="roving-b"]') as HTMLElement

    await Promise.resolve()
    expect(first.tabIndex).toBe(0)
    expect(second.tabIndex).toBe(-1)

    dispose()
    container.remove()
  })
})
