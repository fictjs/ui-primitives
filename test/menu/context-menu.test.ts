import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '../../src/components/menu/context-menu'

describe('ContextMenu', () => {
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
})
