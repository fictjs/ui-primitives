import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import {
  PopperAnchor,
  PopperArrow,
  PopperContent,
  PopperRoot,
} from '../../src/components/interaction/popper'

describe('Popper', () => {
  it('renders anchor, content and arrow with placement data', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: PopperRoot,
        props: {
          children: [
            {
              type: PopperAnchor,
              props: {
                children: { type: 'button', props: { children: 'trigger' } },
              },
            },
            {
              type: PopperContent,
              props: {
                side: 'bottom',
                align: 'start',
                children: [
                  { type: 'span', props: { children: 'content' } },
                  { type: PopperArrow, props: { 'data-testid': 'arrow' } },
                ],
              },
            },
          ],
        },
      }),
      container,
    )

    const content = container.querySelector('[data-popper-content]') as HTMLElement | null
    expect(content).not.toBeNull()
    expect(content?.dataset.placement).toContain('bottom')

    const arrow = container.querySelector('[data-testid="arrow"]')
    expect(arrow).not.toBeNull()

    dispose()
    container.remove()
  })
})
