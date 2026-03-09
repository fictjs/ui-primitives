import { useLayoutEffect } from '@fictjs/use-layout-effect'

type AnyFunction = (...args: never[]) => unknown

function useEffectEvent<T extends AnyFunction>(callback: T | undefined): T {
  let currentCallback = callback

  useLayoutEffect(() => {
    currentCallback = callback
  })

  return ((...args: Parameters<T>) => currentCallback?.(...args) as ReturnType<T>) as T
}

export { useEffectEvent }
