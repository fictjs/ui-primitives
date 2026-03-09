import { createEffect, onCleanup } from '@fictjs/runtime'

import { useCallbackRef } from '@fictjs/use-callback-ref'

function useEscapeKeydown(
  onEscapeKeyDownProp: ((event: KeyboardEvent) => void) | undefined,
  ownerDocument: Document = globalThis.document,
): void {
  const onEscapeKeyDown = useCallbackRef(onEscapeKeyDownProp)

  createEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscapeKeyDown(event)
      }
    }

    ownerDocument.addEventListener('keydown', handleKeyDown, { capture: true })
    onCleanup(() => ownerDocument.removeEventListener('keydown', handleKeyDown, { capture: true }))
  })
}

export { useEscapeKeydown }
