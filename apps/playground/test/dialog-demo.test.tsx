import { afterEach, describe, expect, it } from 'vitest'

import { render } from 'fict'
import { createSignal } from 'fict/advanced'

import DialogPage, { DialogDemoModal } from '../src/sink/dialog/page'

const cleanups: Array<() => void> = []

function flush() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0))
}

describe('playground dialog demo', () => {
  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
    document.body.innerHTML = ''
  })

  it('renders the dialog playground entry point', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(render(() => <DialogPage />, container))

    await flush()

    const openButton = container.querySelector('#dialog-demo-open')
    expect(openButton).not.toBeNull()
    expect(container.querySelector('#dialog-demo-modal')).not.toBeNull()
    expect(container.textContent).toContain('Share resource')
    expect(container.textContent).toContain('Cancel')
  })

  it('closes the demo modal when clicking Cancel with a signal setter prop', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)

    cleanups.push(render(() => <DialogDemoModal open={true} setOpen={open} />, container))

    await flush()

    const cancelButton = container.querySelector('#dialog-demo-cancel')
    expect(open()).toBe(true)

    cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flush()

    expect(open()).toBe(false)
  })
})
