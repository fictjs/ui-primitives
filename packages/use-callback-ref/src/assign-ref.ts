import type { MaybeRef } from './types.js'

export function assignRef<T>(ref: MaybeRef<T>, value: T | null): MaybeRef<T> {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref) {
    ref.current = value
  }

  return ref
}
