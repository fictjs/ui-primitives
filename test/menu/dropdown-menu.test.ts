import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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

  it('toggles checkbox item without closing menu by default', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const checkedChanges: boolean[] = []

    const dispose = render(
      () => ({
        type: DropdownMenuRoot,
        props: {
          defaultOpen: true,
          children: {
            type: DropdownMenuContent,
            props: {
              portal: false,
              children: {
                type: DropdownMenuCheckboxItem,
                props: {
                  'data-testid': 'checkbox-item',
                  children: 'Pin',
                  onCheckedChange: (next: boolean) => checkedChanges.push(next),
                },
              },
            },
          },
        },
      }),
      container,
    )

    const checkboxItem = container.querySelector('[data-testid="checkbox-item"]') as HTMLElement
    fireEvent.click(checkboxItem)
    await Promise.resolve()

    expect(checkedChanges).toEqual([true])
    expect(container.querySelector('[data-dropdown-menu-content]')).not.toBeNull()

    dispose()
    container.remove()
  })

  it('selects radio item and keeps menu open', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const valueChanges: string[] = []

    const dispose = render(
      () => ({
        type: DropdownMenuRoot,
        props: {
          defaultOpen: true,
          children: {
            type: DropdownMenuContent,
            props: {
              portal: false,
              children: {
                type: DropdownMenuRadioGroup,
                props: {
                  defaultValue: 'a',
                  onValueChange: (next: string) => valueChanges.push(next),
                  children: [
                    { type: DropdownMenuRadioItem, props: { value: 'a', children: 'A' } },
                    { type: DropdownMenuRadioItem, props: { value: 'b', 'data-testid': 'b', children: 'B' } },
                  ],
                },
              },
            },
          },
        },
      }),
      container,
    )

    const itemB = container.querySelector('[data-testid="b"]') as HTMLElement
    fireEvent.click(itemB)
    await Promise.resolve()

    expect(valueChanges).toEqual(['b'])
    expect(container.querySelector('[data-dropdown-menu-content]')).not.toBeNull()

    dispose()
    container.remove()
  })
})
