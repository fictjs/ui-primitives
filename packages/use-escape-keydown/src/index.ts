import { createEffect, onCleanup } from '@fictjs/runtime'

import { useCallbackRef } from '@fictjs/use-callback-ref'

function useEscapeKeydown(
  onEscapeKeyDownProp: ((event: KeyboardEvent) => void) | undefined,
  ownerDocument: Document | (() => Document | undefined) = globalThis.document,
): void {
  const onEscapeKeyDown = useCallbackRef(onEscapeKeyDownProp)

  createEffect(() => {
    const currentDocument = typeof ownerDocument === 'function' ? ownerDocument() : ownerDocument
    if (!currentDocument) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscapeKeyDown(event)
      }
    }

    currentDocument.addEventListener('keydown', handleKeyDown, { capture: true })
    onCleanup(() =>
      currentDocument.removeEventListener('keydown', handleKeyDown, { capture: true }),
    )
  })
}

export { useEscapeKeydown }
