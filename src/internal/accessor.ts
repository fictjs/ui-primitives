import type { MaybeAccessor } from './types'

export function read<T>(value: MaybeAccessor<T> | undefined, fallback?: T): T {
  if (typeof value === 'function') {
    return (value as () => T)()
  }
  if (value === undefined) {
    return fallback as T
  }
  return value
}
