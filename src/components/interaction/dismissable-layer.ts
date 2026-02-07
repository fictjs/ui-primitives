import { onDestroy, onMount, type FictNode } from '@fictjs/runtime'

import { read } from '../../internal/accessor'
import type { MaybeAccessor } from '../../internal/types'

export interface DismissableLayerProps {
  disabled?: MaybeAccessor<boolean>
  onDismiss?: () => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerDownOutside?: (event: PointerEvent) => void
  onFocusOutside?: (event: FocusEvent) => void
  children?: FictNode
  [key: string]: unknown
}

const activeLayers: HTMLElement[] = []

function isTopLayer(node: HTMLElement | null): boolean {
  if (!node) return false
  return activeLayers[activeLayers.length - 1] === node
}

export function DismissableLayer(props: DismissableLayerProps): FictNode {
  let node: HTMLElement | null = null

  const dismiss = () => {
    if (read(props.disabled, false)) return
    props.onDismiss?.()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!isTopLayer(node)) return
    if (event.key !== 'Escape') return

    props.onEscapeKeyDown?.(event)
    if (!event.defaultPrevented) {
      dismiss()
    }
  }

  const onPointerDown = (event: PointerEvent) => {
    if (!node || !isTopLayer(node)) return

    const target = event.target as Node | null
    const isOutside = !target || !node.contains(target)
    if (!isOutside) return

    props.onPointerDownOutside?.(event)
    if (!event.defaultPrevented) {
      dismiss()
    }
  }

  const onFocusIn = (event: FocusEvent) => {
    if (!node || !isTopLayer(node)) return

    const target = event.target as Node | null
    const isOutside = !target || !node.contains(target)
    if (!isOutside) return

    props.onFocusOutside?.(event)
    if (!event.defaultPrevented) {
      dismiss()
    }
  }

  onMount(() => {
    if (!node) return

    const doc = node.ownerDocument ?? document
    activeLayers.push(node)

    doc.addEventListener('keydown', onKeyDown, true)
    doc.addEventListener('pointerdown', onPointerDown, true)
    doc.addEventListener('focusin', onFocusIn, true)
  })

  onDestroy(() => {
    if (!node) return

    const doc = node.ownerDocument ?? document

    doc.removeEventListener('keydown', onKeyDown, true)
    doc.removeEventListener('pointerdown', onPointerDown, true)
    doc.removeEventListener('focusin', onFocusIn, true)

    const index = activeLayers.indexOf(node)
    if (index >= 0) {
      activeLayers.splice(index, 1)
    }
  })

  return {
    type: 'div',
    props: {
      ...props,
      disabled: undefined,
      onDismiss: undefined,
      onEscapeKeyDown: undefined,
      onPointerDownOutside: undefined,
      onFocusOutside: undefined,
      ref: (el: HTMLElement | null) => {
        node = el
      },
      'data-dismissable-layer': '',
      children: props.children,
    },
  }
}
