import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '../../src/components/overlay/tooltip'

describe('Tooltip', () => {
  it('renders content when controlled open=true', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: TooltipProvider,
        props: {
          children: {
            type: TooltipRoot,
            props: {
              open: true,
              children: [
                { type: TooltipTrigger, props: { 'data-testid': 'trigger', children: 'Info' } },
                {
                  type: TooltipContent,
                  props: {
                    portal: false,
                    children: 'Tooltip text',
                  },
                },
              ],
            },
          },
        },
      }),
      container,
    )

    await Promise.resolve()

    expect(container.querySelector('[data-tooltip-content]')).not.toBeNull()

    dispose()
    container.remove()
  })
})
