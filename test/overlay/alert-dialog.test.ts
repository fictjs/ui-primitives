import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  AlertDialogContent,
  AlertDialogRoot,
  AlertDialogTrigger,
} from '../../src/components/overlay/alert-dialog'

describe('AlertDialog', () => {
  it('renders alertdialog role when opened', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: AlertDialogRoot,
        props: {
          children: [
            { type: AlertDialogTrigger, props: { 'data-testid': 'trigger', children: 'Open' } },
            {
              type: AlertDialogContent,
              props: {
                portal: false,
                children: 'Danger action',
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[role="alertdialog"]')).not.toBeNull()

    dispose()
    container.remove()
  })
})
