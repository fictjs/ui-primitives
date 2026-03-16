import {
  createContext,
  mergeProps,
  prop,
  useContext,
  type FictNode,
  type JSX,
} from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { Primitive, dispatchDiscreteCustomEvent } from '@fictjs/primitive'
import { useCallbackRef } from '@fictjs/use-callback-ref'
import { useEscapeKeydown } from '@fictjs/use-escape-keydown'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type DismissableLayerElement = HTMLDivElement
type DismissableLayerBranchElement = HTMLDivElement
type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>
type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>
type StyleRecord = Record<string, string | number>
type CaptureEventProps = {
  'oncapture:blur'?: (event: FocusEvent) => void
  'oncapture:focus'?: (event: FocusEvent) => void
  'oncapture:pointerdown'?: (event: PointerEvent) => void
}
type DismissableLayerProps = JSX.IntrinsicElements['div'] &
  CaptureEventProps & {
    asChild?: boolean
    disableOutsidePointerEvents?: MaybeAccessor<boolean | undefined>
    onEscapeKeyDown?: (event: KeyboardEvent) => void
    onPointerDownOutside?: (event: PointerDownOutsideEvent) => void
    onFocusOutside?: (event: FocusOutsideEvent) => void
    onInteractOutside?: (event: PointerDownOutsideEvent | FocusOutsideEvent) => void
    onDismiss?: () => void
  }
type DismissableLayerBranchProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}

const DISMISSABLE_LAYER_NAME = 'DismissableLayer'
const BRANCH_NAME = 'DismissableLayerBranch'
const CONTEXT_UPDATE = 'dismissableLayer.update'
const POINTER_DOWN_OUTSIDE = 'dismissableLayer.pointerDownOutside'
const FOCUS_OUTSIDE = 'dismissableLayer.focusOutside'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

let originalBodyPointerEvents = ''

const DismissableLayerContext = createContext({
  branches: new Set<DismissableLayerBranchElement>(),
  layers: new Set<DismissableLayerElement>(),
  layersWithOutsidePointerEventsDisabled: new Set<DismissableLayerElement>(),
})

function pruneDisconnectedElements<T extends Element>(elements: Set<T>) {
  for (const element of elements) {
    if (!element.isConnected) {
      elements.delete(element)
    }
  }
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

  for (let depth = 0; depth < 10 && isReadableAccessor(currentValue as MaybeAccessor<unknown>); depth += 1) {
    currentValue = (currentValue as () => unknown)()
  }

  return currentValue as T
}

function readStyle(value: unknown): StyleRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as StyleRecord
}

