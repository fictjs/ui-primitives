import { onDestroy, onMount, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'
import { useEventListener } from '@fictjs/hooks'

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
  const node = createSignal<HTMLElement | null>(null)
  let previousFocused: Element | null = null

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return
    const scope = node()
    if (!scope) return

    const trapped = read(props.trapped, true)
    if (!trapped) return

    const candidates = getFocusableCandidates(scope)
    if (candidates.length === 0) {
      event.preventDefault()
      return
    }

    const first = candidates[0]!
    const last = candidates[candidates.length - 1]!
    const active = (scope.ownerDocument ?? document).activeElement

    if (event.shiftKey) {
      if (active === first || !scope.contains(active)) {
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

  const targetDocument = () => node()?.ownerDocument ?? (typeof document !== 'undefined' ? document : null)
  useEventListener<KeyboardEvent>(targetDocument, 'keydown', onKeyDown, { capture: true })

  onMount(() => {
    const scope = node()
    if (!scope) return
    const doc = targetDocument()
    if (!doc) return
    previousFocused = doc.activeElement

    if (read(props.autoFocus, true)) {
      const mountEvent = new CustomEvent('fict-focus-scope.mount')
      props.onMountAutoFocus?.(mountEvent)
      if (!mountEvent.defaultPrevented) {
        focusFirst(scope)
      }
    }
  })

  onDestroy(() => {
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
        node(el)
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
