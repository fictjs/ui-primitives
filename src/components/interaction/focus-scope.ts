import { onDestroy, onMount, type FictNode } from '@fictjs/runtime'

import { read } from '../../internal/accessor'
import { focusFirst, getFocusableCandidates } from '../../internal/dom'
import type { MaybeAccessor } from '../../internal/types'

export interface FocusScopeProps {
  trapped?: MaybeAccessor<boolean>
  loop?: MaybeAccessor<boolean>
  autoFocus?: MaybeAccessor<boolean>
  restoreFocus?: MaybeAccessor<boolean>
  onMountAutoFocus?: (event: Event) => void
  onUnmountAutoFocus?: (event: Event) => void
  children?: FictNode
  [key: string]: unknown
}

export function FocusScope(props: FocusScopeProps): FictNode {
  let node: HTMLElement | null = null
  let previousFocused: Element | null = null
  let scopeDocument: Document | null = null

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return
    if (!node) return

    const trapped = read(props.trapped, true)
    if (!trapped) return

    const candidates = getFocusableCandidates(node)
    if (candidates.length === 0) {
      event.preventDefault()
      return
    }

    const first = candidates[0]!
    const last = candidates[candidates.length - 1]!
    const active = (node.ownerDocument ?? document).activeElement

    if (event.shiftKey) {
      if (active === first || !node.contains(active)) {
        if (read(props.loop, true)) {
          event.preventDefault()
          last.focus()
        }
      }
      return
    }

    if (active === last) {
      if (read(props.loop, true)) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  onMount(() => {
    if (!node) return

    const doc = node.ownerDocument ?? document
    scopeDocument = doc
    previousFocused = doc.activeElement

    doc.addEventListener('keydown', onKeyDown, true)

    if (read(props.autoFocus, true)) {
      const mountEvent = new CustomEvent('fict-focus-scope.mount')
      props.onMountAutoFocus?.(mountEvent)
      if (!mountEvent.defaultPrevented) {
        focusFirst(node)
      }
    }
  })

  onDestroy(() => {
    const doc = scopeDocument ?? node?.ownerDocument ?? document
    doc.removeEventListener('keydown', onKeyDown, true)

    if (read(props.restoreFocus, true) && previousFocused instanceof HTMLElement) {
      const unmountEvent = new CustomEvent('fict-focus-scope.unmount')
      props.onUnmountAutoFocus?.(unmountEvent)
      if (!unmountEvent.defaultPrevented) {
        previousFocused.focus()
      }
    }
  })

  return {
    type: 'div',
    props: {
      ...props,
      trapped: undefined,
      loop: undefined,
      autoFocus: undefined,
      restoreFocus: undefined,
      onMountAutoFocus: undefined,
      onUnmountAutoFocus: undefined,
      ref: (el: HTMLElement | null) => {
        node = el
      },
      'data-focus-scope': '',
      children: props.children,
    },
  }
}

export function FocusTrap(props: Omit<FocusScopeProps, 'trapped'>): FictNode {
  return {
    type: FocusScope,
    props: {
      ...props,
      trapped: true,
    },
  }
}
