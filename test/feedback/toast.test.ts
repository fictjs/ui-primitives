import { describe, expect, it } from 'vitest'
import { onMount, type FictNode, render } from '@fictjs/runtime'

import { ToastProvider, ToastViewport, useToast } from '../../src/components/feedback/toast'

function EmitToast(): FictNode {
  const { show } = useToast()

  onMount(() => {
    show({ title: 'Saved', description: 'Record updated', duration: 2000 })
  })

  return null
}

describe('Toast', () => {
  it('renders provider queued toast in viewport', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: ToastProvider,
        props: {
          children: [
            { type: EmitToast, props: {} },
            { type: ToastViewport, props: { 'data-testid': 'viewport' } },
          ],
        },
      }),
      container,
    )

    await Promise.resolve()

    const viewport = container.querySelector('[data-testid="viewport"]')
    expect(viewport?.textContent).toContain('Saved')
    expect(viewport?.textContent).toContain('Record updated')

    dispose()
    container.remove()
  })
})
