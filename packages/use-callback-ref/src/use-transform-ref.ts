import { assignRef } from './assign-ref.js'
import { useCallbackRef } from './use-callback-ref.js'
import type { MaybeRef, RefObject } from './types.js'

export function useTransformRef<T, K>(
  ref: MaybeRef<K>,
  transformer: (original: T | null) => K | null,
): RefObject<T> {
  return useCallbackRef<T>(null, (value) => assignRef(ref, transformer(value)))
}
