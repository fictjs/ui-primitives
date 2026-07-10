import { createEffect, onCleanup, type FictNode, type FictVNode } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { composeRefs, type PossibleRef } from '@fictjs/compose-refs'

type MaybeAccessor<T> = T | (() => MaybeAccessor<T>)
type PresenceState = 'mounted' | 'unmountSuspended' | 'unmounted'
type PresenceEvent = 'MOUNT' | 'UNMOUNT' | 'ANIMATION_OUT' | 'ANIMATION_END'

const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

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

function isReadableAccessor<T>(value: MaybeAccessor<T>): value is () => T {
  return (
    typeof value === 'function' &&
    (value.length === 0 ||
      (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  )
}

function readValue<T>(value: MaybeAccessor<T>): T {
  let currentValue: unknown = value

  for (
    let depth = 0;
    depth < 10 && isReadableAccessor(currentValue as MaybeAccessor<unknown>);
    depth += 1
  ) {
    currentValue = (currentValue as () => unknown)()
  }

  return currentValue as T
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
    const nextPresent = readValue(present)
    const currentAnimationName = readAnimationName()

    if (nextPresent !== prevPresent) {
      if (nextPresent) {
        send('MOUNT')
        prevAnimationName = currentAnimationName
      } else if (currentAnimationName === 'none' || readDisplay() === 'none') {
        send('UNMOUNT')
      } else {
        const isAnimating = prevAnimationName !== currentAnimationName

        if (prevPresent && isAnimating) {
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
      if (element && state() === 'mounted') {
        prevAnimationName = element.style.animationName || getAnimationName(stylesRef)
      }
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
      {reactive(() => {
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
      })}
    </>
  )
}

Presence.displayName = 'Presence'

const Root = Presence

export { Presence, Root }
export type { PresenceProps }
