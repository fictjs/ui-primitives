import { createRefFacade } from './ref-facade.js'
import type { RefLifecycleCallback, RefObject } from './types.js'

export function createCallbackRef<T>(callback: RefLifecycleCallback<T>): RefObject<T> {
  return createRefFacade(null, callback)
}
