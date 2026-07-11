import { createElement, mergeProps } from 'fict'
import { createConditional } from 'fict/internal'

import type * as React from './element.js'

const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const REACTIVE_FN_MARKER = Symbol.for('fict:reactive-fn')

function isStructuralAccessor(value: unknown): value is () => unknown {
  if (typeof value !== 'function') return false

  const taggedValue = value as unknown as Record<symbol, unknown>
  return (
    taggedValue[SIGNAL_MARKER] === true ||
    taggedValue[COMPUTED_MARKER] === true ||
    taggedValue[REACTIVE_FN_MARKER] === true
  )
}

/**
 * Renders static `asChild` values synchronously while giving actual reactive accessors a
 * remounting structural boundary. Synchronous rendering is important for Slot refs and context
 * consumers that must be available during their parent's first mount.
 */
function renderWithAsChild(
  props: { asChild?: boolean },
  render: (asChild: boolean) => React.ReactNode,
): React.ReactNode {
  const rawProps = mergeProps({}, props as unknown as Record<string, unknown>)
  const asChildProp = rawProps.asChild

  if (!isStructuralAccessor(asChildProp)) {
    const value = typeof asChildProp === 'function' ? (asChildProp as () => unknown)() : asChildProp
    return render(Boolean(value))
  }

  return createConditional(
    () => Boolean(asChildProp()),
    () => render(true),
    createElement,
    () => render(false),
  ) as unknown as React.ReactNode
}

export { renderWithAsChild }
