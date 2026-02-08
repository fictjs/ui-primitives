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

  it('toggles trigger aria-expanded and content state', async () => {
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
                  value: 'guides',
                  children: [
                    {
                      type: NavigationMenuTrigger,
                      props: {
                        'data-testid': 'trigger-guides',
                        children: 'Guides',
                      },
                    },
                    {
                      type: NavigationMenuContent,
                      props: {
                        forceMount: true,
                        children: 'Guides content',
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

    const trigger = container.querySelector('[data-testid="trigger-guides"]') as HTMLElement
    const getContent = () => container.querySelector('[data-navigation-menu-content="guides"]')

    expect(trigger.getAttribute('data-state')).toBe('closed')
    expect(getContent()?.getAttribute('data-state')).toBe('closed')

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(trigger.getAttribute('data-state')).toBe('open')
    expect(getContent()?.getAttribute('data-state')).toBe('open')

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(trigger.getAttribute('data-state')).toBe('closed')
    expect(getContent()?.getAttribute('data-state')).toBe('closed')

    dispose()
    container.remove()
  })

  it('supports asChild on item and trigger', async () => {
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
                  value: 'api',
                  asChild: true,
                  children: {
                    type: 'li',
                    props: {
                      'data-testid': 'item-as-child',
                      children: [
                        {
                          type: NavigationMenuTrigger,
                          props: {
                            asChild: true,
                            children: {
                              type: 'span',
                              props: { role: 'button', 'data-testid': 'trigger-as-child', children: 'API' },
                            },
                          },
                        },
                        {
                          type: NavigationMenuContent,
                          props: {
                            children: 'API content',
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="trigger-as-child"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-navigation-menu-content="api"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="item-as-child"]')?.getAttribute('data-navigation-menu-item')).toBe(
      'api',
    )

    dispose()
    container.remove()
  })
})
