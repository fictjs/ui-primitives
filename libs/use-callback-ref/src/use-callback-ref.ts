import { createRefFacade } from './ref-facade.js'
import type { RefLifecycleCallback, RefObject } from './types.js'

export function useCallbackRef<T>(
  initialValue: T | null,
  callback: RefLifecycleCallback<T>,
): RefObject<T> {
  return createRefFacade(initialValue, callback)
}
