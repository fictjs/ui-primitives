import type { MaybeElement, RefLike } from '../types.js'

function isRefLike<T>(value: unknown): value is RefLike<T> {
  return typeof value === 'object' && value !== null && 'current' in value
}

export function unwrapElement<T>(value: MaybeElement<T>): T | null {
  if (isRefLike<T>(value)) {
    return value.current
  }

  return value ?? null
}
