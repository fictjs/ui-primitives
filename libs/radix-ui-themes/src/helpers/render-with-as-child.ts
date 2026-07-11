import { mergeProps } from 'fict'
import { isReactive } from 'fict/advanced'

import type * as React from './element.js'

function readStructuralValue(value: unknown): unknown {
  let currentValue: unknown = value

  for (let depth = 0; depth < 10 && isReactive(currentValue); depth += 1) {
    const nextValue = (currentValue as () => unknown)()
    if (nextValue === currentValue) break
    currentValue = nextValue
  }

  return currentValue
}

/**
 * Resolves `asChild` synchronously. Fict 0.26 conditional branches flush nested lifecycle hooks
 * before their parent tree is connected, so structural props intentionally keep their initial
 * shape while ordinary element props remain reactive.
 */
function renderWithAsChild(
  props: { asChild?: boolean },
  render: (asChild: boolean) => React.ReactNode,
): React.ReactNode {
  const rawProps = mergeProps({}, props as unknown as Record<string, unknown>)
  const asChildProp = rawProps.asChild

  return render(Boolean(readStructuralValue(asChildProp)))
}

export { renderWithAsChild }
