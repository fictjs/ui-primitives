import type { MaybeRef, RefCallback } from './types.js'

export function refToCallback<T>(ref: MaybeRef<T>): RefCallback<T> {
  return (newValue) => {
    if (typeof ref === 'function') {
      ref(newValue)
      return
    }

    if (ref) {
      ref.current = newValue
    }
  }
}

const noopRefCallback: RefCallback<never> = () => {}
const memoizedCallbacks = new WeakMap<object, RefCallback<unknown>>()

function getMemoKey<T>(ref: MaybeRef<T>): object {
  return ref ?? noopRefCallback
}

export function useRefToCallback<T>(ref: MaybeRef<T>): RefCallback<T> {
  const key = getMemoKey(ref)
  const existing = memoizedCallbacks.get(key) as RefCallback<T> | undefined

  if (existing) {
    return existing
  }

  const callback = refToCallback(ref)
  memoizedCallbacks.set(key, callback as RefCallback<unknown>)

  return callback
}
