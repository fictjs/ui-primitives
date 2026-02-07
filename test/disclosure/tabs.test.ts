import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from '../../src/components/disclosure/tabs'

describe('Tabs', () => {
  it('switches tab content when trigger is clicked', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: TabsRoot,
        props: {
          defaultValue: 'tab-a',
          children: [
            {
              type: TabsList,
              props: {
                children: [
                  { type: TabsTrigger, props: { value: 'tab-a', 'data-testid': 'tab-a', children: 'A' } },
                  { type: TabsTrigger, props: { value: 'tab-b', 'data-testid': 'tab-b', children: 'B' } },
                ],
              },
            },
            { type: TabsContent, props: { value: 'tab-a', children: 'Panel A' } },
            { type: TabsContent, props: { value: 'tab-b', children: 'Panel B' } },
          ],
        },
      }),
      container,
    )

    expect(container.textContent).toContain('Panel A')
    expect(container.textContent).not.toContain('Panel B')

    fireEvent.click(container.querySelector('[data-testid="tab-b"]') as HTMLElement)
    await Promise.resolve()

    expect(container.textContent).toContain('Panel B')

    dispose()
    container.remove()
  })
})
