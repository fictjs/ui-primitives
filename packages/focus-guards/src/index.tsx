import { createEffect, type FictNode } from '@fictjs/runtime'

interface FocusGuardsProps {
  children?: FictNode | FictNode[]
  ownerDocument?: Document | (() => Document | undefined)
}

const documentCounts = new WeakMap<Document, number>()

function FocusGuards(props: FocusGuardsProps): FictNode | FictNode[] | undefined {
  useFocusGuards(props.ownerDocument)
  return props.children
}

function useFocusGuards(ownerDocument?: Document | (() => Document | undefined)): void {
  createEffect(() => {
    const currentDocument =
      typeof ownerDocument === 'function' ? ownerDocument() : (ownerDocument ?? globalThis.document)
    if (!currentDocument?.body) return

    const edgeGuards = currentDocument.querySelectorAll('[data-radix-focus-guard]')
    currentDocument.body.insertAdjacentElement(
      'afterbegin',
      (edgeGuards[0] as Element | undefined) ?? createFocusGuard(currentDocument),
    )
    currentDocument.body.insertAdjacentElement(
      'beforeend',
      (edgeGuards[1] as Element | undefined) ?? createFocusGuard(currentDocument),
    )
    documentCounts.set(currentDocument, (documentCounts.get(currentDocument) ?? 0) + 1)

    return () => {
      const count = documentCounts.get(currentDocument) ?? 0
      if (count <= 1) {
        documentCounts.delete(currentDocument)
        currentDocument
          .querySelectorAll('[data-radix-focus-guard]')
          .forEach((node) => node.remove())
        return
      }

      documentCounts.set(currentDocument, count - 1)
    }
  })
}

function createFocusGuard(ownerDocument: Document): HTMLSpanElement {
  const element = ownerDocument.createElement('span')
  element.setAttribute('data-radix-focus-guard', '')
  element.tabIndex = 0
  element.style.outline = 'none'
  element.style.opacity = '0'
  element.style.position = 'fixed'
  element.style.pointerEvents = 'none'
  return element
}

FocusGuards.displayName = 'FocusGuards'

const Root = FocusGuards

export { FocusGuards, Root, useFocusGuards }
export type { FocusGuardsProps }
