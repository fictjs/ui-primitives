import { afterEach, describe, expect, it } from 'vitest'

import { render } from 'fict'
import { Theme } from '@fictjs/radix-ui-themes'

import CursorsPage from '../src/sink/cursors/page'
import { PointerCursorsCheckbox } from '../src/sink/pointer-cursors-checkbox'

const cleanups: Array<() => void> = []

function flush() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0))
}

describe('playground cursors demo', () => {
  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
    document.body.innerHTML = ''
  })

  it('renders the cursor showcase actions and toggle', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(
      render(
        () => (
          <Theme>
            <CursorsPage />
          </Theme>
        ),
        container,
      ),
    )

    await flush()

    expect(container.querySelector('button')).not.toBeNull()
    expect(container.textContent).toContain('Dropdown Menu')
    expect(container.textContent).toContain('Use pointer cursors')

    const buttons = Array.from(container.querySelectorAll('button'))
    const links = Array.from(container.querySelectorAll('a'))

    expect(buttons.length).toBeGreaterThanOrEqual(4)
    expect(links.length).toBeGreaterThanOrEqual(3)
  })

  it('renders a native checkbox toggle and injects the supporting style rule into the document head', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(
      render(
        () => (
          <Theme>
            <PointerCursorsCheckbox />
          </Theme>
        ),
        container,
      ),
    )

    await flush()

    const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]')
    const styleTag = document.head.querySelector('style[data-pointer-cursor-style="true"]')

    expect(checkbox).not.toBeNull()
    expect(checkbox?.dataset.pointerCursorToggle).toBe('true')
    expect(styleTag?.textContent).toContain(':has([data-pointer-cursor-toggle="true"]:checked)')
  })
})
