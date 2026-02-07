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
})
