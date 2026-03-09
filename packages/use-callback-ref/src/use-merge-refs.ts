import { assignRef } from './assign-ref.js'
import { useCallbackRef } from './use-callback-ref.js'
import type { MaybeRef, RefObject } from './types.js'

export function useMergeRefs<T>(
  refs: readonly MaybeRef<T>[],
  defaultValue?: T | null,
): RefObject<T> {
  return useCallbackRef(defaultValue ?? null, (newValue) => {
    for (const ref of refs) {
      assignRef(ref, newValue)
    }
  })
}
