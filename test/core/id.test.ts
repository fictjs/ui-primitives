import { describe, expect, it } from 'vitest'

import { render, type FictNode } from '@fictjs/runtime'

import { IdProvider, useId } from '../../src/components/core/id'

function IdProbe(rawProps: Record<string, unknown>): FictNode {
  const props = rawProps as { testId: string; id?: string; prefix?: string }
  const id = useId(props.id, props.prefix)
  return {
    type: 'div',
    props: {
      id,
      'data-testid': props.testId,
    },
  }
}

describe('Id primitives', () => {
  it('scopes generated ids via IdProvider prefix', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: IdProvider,
        props: {
          prefix: 'scope',
          children: [
            { type: IdProbe, props: { testId: 'first' } },
            { type: IdProbe, props: { testId: 'second' } },
          ],
        },
      }),
      container,
    )

    await Promise.resolve()

    expect(container.querySelector('[data-testid="first"]')?.id).toBe('scope-1')
    expect(container.querySelector('[data-testid="second"]')?.id).toBe('scope-2')

    dispose()
    container.remove()
  })

  it('returns the provided id without generating a new one', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(() => ({ type: IdProbe, props: { testId: 'custom', id: 'fixed-id' } }), container)
    await Promise.resolve()

    expect(container.querySelector('[data-testid="custom"]')?.id).toBe('fixed-id')

    dispose()
    container.remove()
  })
})
