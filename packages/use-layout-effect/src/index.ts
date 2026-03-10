import { createEffect, onMount, type Cleanup } from '@fictjs/runtime'

function useLayoutEffect(effect: () => void | Cleanup): void {
  if (typeof document === 'undefined') {
    return
  }

  onMount(() => {
    return createEffect(effect)
  })
}

export { useLayoutEffect }
