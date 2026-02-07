import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
} from '../../src/components/disclosure/navigation-menu'

describe('NavigationMenu', () => {
  it('opens item content on trigger click', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: NavigationMenuRoot,
        props: {
          children: {
            type: NavigationMenuList,
            props: {
              children: {
                type: NavigationMenuItem,
                props: {
                  value: 'docs',
                  children: [
                    {
                      type: NavigationMenuTrigger,
                      props: {
                        'data-testid': 'trigger',
                        children: 'Docs',
                      },
                    },
                    {
                      type: NavigationMenuContent,
                      props: {
                        children: 'Docs content',
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      }),
      container,
    )

    expect(container.querySelector('[data-navigation-menu-content="docs"]')).toBeNull()

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-navigation-menu-content="docs"]')).not.toBeNull()

    dispose()
    container.remove()
  })
})
