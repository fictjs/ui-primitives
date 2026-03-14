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

  it('renders theme buttons with class-based styling and closes from cancel', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(render(() => <DialogPage />, container))

    await flush()

    const openButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Open',
    )
    expect(openButton).not.toBeNull()
    expect(openButton?.getAttribute('class')).toContain('rt-Button')
    expect(openButton?.getAttribute('style')).toBeNull()

    openButton?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flush()

    const content = document.body.querySelector('[role="dialog"]')
    expect(content).not.toBeNull()
    expect(document.body.textContent).toContain('Share resource')

    const cancelButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Cancel',
    )
    expect(cancelButton).not.toBeNull()
    expect(cancelButton?.getAttribute('class')).toContain('rt-Button')
    expect(cancelButton?.getAttribute('style')).toBeNull()

    cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flush()

    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })
})
