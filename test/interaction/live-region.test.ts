import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { Announce, LiveRegionProvider } from '../../src/components/interaction/live-region'

describe('LiveRegion', () => {
  it('announces polite messages', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: LiveRegionProvider,
        props: {
          children: {
            type: Announce,
            props: {
              message: 'Saved successfully',
              politeness: 'polite',
            },
          },
        },
      }),
      container,
    )

    await new Promise(resolve => setTimeout(resolve, 0))

    const region = container.querySelector('[data-live-region="polite"]')
    expect(region?.textContent).toContain('Saved successfully')

    dispose()
    container.remove()
  })
})
