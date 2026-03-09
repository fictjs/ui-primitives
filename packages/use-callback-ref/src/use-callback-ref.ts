import { useLayoutEffect } from '@fictjs/use-layout-effect'

import { createRefFacade } from './ref-facade.js'
import type { RefLifecycleCallback, RefObject } from './types.js'

type AnyFunction = (...args: never[]) => unknown

export function useCallbackRef<T extends AnyFunction>(callback: T | undefined): T
export function useCallbackRef<T>(
  initialValue: T | null,
  callback: RefLifecycleCallback<T>,
): RefObject<T>
export function useCallbackRef<T>(
  initialValueOrCallback: T | null | undefined,
  callback?: RefLifecycleCallback<T>,
): RefObject<T> | AnyFunction {
  if (typeof callback === 'function') {
    return createRefFacade(initialValueOrCallback as T | null, callback)
  }

  let currentCallback =
    typeof initialValueOrCallback === 'function'
      ? (initialValueOrCallback as unknown as AnyFunction)
      : undefined

  useLayoutEffect(() => {
    currentCallback =
      typeof initialValueOrCallback === 'function'
        ? (initialValueOrCallback as unknown as AnyFunction)
        : undefined
  })

  return ((...args: never[]) => currentCallback?.(...args)) as AnyFunction
}
