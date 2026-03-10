const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
)

type ComposeEventHandlersOptions = {
  checkForDefaultPrevented?: boolean
}

function composeEventHandlers<E extends { defaultPrevented: boolean }>(
  originalEventHandler?: ((event: E) => void) | null,
  ourEventHandler?: ((event: E) => void) | null,
  { checkForDefaultPrevented = true }: ComposeEventHandlersOptions = {},
) {
  return function handleEvent(event: E) {
    originalEventHandler?.(event)

    if (checkForDefaultPrevented === false || !event.defaultPrevented) {
      return ourEventHandler?.(event)
    }
  }
}

function getOwnerWindow(element: Node | null | undefined): Window {
  if (!canUseDOM) {
    throw new Error('Cannot access window outside of the DOM')
  }

  return element?.ownerDocument?.defaultView ?? window
}

function getOwnerDocument(element: Node | null | undefined): Document {
  if (!canUseDOM) {
    throw new Error('Cannot access document outside of the DOM')
  }

  return element?.ownerDocument ?? document
}

function getActiveElement(
  node: Node | null | undefined,
  activeDescendant = false,
): HTMLElement | null {
  const { activeElement } = getOwnerDocument(node)
  if (!activeElement?.nodeName) {
    return null
  }

  if (isFrame(activeElement) && activeElement.contentDocument) {
    return getActiveElement(activeElement.contentDocument.body, activeDescendant)
  }

  if (activeDescendant) {
    const id = activeElement.getAttribute('aria-activedescendant')
    if (id) {
      const element = getOwnerDocument(activeElement).getElementById(id)
      if (element) {
        return element
      }
    }
  }

  return activeElement as HTMLElement | null
}

function isFrame(element: Element): element is HTMLIFrameElement {
  return element.tagName === 'IFRAME'
}

export {
  canUseDOM,
  composeEventHandlers,
  getOwnerWindow,
  getOwnerDocument,
  getActiveElement,
  isFrame,
}
export type { ComposeEventHandlersOptions }
