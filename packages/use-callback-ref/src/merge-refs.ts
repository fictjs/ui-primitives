import { assignRef } from './assign-ref.js'
import { createCallbackRef } from './create-callback-ref.js'
import type { MaybeRef, RefObject } from './types.js'

export function mergeRefs<T>(refs: readonly MaybeRef<T>[]): RefObject<T> {
  return createCallbackRef<T>((newValue) => {
    for (const ref of refs) {
      assignRef(ref, newValue)
    }
  })
}
