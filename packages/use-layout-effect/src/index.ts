import { createEffect, type Cleanup } from '@fictjs/runtime'

function useLayoutEffect(effect: () => void | Cleanup): void {
  if (typeof document === 'undefined') {
    return
  }

  createEffect(effect)
}

export { useLayoutEffect }
