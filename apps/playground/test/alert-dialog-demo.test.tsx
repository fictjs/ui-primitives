import { afterEach, describe, expect, it } from 'vitest'

import { render } from 'fict'
import { createSignal } from 'fict/advanced'

import { AlertDialogDemoModal } from '../src/sink/alert-dialog/page'

const cleanups: Array<() => void> = []

function flush() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0))
}

describe('playground alert dialog demo', () => {
  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
    document.body.innerHTML = ''
  })

  it('closes the demo modal when clicking Cancel', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)

    cleanups.push(render(() => <AlertDialogDemoModal open={true} setOpen={open} />, container))

    await flush()

    const cancelButton = container.querySelector('#alert-dialog-demo-cancel')
    expect(open()).toBe(true)

    cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flush()

    expect(open()).toBe(false)
  })
})
