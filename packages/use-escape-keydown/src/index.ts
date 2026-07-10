import { createEffect, onCleanup } from '@fictjs/runtime'

import { useCallbackRef } from '@fictjs/use-callback-ref'

type EscapeKeydownHandler = (event: KeyboardEvent) => void
type EscapeKeydownHandlerSource =
  | EscapeKeydownHandler
  | (() => EscapeKeydownHandler | undefined)
  | undefined

function useEscapeKeydown(
  onEscapeKeyDownProp: EscapeKeydownHandlerSource,
  ownerDocument: Document | (() => Document | undefined) = globalThis.document,
): void {
  const onEscapeKeyDown = useCallbackRef<EscapeKeydownHandler>(onEscapeKeyDownProp)

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
