import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '../../src/components/menu/dropdown-menu'

describe('DropdownMenu', () => {
  it('opens via trigger and closes on item select', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: DropdownMenuRoot,
        props: {
          children: [
            { type: DropdownMenuTrigger, props: { 'data-testid': 'trigger', children: 'Menu' } },
            {
              type: DropdownMenuContent,
              props: {
                portal: false,
                children: {
                  type: DropdownMenuItem,
                  props: { 'data-testid': 'item', children: 'Item A' },
                },
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-dropdown-menu-content]')).not.toBeNull()

    fireEvent.click(container.querySelector('[data-testid="item"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-dropdown-menu-content]')).toBeNull()

    dispose()
    container.remove()
  })
})
