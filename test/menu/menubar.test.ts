import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRoot,
  MenubarTrigger,
} from '../../src/components/menu/menubar'

describe('Menubar', () => {
  it('opens menu content when trigger is clicked', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: MenubarRoot,
        props: {
          children: {
            type: MenubarMenu,
            props: {
              value: 'file',
              children: [
                { type: MenubarTrigger, props: { 'data-testid': 'trigger', children: 'File' } },
                {
                  type: MenubarContent,
                  props: {
                    children: {
                      type: MenubarItem,
                      props: { children: 'New' },
                    },
                  },
                },
              ],
            },
          },
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-menubar-content="file"]')).not.toBeNull()

    dispose()
    container.remove()
  })
})
