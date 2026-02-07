import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import {
  HoverCardContent,
  HoverCardRoot,
  HoverCardTrigger,
} from '../../src/components/overlay/hover-card'

describe('HoverCard', () => {
  it('renders content when controlled open=true', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: HoverCardRoot,
        props: {
          open: true,
          children: [
            { type: HoverCardTrigger, props: { 'data-testid': 'trigger', children: 'Profile' } },
            {
              type: HoverCardContent,
              props: {
                portal: false,
                children: 'Hover profile',
              },
            },
          ],
        },
      }),
      container,
    )

    await Promise.resolve()

    expect(container.querySelector('[data-hover-card-content]')).not.toBeNull()

    dispose()
    container.remove()
  })
})
