import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'
import type { FictNode } from '@fictjs/runtime'

import { AccessibleIcon } from '../../src/components/core/accessible-icon'
import { Separator } from '../../src/components/core/separator'
import { VisuallyHidden } from '../../src/components/core/visually-hidden'

describe('a11y core primitives', () => {
  it('renders visually hidden content', () => {
    const root = document.createElement('div')
    const dispose = render(
      () => ({ type: VisuallyHidden, props: { children: 'sr text', 'data-testid': 'vh' } }),
      root,
    )

    const node = root.querySelector('[data-testid="vh"]') as HTMLElement | null
    expect(node).not.toBeNull()
    expect(node?.textContent).toBe('sr text')
    expect(node?.style.position).toBe('absolute')

    dispose()
  })

  it('adds proper separator semantics', () => {
    const root = document.createElement('div')
    const dispose = render(
      () => ({ type: Separator, props: { orientation: 'vertical', 'data-testid': 'sep' } }),
      root,
    )

    const node = root.querySelector('[data-testid="sep"]')
    expect(node?.getAttribute('role')).toBe('separator')
    expect(node?.getAttribute('aria-orientation')).toBe('vertical')

    dispose()
  })

  it('renders icon and hidden label', () => {
    const root = document.createElement('div')
    const AccessibleIconComponent = (props: Record<string, unknown>): FictNode =>
      AccessibleIcon(props as { label: string; children?: FictNode })

    const dispose = render(
      () => ({
        type: AccessibleIconComponent,
        props: {
          label: 'Close',
          children: { type: 'svg', props: { 'data-testid': 'icon' } },
        },
      }),
      root,
    )

    expect(root.textContent).toContain('Close')
    expect(root.querySelector('[data-testid="icon"]')).not.toBeNull()

    dispose()
  })
})
