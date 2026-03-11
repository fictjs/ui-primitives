import { createEffect, onCleanup, type FictNode, type FictVNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { composeRefs, type PossibleRef } from '@fictjs/compose-refs'

type MaybeAccessor<T> = T | (() => T)
type PresenceState = 'mounted' | 'unmountSuspended' | 'unmounted'
type PresenceEvent = 'MOUNT' | 'UNMOUNT' | 'ANIMATION_OUT' | 'ANIMATION_END'

interface PresenceProps {
  children: FictNode | ((props: { present: boolean }) => FictNode)
  present: MaybeAccessor<boolean>
}

type StateMachine = Record<PresenceState, Partial<Record<PresenceEvent, PresenceState>>>

const PRESENCE_MACHINE: StateMachine = {
  mounted: {
    UNMOUNT: 'unmounted',
    ANIMATION_OUT: 'unmountSuspended',
  },
  unmountSuspended: {
    MOUNT: 'mounted',
    ANIMATION_END: 'unmounted',
  },
  unmounted: {
    MOUNT: 'mounted',
  },
}

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

function isVNode(node: unknown): node is FictVNode {
  return !!node && typeof node === 'object' && 'type' in (node as FictVNode)
}

function createStateMachine(initialState: PresenceState, machine: StateMachine) {
  const state = createSignal<PresenceState>(initialState)

  const send = (event: PresenceEvent) => {
    const nextState = machine[state()]?.[event]
    if (nextState) {
      state(nextState)
    }
  }

  return [state, send] as const
}

function getAnimationName(styles: CSSStyleDeclaration | null): string {
  return styles?.animationName || 'none'
}

function escapeAnimationName(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }

  return value
}

function getElementRef(element: FictVNode): PossibleRef<Element> {
  const props = element.props as { ref?: PossibleRef<Element> } | null | undefined
  return props?.ref
}

function cloneVNode(node: FictVNode, props: Record<string, unknown>): FictVNode {
  return {
    ...node,
    props: {
      ...(node.props as Record<string, unknown> | null | undefined),
      ...props,
    },
  }
}

function usePresence(present: MaybeAccessor<boolean>) {
  const node = createSignal<HTMLElement | undefined>(undefined)
  const initialPresent = readValue(present)
  const [state, send] = createStateMachine(
    initialPresent ? 'mounted' : 'unmounted',
    PRESENCE_MACHINE,
  )
  let stylesRef: CSSStyleDeclaration | null = null
  let prevPresent = initialPresent
  let prevAnimationName = 'none'

  const readStyles = () => {
    const currentNode = node()
    return currentNode ? getComputedStyle(currentNode) : stylesRef
  }

  const readAnimationName = () => {
    const currentNode = node()
    return currentNode?.style.animationName || getAnimationName(readStyles())
  }

  const readDisplay = () => {
    const currentNode = node()
    return currentNode?.style.display || readStyles()?.display || ''
  }

  createEffect(() => {
    prevAnimationName = state() === 'mounted' ? readAnimationName() : 'none'
  })

  createEffect(() => {
    const nextPresent = readValue(present)
    const currentAnimationName = readAnimationName()

    if (nextPresent !== prevPresent) {
      if (nextPresent) {
        send('MOUNT')
      } else if (currentAnimationName === 'none' || readDisplay() === 'none') {
        send('UNMOUNT')
      } else {
        const hasActiveAnimation = currentAnimationName !== 'none'
        const isAnimating = prevAnimationName !== currentAnimationName

        if (prevPresent && (isAnimating || hasActiveAnimation)) {
          send('ANIMATION_OUT')
        } else {
          send('UNMOUNT')
        }
      }

      prevPresent = nextPresent
    }
  })

  createEffect(() => {
    const currentNode = node()

    if (!currentNode) {
      queueMicrotask(() => {
        if (!node()) {
          send('ANIMATION_END')
        }
      })
      return
    }

    let timeoutId = 0
    const ownerWindow = currentNode.ownerDocument.defaultView ?? window

    const handleAnimationEnd = (event: Event) => {
      const animationEvent = event as Event & { animationName?: string }
      const currentAnimationName = readAnimationName()
      const eventAnimationName = animationEvent.animationName ?? ''
      const isCurrentAnimation = currentAnimationName.includes(
        escapeAnimationName(eventAnimationName),
      )

      if (event.target === currentNode && isCurrentAnimation) {
        send('ANIMATION_END')

        if (!prevPresent) {
          const currentFillMode = currentNode.style.animationFillMode
          currentNode.style.animationFillMode = 'forwards'
          timeoutId = ownerWindow.setTimeout(() => {
            if (currentNode.style.animationFillMode === 'forwards') {
              currentNode.style.animationFillMode = currentFillMode
            }
          })
        }
      }
    }

    const handleAnimationStart = (event: Event) => {
      if (event.target === currentNode) {
        prevAnimationName = readAnimationName()
      }
    }

    currentNode.addEventListener('animationstart', handleAnimationStart)
    currentNode.addEventListener('animationcancel', handleAnimationEnd)
    currentNode.addEventListener('animationend', handleAnimationEnd)

    onCleanup(() => {
      ownerWindow.clearTimeout(timeoutId)
      currentNode.removeEventListener('animationstart', handleAnimationStart)
      currentNode.removeEventListener('animationcancel', handleAnimationEnd)
      currentNode.removeEventListener('animationend', handleAnimationEnd)
    })
  })

  return {
    isPresent: () => state() === 'mounted' || state() === 'unmountSuspended',
    ref: (nextNode: Element | null) => {
      const element = nextNode instanceof HTMLElement ? nextNode : null
      stylesRef = element ? getComputedStyle(element) : null
      node(element ?? undefined)
    },
  }
}

function Presence(props: PresenceProps): FictNode {
  const presence = usePresence(props.present)
  const forceMount = typeof props.children === 'function'
  const childTemplate =
    !forceMount && isVNode(props.children)
      ? cloneVNode(props.children, {
          ref: composeRefs(presence.ref, getElementRef(props.children)),
        })
      : props.children

  return (
    <>
      {() => {
        const child =
          typeof childTemplate === 'function'
            ? childTemplate({ present: presence.isPresent() })
            : childTemplate

        if (!forceMount && !presence.isPresent()) {
          return null
        }

        if (!isVNode(child)) {
          return child ?? null
        }

        return cloneVNode(child, {
          ref: composeRefs(presence.ref, getElementRef(child)),
        })
      }}
    </>
  )
}

Presence.displayName = 'Presence'

const Root = Presence

export { Presence, Root }
export type { PresenceProps }
