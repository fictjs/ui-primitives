import type { VNodeLike } from './types'
import { composeEventHandlers } from './event'
import { composeRefs } from './ref'

function isEventKey(key: string): boolean {
  return key.startsWith('on') && key.length > 2
}

function mergeClassName(a: unknown, b: unknown): unknown {
  if (!a) return b
  if (!b) return a
  return `${String(a)} ${String(b)}`
}

function mergeStyle(a: unknown, b: unknown): unknown {
  if (!a) return b
  if (!b) return a

  if (typeof a === 'string' || typeof b === 'string') {
    return `${String(a)}; ${String(b)}`
  }

  if (typeof a === 'object' && typeof b === 'object') {
    return { ...(a as Record<string, unknown>), ...(b as Record<string, unknown>) }
  }

  return b
}

function mergePropValue(key: string, targetValue: unknown, sourceValue: unknown): unknown {
  if (key === 'class' || key === 'className') {
    return mergeClassName(targetValue, sourceValue)
  }

  if (key === 'style') {
    return mergeStyle(targetValue, sourceValue)
  }

  if (key === 'ref') {
    return composeRefs(
      targetValue as ((node: Element | null) => void) | { current: Element | null } | undefined,
      sourceValue as ((node: Element | null) => void) | { current: Element | null } | undefined,
    )
  }

  if (isEventKey(key)) {
    if (typeof targetValue === 'function' || typeof sourceValue === 'function') {
      return composeEventHandlers(
        targetValue as ((event: Event) => void) | undefined,
        sourceValue as ((event: Event) => void) | undefined,
      )
    }
  }

  return sourceValue
}

export function isVNodeLike(value: unknown): value is VNodeLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'props' in value &&
    !(value instanceof Node)
  )
}

export function mergeVNodeProps(
  target: Record<string, unknown> | null,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(target ?? {}) }

  for (const [key, sourceValue] of Object.entries(source)) {
    if (key === 'children' && sourceValue === undefined) continue
    const targetValue = next[key]
    next[key] = mergePropValue(key, targetValue, sourceValue)
  }

  return next
}

export function cloneVNodeWithProps(
  vnode: VNodeLike,
  props: Record<string, unknown>,
  children?: unknown,
): VNodeLike {
  const merged = mergeVNodeProps(vnode.props, props)

  if (children !== undefined) {
    merged.children = children
  }

  return {
    type: vnode.type,
    props: merged,
    key: vnode.key,
  }
}
