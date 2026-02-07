import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { ScrollLock } from '../../src/components/interaction/scroll-lock'

describe('ScrollLock', () => {
  it('locks and restores body overflow on mount/unmount', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)

    const originalOverflow = document.body.style.overflow

    const dispose = render(() => ({ type: ScrollLock, props: { enabled: true } }), root)

    expect(document.body.style.overflow).toBe('hidden')

    dispose()

    expect(document.body.style.overflow).toBe(originalOverflow)

    root.remove()
  })
})
