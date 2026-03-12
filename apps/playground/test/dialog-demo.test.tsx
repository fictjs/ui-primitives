import { afterEach, describe, expect, it } from 'vitest'

import { render } from 'fict'

import DialogPage from '../src/sink/dialog/page'

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

  it('opens the demo modal when clicking Open', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(render(() => <DialogPage />, container))

    await flush()

    const openButton = container.querySelector('#dialog-demo-open')
    expect(openButton).not.toBeNull()
    expect(container.querySelector('#dialog-demo-modal')).not.toBeNull()

    openButton?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flush()

    const modal = container.querySelector('#dialog-demo-modal') as HTMLElement | null
    expect(modal).not.toBeNull()
    expect(container.textContent).toContain('Share resource')
    expect(container.textContent).toContain('Cancel')
  })
})
