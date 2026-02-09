import { onDestroy, onMount, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'
import { useEventListener } from '@fictjs/hooks'

import { read } from '../../internal/accessor'
import type { MaybeAccessor } from '../../internal/types'

export type DismissableLayerOutsideEvent = PointerEvent | FocusEvent

export interface DismissableLayerProps {
  disabled?: MaybeAccessor<boolean>
  onDismiss?: () => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onInteractOutside?: (event: DismissableLayerOutsideEvent) => void
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
  const node = createSignal<HTMLElement | null>(null)

  const dismiss = () => {
    if (read(props.disabled, false)) return
    props.onDismiss?.()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!isTopLayer(node())) return
    if (event.key !== 'Escape') return

    props.onEscapeKeyDown?.(event)
    if (!event.defaultPrevented) {
      dismiss()
    }
  }

  const onPointerDown = (event: PointerEvent) => {
    const layer = node()
    if (!layer || !isTopLayer(layer)) return

    const target = event.target as Node | null
    const isOutside = !target || !layer.contains(target)
    if (!isOutside) return

    props.onInteractOutside?.(event)
    props.onPointerDownOutside?.(event)
    if (!event.defaultPrevented) {
      dismiss()
    }
  }

  const onFocusIn = (event: FocusEvent) => {
    const layer = node()
    if (!layer || !isTopLayer(layer)) return

    const target = event.target as Node | null
    const isOutside = !target || !layer.contains(target)
    if (!isOutside) return

    props.onInteractOutside?.(event)
    props.onFocusOutside?.(event)
    if (!event.defaultPrevented) {
      dismiss()
    }
  }

  const targetDocument = () => node()?.ownerDocument ?? (typeof document !== 'undefined' ? document : null)

  const keydownListener = useEventListener<KeyboardEvent>(targetDocument, 'keydown', onKeyDown, {
    capture: true,
    immediate: false,
  })
  const pointerDownListener = useEventListener<PointerEvent>(targetDocument, 'pointerdown', onPointerDown, {
    capture: true,
    immediate: false,
  })
  const focusInListener = useEventListener<FocusEvent>(targetDocument, 'focusin', onFocusIn, {
    capture: true,
    immediate: false,
  })

  onMount(() => {
    const layer = node()
    if (!layer) return
    activeLayers.push(layer)
    keydownListener.start()
    pointerDownListener.start()
    focusInListener.start()
  })

  onDestroy(() => {
    keydownListener.stop()
    pointerDownListener.stop()
    focusInListener.stop()

    const layer = node()
    if (!layer) return
    const index = activeLayers.indexOf(layer)
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
      onInteractOutside: undefined,
      onPointerDownOutside: undefined,
      onFocusOutside: undefined,
      ref: (el: HTMLElement | null) => {
        node(el)
      },
      'data-dismissable-layer': '',
      children: props.children,
    },
  }
}
