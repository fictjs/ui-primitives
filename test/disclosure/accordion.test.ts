import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  AccordionContent,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '../../src/components/disclosure/accordion'

describe('Accordion', () => {
  it('opens item content on trigger click', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: AccordionRoot,
        props: {
          type: 'single',
          children: {
            type: AccordionItem,
            props: {
              value: 'a',
              children: [
                { type: AccordionTrigger, props: { 'data-testid': 'trigger', children: 'Section A' } },
                { type: AccordionContent, props: { children: 'Panel A' } },
              ],
            },
          },
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
