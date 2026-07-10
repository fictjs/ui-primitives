import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
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

type DismissableLayerState = {
  branches: Set<DismissableLayerBranchElement>
  layers: Set<DismissableLayerElement>
  layersWithOutsidePointerEventsDisabled: Set<DismissableLayerElement>
  originalBodyPointerEvents: string
}

const layerStates = new WeakMap<Document, DismissableLayerState>()

function getLayerState(ownerDocument: Document): DismissableLayerState {
  const existing = layerStates.get(ownerDocument)
  if (existing) return existing

  const state: DismissableLayerState = {
    branches: new Set(),
    layers: new Set(),
    layersWithOutsidePointerEventsDisabled: new Set(),
    originalBodyPointerEvents: '',
  }
  layerStates.set(ownerDocument, state)
  return state
}

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

  for (
    let depth = 0;
    depth < 10 && isReadableAccessor(currentValue as MaybeAccessor<unknown>);
    depth += 1
  ) {
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
  const node = createSignal<DismissableLayerElement | null>(null)
  const layerVersion = createSignal(0)
  let layerVersionValue = 0
  const ownerDocument = () => node()?.ownerDocument ?? globalThis.document
  const layerState = () => getLayerState(ownerDocument())
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<DismissableLayerElement>,
    (nextNode) => node(nextNode),
  )
  const handleEscapeKeyDown = useCallbackRef<(event: KeyboardEvent) => void>(
    prop(() => props.onEscapeKeyDown),
  )
  const handlePointerDownOutsideProp = useCallbackRef<(event: PointerDownOutsideEvent) => void>(
    prop(() => props.onPointerDownOutside),
  )
  const handleFocusOutsideProp = useCallbackRef<(event: FocusOutsideEvent) => void>(
    prop(() => props.onFocusOutside),
  )
  const handleInteractOutside = useCallbackRef<
    (event: PointerDownOutsideEvent | FocusOutsideEvent) => void
  >(prop(() => props.onInteractOutside))
  const handleDismiss = useCallbackRef<() => void>(prop(() => props.onDismiss))

  const pruneLayerState = () => {
    const state = layerState()
    pruneDisconnectedElements(state.layers)
    pruneDisconnectedElements(state.layersWithOutsidePointerEventsDisabled)
  }
  const getLayers = () => {
    pruneLayerState()
    return Array.from(layerState().layers)
  }
  const getIndex = () => {
    const currentNode = node()
    return currentNode ? getLayers().indexOf(currentNode) : -1
  }
  const getHighestDisabledIndex = () => {
    pruneLayerState()
    const highestLayer = [...layerState().layersWithOutsidePointerEventsDisabled].slice(-1)[0]
    return highestLayer ? getLayers().indexOf(highestLayer) : -1
  }
  const isBodyPointerEventsDisabled = () => {
    pruneLayerState()
    return layerState().layersWithOutsidePointerEventsDisabled.size > 0
  }
  const isPointerEventsEnabled = () => getIndex() >= getHighestDisabledIndex()

  const pointerDownOutside = usePointerDownOutside((event) => {
    const state = layerState()
    const target = event.target as HTMLElement | null
    const isPointerDownOnBranch =
      !!target && [...state.branches].some((branch) => branch.contains(target))

    if (!isPointerEventsEnabled() || isPointerDownOnBranch) return

    handlePointerDownOutsideProp(event)
    handleInteractOutside(event)
    if (!event.defaultPrevented) handleDismiss()
  }, ownerDocument)

  const focusOutside = useFocusOutside((event) => {
    const state = layerState()
    const target = event.target as HTMLElement | null
    const isFocusInBranch =
      !!target && [...state.branches].some((branch) => branch.contains(target))

    if (isFocusInBranch) return

    handleFocusOutsideProp(event)
    handleInteractOutside(event)
    if (!event.defaultPrevented) handleDismiss()
  }, ownerDocument)

  useLayoutEffect(() => {
    const currentNode = node()
    const currentDocument = ownerDocument()
    if (!currentNode || !currentDocument) {
      return
    }

    pruneLayerState()
    const state = getLayerState(currentDocument)

    const shouldDisableOutsidePointerEvents = disableOutsidePointerEvents()

    if (shouldDisableOutsidePointerEvents) {
      if (state.layersWithOutsidePointerEventsDisabled.size === 0) {
        state.originalBodyPointerEvents = currentDocument.body.style.pointerEvents
        currentDocument.body.style.pointerEvents = 'none'
      }

      state.layersWithOutsidePointerEventsDisabled.add(currentNode)
    }

    state.layers.add(currentNode)
    dispatchUpdate(currentDocument)

    return () => {
      state.layers.delete(currentNode)
      state.layersWithOutsidePointerEventsDisabled.delete(currentNode)
      const restoreBodyPointerEvents = () => {
        pruneLayerState()

        if (
          shouldDisableOutsidePointerEvents &&
          state.layersWithOutsidePointerEventsDisabled.size === 0
        ) {
          currentDocument.body.style.pointerEvents = state.originalBodyPointerEvents
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
      layerVersionValue += 1
      layerVersion(layerVersionValue)
    }

    currentDocument.addEventListener(CONTEXT_UPDATE, handleUpdate)
    return () => {
      currentDocument.removeEventListener(CONTEXT_UPDATE, handleUpdate)
    }
  })

  useEscapeKeydown((event) => {
    const state = layerState()
    const isHighestLayer = getIndex() === state.layers.size - 1
    if (!isHighestLayer) return

    handleEscapeKeyDown(event)
    if (!event.defaultPrevented && props.onDismiss) {
      event.preventDefault()
      handleDismiss()
    }
  }, ownerDocument)

  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      disableOutsidePointerEvents: undefined,
      children: undefined,
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
        (event) => props['oncapture:blur']?.(event),
        focusOutside.onBlurCapture,
      ),
      'oncapture:focus': composeEventHandlers<FocusEvent>(
        (event) => props['oncapture:focus']?.(event),
        focusOutside.onFocusCapture,
      ),
      'oncapture:pointerdown': composeEventHandlers<PointerEvent>(
        (event) => props['oncapture:pointerdown']?.(event),
        pointerDownOutside.onPointerDownCapture,
      ),
    },
  )

  return (
    <Primitive.div {...primitiveProps} ref={composedRefs}>
      {props.children}
    </Primitive.div>
  )
}

DismissableLayer.displayName = DISMISSABLE_LAYER_NAME

function DismissableLayerBranch(props: DismissableLayerBranchProps): FictNode {
  const node = createSignal<DismissableLayerBranchElement | null>(null)
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<DismissableLayerBranchElement>,
    (nextNode) => node(nextNode),
  )

  useLayoutEffect(() => {
    const currentNode = node()
    if (!currentNode) return

    const state = getLayerState(currentNode.ownerDocument)
    state.branches.add(currentNode)
    return () => {
      state.branches.delete(currentNode)
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

  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      ref: undefined,
    },
  )

  return <Primitive.div {...primitiveProps} ref={composedRefs} />
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

    const ownerWindow = currentDocument.defaultView ?? globalThis.window
    const timerId = ownerWindow.setTimeout(() => {
      currentDocument.addEventListener('pointerdown', handlePointerDown)
    }, 0)

    return () => {
      ownerWindow.clearTimeout(timerId)
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
