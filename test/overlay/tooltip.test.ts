import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

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

  it('opens on hover and closes on leave', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: TooltipProvider,
        props: {
          delayDuration: 0,
          children: {
            type: TooltipRoot,
            props: {
              children: [
                { type: TooltipTrigger, props: { 'data-testid': 'trigger-hover', children: 'Info' } },
                {
                  type: TooltipContent,
                  props: {
                    portal: false,
                    children: 'Tooltip hover content',
                  },
                },
              ],
            },
          },
        },
      }),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger-hover"]') as HTMLElement
    fireEvent.mouseOver(trigger)
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(container.querySelector('[data-tooltip-content]')).not.toBeNull()

    fireEvent.mouseOut(trigger)
    await Promise.resolve()

    expect(container.querySelector('[data-tooltip-content]')).toBeNull()

    dispose()
    container.remove()
  })
})
