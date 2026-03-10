import { type Cleanup } from '@fictjs/runtime'
import { __fictUseContext, __fictUseEffect } from '@fictjs/runtime/internal'

function useLayoutEffect(effect: () => void | Cleanup): void {
  if (typeof document === 'undefined') {
    return
  }

  const ctx = __fictUseContext()
  __fictUseEffect(ctx, effect)
}

export { useLayoutEffect }
