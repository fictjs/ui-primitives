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

function useEffectEvent<T extends AnyFunction>(callback: () => T | undefined): T
function useEffectEvent<T extends AnyFunction>(callback: T | undefined): T
function useEffectEvent<T extends AnyFunction>(callback: CallbackSource<T>): T {
  return ((...args: Parameters<T>) => readCallback(callback)?.(...args) as ReturnType<T>) as T
}

export { useEffectEvent }
