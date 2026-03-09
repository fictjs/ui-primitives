import { assignRef } from './assign-ref.js'
import { createCallbackRef } from './create-callback-ref.js'
import type { MaybeRef, RefObject } from './types.js'

export function transformRef<T, K>(
  ref: MaybeRef<K>,
  transformer: (original: T | null) => K | null,
): RefObject<T> {
  return createCallbackRef<T>((value) => assignRef(ref, transformer(value)))
}