function DismissableLayer(props: DismissableLayerProps): FictNode {
  const disableOutsidePointerEvents = () =>
    Boolean(readValue(props.disableOutsidePointerEvents as MaybeAccessor<boolean | undefined>))
  const context = useContext(DismissableLayerContext)
  const node = createSignal<DismissableLayerElement | null>(null)
  const layerVersion = createSignal(0)
  const ownerDocument = () => node()?.ownerDocument ?? globalThis.document
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<DismissableLayerElement>,
    (nextNode) => node(nextNode),
  )

  const pruneLayerState = () => {
    pruneDisconnectedElements(context.layers)
    pruneDisconnectedElements(context.layersWithOutsidePointerEventsDisabled)
  }
  const getLayers = () => {
    pruneLayerState()
    return Array.from(context.layers)
  }
  const getIndex = () => {
    const currentNode = node()
    return currentNode ? getLayers().indexOf(currentNode) : -1
  }
  const getHighestDisabledIndex = () => {
    pruneLayerState()
    const highestLayer = [...context.layersWithOutsidePointerEventsDisabled].slice(-1)[0]
    return highestLayer ? getLayers().indexOf(highestLayer) : -1
  }
  const isBodyPointerEventsDisabled = () => {
    pruneLayerState()
    return context.layersWithOutsidePointerEventsDisabled.size > 0
  }
  const isPointerEventsEnabled = () => getIndex() >= getHighestDisabledIndex()

  const pointerDownOutside = usePointerDownOutside((event) => {
    const target = event.target as HTMLElement | null
    const isPointerDownOnBranch =
      !!target && [...context.branches].some((branch) => branch.contains(target))

    if (!isPointerEventsEnabled() || isPointerDownOnBranch) return

    props.onPointerDownOutside?.(event)
    props.onInteractOutside?.(event)
    if (!event.defaultPrevented) props.onDismiss?.()
  }, ownerDocument)

  const focusOutside = useFocusOutside((event) => {
    const target = event.target as HTMLElement | null
    const isFocusInBranch =
      !!target && [...context.branches].some((branch) => branch.contains(target))

    if (isFocusInBranch) return

    props.onFocusOutside?.(event)
    props.onInteractOutside?.(event)
    if (!event.defaultPrevented) props.onDismiss?.()
  }, ownerDocument)

  useEscapeKeydown((event) => {
    const isHighestLayer = getIndex() === context.layers.size - 1
    if (!isHighestLayer) return

    props.onEscapeKeyDown?.(event)
    if (!event.defaultPrevented && props.onDismiss) {
      event.preventDefault()
      props.onDismiss()
    }
  }, ownerDocument())

  useLayoutEffect(() => {
    const currentNode = node()
    const currentDocument = ownerDocument()
    if (!currentNode || !currentDocument) {
      return
    }

    pruneLayerState()

    const shouldDisableOutsidePointerEvents = disableOutsidePointerEvents()

    if (shouldDisableOutsidePointerEvents) {
      if (context.layersWithOutsidePointerEventsDisabled.size === 0) {
        originalBodyPointerEvents = currentDocument.body.style.pointerEvents
        currentDocument.body.style.pointerEvents = 'none'
      }

      context.layersWithOutsidePointerEventsDisabled.add(currentNode)
    }

    context.layers.add(currentNode)
    dispatchUpdate(currentDocument)

    return () => {
      context.layers.delete(currentNode)
      context.layersWithOutsidePointerEventsDisabled.delete(currentNode)
      const restoreBodyPointerEvents = () => {
        pruneLayerState()

        if (
          shouldDisableOutsidePointerEvents &&
          context.layersWithOutsidePointerEventsDisabled.size === 0
        ) {
          currentDocument.body.style.pointerEvents = originalBodyPointerEvents
        }
      }

      restoreBodyPointerEvents()
      queueMicrotask(restoreBodyPointerEvents)

      dispatchUpdate(currentDocument)
    }
  })

  useLayoutEffect(() => {
    const currentNode = node()
    const currentDocument = ownerDocument()
    if (!currentNode || !currentDocument) {
      return
    }

    const handleUpdate = () => {
      layerVersion(layerVersion() + 1)
    }

    currentDocument.addEventListener(CONTEXT_UPDATE, handleUpdate)
    return () => {
      currentDocument.removeEventListener(CONTEXT_UPDATE, handleUpdate)
    }
  })

  useLayoutEffect(() => {
    const forwardedRef = props.ref as PossibleRef<DismissableLayerElement>
    if (!forwardedRef) return

    return () => {
      if (typeof forwardedRef === 'function') {
        forwardedRef(null)
        return
      }

      forwardedRef.current = null
    }
  })

  const primitiveProps = mergeProps(() => props as Record<string, unknown>, {
    disableOutsidePointerEvents: undefined,
    onDismiss: undefined,
    onEscapeKeyDown: undefined,
    onFocusOutside: undefined,
    onInteractOutside: undefined,
    onPointerDownOutside: undefined,
    ref: undefined,
    style: prop(() => {
      layerVersion()

      return {
        pointerEvents: isBodyPointerEventsDisabled()
          ? isPointerEventsEnabled()
            ? 'auto'
            : 'none'
          : undefined,
        ...readStyle(props.style),
      }
    }),
    'oncapture:blur': composeEventHandlers<FocusEvent>(
      props['oncapture:blur'],
      focusOutside.onBlurCapture,
    ),
    'oncapture:focus': composeEventHandlers<FocusEvent>(
      props['oncapture:focus'],
      focusOutside.onFocusCapture,
    ),
    'oncapture:pointerdown': composeEventHandlers<PointerEvent>(
      props['oncapture:pointerdown'],
      pointerDownOutside.onPointerDownCapture,
    ),
  })

  return <Primitive.div {...primitiveProps} ref={composedRefs} />
}

DismissableLayer.displayName = DISMISSABLE_LAYER_NAME

