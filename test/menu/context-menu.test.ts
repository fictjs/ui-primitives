import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRoot,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '../../src/components/menu/context-menu'

describe('ContextMenu', () => {
  it('supports asChild trigger and item composition', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: ContextMenuRoot,
        props: {
          children: [
            {
              type: ContextMenuTrigger,
              props: {
                asChild: true,
                children: {
                  type: 'section',
                  props: {
                    'data-testid': 'trigger-as-child',
                    children: 'Area',
                  },
                },
              },
            },
            {
              type: ContextMenuContent,
              props: {
                portal: false,
                children: {
                  type: ContextMenuItem,
                  props: {
                    asChild: true,
                    children: {
                      type: 'a',
                      props: { href: '#', 'data-testid': 'item-as-child', children: 'Delete' },
                    },
                  },
                },
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.contextMenu(container.querySelector('[data-testid="trigger-as-child"]') as HTMLElement, {
      clientX: 32,
      clientY: 24,
    })
    await Promise.resolve()
    expect(container.querySelector('[data-context-menu-content]')).not.toBeNull()

    fireEvent.click(container.querySelector('[data-testid="item-as-child"]') as HTMLElement)
    await Promise.resolve()
    expect(container.querySelector('[data-context-menu-content]')).toBeNull()

    dispose()
    container.remove()
  })

  it('opens on contextmenu event', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: ContextMenuRoot,
        props: {
          children: [
            {
              type: ContextMenuTrigger,
              props: { 'data-testid': 'trigger', children: 'Right click area' },
            },
            {
              type: ContextMenuContent,
              props: {
                portal: false,
                children: {
                  type: ContextMenuItem,
                  props: { children: 'Delete' },
                },
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.contextMenu(container.querySelector('[data-testid="trigger"]') as HTMLElement, {
      clientX: 120,
      clientY: 80,
    })
    await Promise.resolve()

    const content = container.querySelector('[data-context-menu-content]') as HTMLElement | null
    expect(content).not.toBeNull()
    expect(content?.style.left).toBe('120px')
    expect(content?.style.top).toBe('80px')

    dispose()
    container.remove()
  })

  it('exposes onPointerDownOutside and allows preventing dismissal', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    let called = false

    const dispose = render(
      () => ({
        type: ContextMenuRoot,
        props: {
          children: [
            {
              type: ContextMenuTrigger,
              props: { 'data-testid': 'outside-trigger', children: 'Right click area' },
            },
            {
              type: ContextMenuContent,
              props: {
                portal: false,
                onPointerDownOutside: (event: PointerEvent) => {
                  called = true
                  event.preventDefault()
                },
                children: {
                  type: ContextMenuItem,
                  props: { children: 'Delete' },
                },
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.contextMenu(container.querySelector('[data-testid="outside-trigger"]') as HTMLElement, {
      clientX: 120,
      clientY: 80,
    })
    await Promise.resolve()

    fireEvent.pointerDown(document.body)
    await Promise.resolve()

    expect(called).toBe(true)
    expect(container.querySelector('[data-context-menu-content]')).not.toBeNull()

    dispose()
    container.remove()
  })

  it('supports nested submenu interactions', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: ContextMenuRoot,
        props: {
          children: [
            {
              type: ContextMenuTrigger,
              props: { 'data-testid': 'submenu-root-trigger', children: 'Right click area' },
            },
            {
              type: ContextMenuContent,
              props: {
                portal: false,
                children: {
                  type: ContextMenuSub,
                  props: {
                    children: [
                      {
                        type: ContextMenuSubTrigger,
                        props: {
                          'data-testid': 'submenu-trigger',
                          children: 'More',
                        },
                      },
                      {
                        type: ContextMenuSubContent,
                        props: {
                          portal: false,
                          children: {
                            type: ContextMenuItem,
                            props: {
                              'data-testid': 'submenu-item',
                              children: 'Duplicate',
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.contextMenu(container.querySelector('[data-testid="submenu-root-trigger"]') as HTMLElement, {
      clientX: 64,
      clientY: 40,
    })
    await Promise.resolve()

    fireEvent.click(container.querySelector('[data-testid="submenu-trigger"]') as HTMLElement)
    await Promise.resolve()
    expect(container.querySelector('[data-context-menu-sub-content]')).not.toBeNull()

    fireEvent.click(container.querySelector('[data-testid="submenu-item"]') as HTMLElement)
    await Promise.resolve()
    expect(container.querySelector('[data-context-menu-content]')).toBeNull()

    dispose()
    container.remove()
  })
})
