import { createRefFacade } from './ref-facade.js'
import type { RefLifecycleCallback, RefObject } from './types.js'

type AnyFunction = (...args: never[]) => unknown
type CallbackSource<T extends AnyFunction> = T | (() => T | undefined) | undefined

const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

function isCallbackAccessor<T extends AnyFunction>(
  callback: CallbackSource<T>,
): callback is () => T | undefined {
  if (typeof callback !== 'function') return false

  const taggedCallback = callback as unknown as Record<symbol, unknown>
  return (
    taggedCallback[SIGNAL_MARKER] === true ||
    taggedCallback[COMPUTED_MARKER] === true ||
    taggedCallback[PROP_GETTER_MARKER] === true
  )
}

function readCallback<T extends AnyFunction>(callback: CallbackSource<T>): T | undefined {
  return isCallbackAccessor(callback) ? callback() : callback
}

export function useCallbackRef<T extends AnyFunction>(callback: () => T | undefined): T
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

  const callbackSource = initialValueOrCallback as CallbackSource<AnyFunction>
  return ((...args: never[]) => readCallback(callbackSource)?.(...args)) as AnyFunction
}