function DismissableLayerBranch(props: DismissableLayerBranchProps): FictNode {
  const context = useContext(DismissableLayerContext)
  const node = createSignal<DismissableLayerBranchElement | null>(null)
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<DismissableLayerBranchElement>,
    (nextNode) => node(nextNode),
  )

  useLayoutEffect(() => {
    const currentNode = node()
    if (!currentNode) return

    context.branches.add(currentNode)
    return () => {
      context.branches.delete(currentNode)
    }
  })

  useLayoutEffect(() => {
    const forwardedRef = props.ref as PossibleRef<DismissableLayerBranchElement>
    if (!forwardedRef) return

    return () => {
      if (typeof forwardedRef === 'function') {
        forwardedRef(null)
        return
      }

      forwardedRef.current = null
    }
  })

  return <Primitive.div {...(props as Record<string, unknown>)} ref={composedRefs} />
}

DismissableLayerBranch.displayName = BRANCH_NAME

function usePointerDownOutside(
  onPointerDownOutside: ((event: PointerDownOutsideEvent) => void) | undefined,
  ownerDocument: () => Document | undefined,
) {
  const handlePointerDownOutside = useCallbackRef(onPointerDownOutside) as EventListener
  const isPointerInsideReactTreeRef = { current: false }
  const handleClickRef = { current: () => {} }

  useLayoutEffect(() => {
    const currentDocument = ownerDocument() ?? globalThis.document
    if (!currentDocument) return

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target && !isPointerInsideReactTreeRef.current) {
        const eventDetail = { originalEvent: event }

        const handleAndDispatchPointerDownOutsideEvent = () => {
          handleAndDispatchCustomEvent(
            POINTER_DOWN_OUTSIDE,
            handlePointerDownOutside,
            eventDetail,
            { discrete: true },
          )
        }

        if (event.pointerType === 'touch') {
          currentDocument.removeEventListener('click', handleClickRef.current)
          handleClickRef.current = handleAndDispatchPointerDownOutsideEvent
          currentDocument.addEventListener('click', handleClickRef.current, { once: true })
        } else {
          handleAndDispatchPointerDownOutsideEvent()
        }
      } else {
        currentDocument.removeEventListener('click', handleClickRef.current)
      }

      isPointerInsideReactTreeRef.current = false
    }

    const timerId = window.setTimeout(() => {
      currentDocument.addEventListener('pointerdown', handlePointerDown)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
      currentDocument.removeEventListener('pointerdown', handlePointerDown)
      currentDocument.removeEventListener('click', handleClickRef.current)
    }
  })

  return {
    onPointerDownCapture: () => {
      isPointerInsideReactTreeRef.current = true
    },
  }
}

function useFocusOutside(
  onFocusOutside: ((event: FocusOutsideEvent) => void) | undefined,
  ownerDocument: () => Document | undefined,
) {
  const handleFocusOutside = useCallbackRef(onFocusOutside) as EventListener
  const isFocusInsideReactTreeRef = { current: false }

  useLayoutEffect(() => {
    const currentDocument = ownerDocument() ?? globalThis.document
    if (!currentDocument) return

    const handleFocus = (event: FocusEvent) => {
      if (event.target && !isFocusInsideReactTreeRef.current) {
        handleAndDispatchCustomEvent(
          FOCUS_OUTSIDE,
          handleFocusOutside,
          { originalEvent: event },
          { discrete: false },
        )
      }
    }

    currentDocument.addEventListener('focusin', handleFocus)
    return () => {
      currentDocument.removeEventListener('focusin', handleFocus)
    }
  })

  return {
    onBlurCapture: () => {
      isFocusInsideReactTreeRef.current = false
    },
    onFocusCapture: () => {
      isFocusInsideReactTreeRef.current = true
    },
  }
}

function dispatchUpdate(ownerDocument: Document) {
  ownerDocument.dispatchEvent(new CustomEvent(CONTEXT_UPDATE))
}

function handleAndDispatchCustomEvent<E extends CustomEvent, OriginalEvent extends Event>(
  name: string,
  handler: ((event: E) => void) | undefined,
  detail: { originalEvent: OriginalEvent } & (E extends CustomEvent<infer D> ? D : never),
  { discrete }: { discrete: boolean },
) {
  const target = detail.originalEvent.target
  const event = new CustomEvent(name, { bubbles: false, cancelable: true, detail })
  if (handler && target) {
    target.addEventListener(name, handler as EventListener, { once: true })
  }

  if (discrete) {
    dispatchDiscreteCustomEvent(target, event)
  } else {
    target?.dispatchEvent(event)
  }
}

const Root = DismissableLayer
const Branch = DismissableLayerBranch

export { DismissableLayer, DismissableLayerBranch, Root, Branch }
export type { DismissableLayerProps }
