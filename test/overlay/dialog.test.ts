import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '../../src/components/overlay/dialog'

describe('Dialog', () => {
  it('opens via trigger and closes via close button', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: DialogRoot,
        props: {
          children: [
            { type: DialogTrigger, props: { 'data-testid': 'trigger', children: 'Open' } },
            {
              type: DialogContent,
              props: {
                portal: false,
                children: [
                  { type: DialogTitle, props: { children: 'My Dialog' } },
                  { type: DialogClose, props: { 'data-testid': 'close', children: 'Close' } },
                ],
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    await Promise.resolve()

    const content = container.querySelector('[data-dialog-content]')
    expect(content).not.toBeNull()
    expect(content?.getAttribute('role')).toBe('dialog')

    fireEvent.click(container.querySelector('[data-testid="close"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-dialog-content]')).toBeNull()

    dispose()
    container.remove()
  })
})
