import { createEffect, type FictNode } from '@fictjs/runtime'

interface FocusGuardsProps {
  children?: FictNode | FictNode[]
}

let count = 0

function FocusGuards(props: FocusGuardsProps): FictNode | FictNode[] | undefined {
  useFocusGuards()
  return props.children
}

function useFocusGuards(): void {
  createEffect(() => {
    if (typeof document === 'undefined' || !document.body) return

    const edgeGuards = document.querySelectorAll('[data-radix-focus-guard]')
    document.body.insertAdjacentElement(
      'afterbegin',
      (edgeGuards[0] as Element | undefined) ?? createFocusGuard(document),
    )
    document.body.insertAdjacentElement(
      'beforeend',
      (edgeGuards[1] as Element | undefined) ?? createFocusGuard(document),
    )
    count += 1

    return () => {
      if (count === 1) {
        document.querySelectorAll('[data-radix-focus-guard]').forEach((node) => node.remove())
      }
      count -= 1
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
