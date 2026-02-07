import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from '../../src/components/overlay/popover'

describe('Popover', () => {
  it('toggles content visibility via trigger', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: PopoverRoot,
        props: {
          children: [
            { type: PopoverTrigger, props: { 'data-testid': 'trigger', children: 'Open' } },
            {
              type: PopoverContent,
              props: {
                portal: false,
                children: 'Popover Body',
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-popover-content]')).not.toBeNull()

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-popover-content]')).toBeNull()

    dispose()
    container.remove()
  })
})
