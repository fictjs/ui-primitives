import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
} from '../../src/components/disclosure/collapsible'

describe('Collapsible', () => {
  it('toggles content visibility', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: CollapsibleRoot,
        props: {
          children: [
            { type: CollapsibleTrigger, props: { 'data-testid': 'trigger', children: 'Toggle' } },
            {
              type: CollapsibleContent,
              props: {
                children: 'Hidden content',
              },
            },
          ],
        },
      }),
      container,
    )

    expect(container.querySelector('[data-collapsible-content]')).toBeNull()

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-collapsible-content]')).not.toBeNull()

    dispose()
    container.remove()
  })
})
