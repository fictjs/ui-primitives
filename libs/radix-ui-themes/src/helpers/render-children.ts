import { prop, untrack } from 'fict'
import { isReactive } from 'fict/advanced'

import type * as React from './element.js'

type LazyReactNode = React.ReactNode | (() => React.ReactNode)

function isReactiveAccessor(value: unknown): boolean {
  return isReactive(value)
}

function readReactiveValue(value: unknown): unknown {
  let currentValue = value

  for (let depth = 0; depth < 10 && isReactiveAccessor(currentValue); depth += 1) {
    const nextValue = (currentValue as () => unknown)()
    if (nextValue === currentValue) break
    currentValue = nextValue
  }

  return currentValue
}

function isTextLikeNode(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

function resolveChildrenValue(value: unknown): unknown {
  const resolvedValue = readReactiveValue(value)
  return typeof resolvedValue === 'function' ? (resolvedValue as () => unknown)() : resolvedValue
}

function copyReactiveChildren(readChildren: () => unknown): unknown {
  const initialValue = untrack(() => resolveChildrenValue(readChildren()))

  return isTextLikeNode(initialValue)
    ? prop(() => resolveChildrenValue(readChildren()), { unwrap: false })
    : initialValue
}

function renderChildren(children: LazyReactNode): React.ReactNode {
  if (!isReactiveAccessor(children)) {
    return typeof children === 'function' ? children() : children
  }

  const initialValue = untrack(() => resolveChildrenValue(children))

  // Text-like accessors are safe to keep live: their binding only owns text nodes. VNodes, DOM
  // nodes, fragments, and arrays containing them must be created synchronously so descendant
  // lifecycle hooks join the host root instead of a detached child-binding root.
  return isTextLikeNode(initialValue)
    ? (prop(() => resolveChildrenValue(children), {
        unwrap: false,
      }) as unknown as React.ReactNode)
    : (initialValue as React.ReactNode)
}

export { copyReactiveChildren, renderChildren }
