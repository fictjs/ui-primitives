import { onMount } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

function scheduleHydratedUpdate(callback: () => void): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback)
    return
  }

  void Promise.resolve().then(callback)
}

function useIsHydrated(): () => boolean {
  const hydrated = createSignal(false)

  onMount(() => {
    scheduleHydratedUpdate(() => {
      hydrated(true)
    })
  })

  return hydrated
}

export { useIsHydrated }
