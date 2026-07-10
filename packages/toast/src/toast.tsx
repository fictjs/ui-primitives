import {
  createElement,
  createPortal as createFictPortal,
  mergeProps,
  prop,
  type FictNode,
  type JSX,
} from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { createCollection } from '@fictjs/collection'
import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { DismissableLayerBranch } from '@fictjs/dismissable-layer'
import { Presence } from '@fictjs/presence'
import { Primitive, dispatchDiscreteCustomEvent } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'
import { VisuallyHidden } from '@fictjs/visually-hidden'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeToast?: Scope }
type SwipeDirection = 'up' | 'down' | 'left' | 'right'
type ToastType = 'foreground' | 'background'
type ToastViewportElement = HTMLOListElement
type ToastElement = HTMLLIElement
type ToastSwipeDelta = { x: number; y: number }
type ToastSwipeEvent = CustomEvent<{
  originalEvent: PointerEvent
  delta: ToastSwipeDelta
}>
type PrimitiveListProps = JSX.IntrinsicElements['ol'] & {
  asChild?: boolean
}
type PrimitiveItemProps = JSX.IntrinsicElements['li'] & {
  asChild?: boolean
}
type PrimitiveButtonProps = JSX.IntrinsicElements['button'] & {
  asChild?: boolean
}
type PrimitiveHeadingProps = JSX.IntrinsicElements['h3'] & {
  asChild?: boolean
}
type PrimitiveParagraphProps = JSX.IntrinsicElements['p'] & {
  asChild?: boolean
}
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type ToastProviderContextValue = {
  label: () => string
  duration: () => number
  swipeDirection: () => SwipeDirection
  swipeThreshold: () => number
  viewport: () => ToastViewportElement | null
  onViewportChange(viewport: ToastViewportElement | null): void
  toastCount: () => number
  onToastAdd(): void
  onToastRemove(): void
  announcerContainer: () => Element | DocumentFragment | null
  isClosePausedRef: { current: boolean }
}
type ToastContextValue = {
  open: () => boolean
  onOpenChange(open: boolean): void
  close(): void
}
type SwipeState = 'start' | 'move' | 'cancel' | 'end'
type StyleRecord = Record<string, string | number>

const PROVIDER_NAME = 'ToastProvider'
const VIEWPORT_NAME = 'ToastViewport'
const TOAST_NAME = 'Toast'
const TITLE_NAME = 'ToastTitle'
const DESCRIPTION_NAME = 'ToastDescription'
const ACTION_NAME = 'ToastAction'
const CLOSE_NAME = 'ToastClose'
const VIEWPORT_DEFAULT_HOTKEY = ['F8']
const VIEWPORT_PAUSE = 'toast.viewportPause'
const VIEWPORT_RESUME = 'toast.viewportResume'
const TOAST_SWIPE_START = 'toast.swipeStart'
const TOAST_SWIPE_MOVE = 'toast.swipeMove'
const TOAST_SWIPE_CANCEL = 'toast.swipeCancel'
const TOAST_SWIPE_END = 'toast.swipeEnd'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [Collection, useCollection, createCollectionScope] = createCollection<ToastElement>('Toast')
const [createToastContext, createToastScope] = createContextScope('Toast', [createCollectionScope])
const [ToastProviderProvider, useToastProviderContext] =
  createToastContext<ToastProviderContextValue>(PROVIDER_NAME)
const [ToastProviderItem, useToastContext] = createToastContext<ToastContextValue>(TOAST_NAME)

type ToastProviderProps = {
  children?: FictNode | FictNode[]
  label?: MaybeAccessor<string | undefined>
  duration?: MaybeAccessor<number | undefined>
  swipeDirection?: MaybeAccessor<SwipeDirection | undefined>
  swipeThreshold?: MaybeAccessor<number | undefined>
  announcerContainer?: MaybeAccessor<Element | DocumentFragment | null | undefined>
}

type ToastViewportProps = PrimitiveListProps & {
  hotkey?: string[]
  label?: MaybeAccessor<string | undefined>
}

type ToastProps = PrimitiveItemProps & {
  open?: MaybeAccessor<boolean | undefined>
  defaultOpen?: MaybeAccessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
  duration?: MaybeAccessor<number | undefined>
  type?: MaybeAccessor<ToastType | undefined>
  forceMount?: MaybeAccessor<boolean | undefined>
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPause?: () => void
  onResume?: () => void
  onSwipeStart?: (event: ToastSwipeEvent) => void
  onSwipeMove?: (event: ToastSwipeEvent) => void
  onSwipeCancel?: (event: ToastSwipeEvent) => void
  onSwipeEnd?: (event: ToastSwipeEvent) => void
}

type ToastTitleProps = PrimitiveHeadingProps
type ToastDescriptionProps = PrimitiveParagraphProps
type ToastActionProps = PrimitiveButtonProps & {
  altText: string
}
type ToastCloseProps = PrimitiveButtonProps

function readValue<T>(value: MaybeAccessor<T>): T {
  if (
    typeof value === 'function' &&
    (value.length === 0 ||
      (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  ) {
    return (value as () => T)()
  }

  return value as T
}

function readStyle(value: unknown): StyleRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as StyleRecord
}

function getState(open: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed'
}

function getSwipeDirectionDelta(
  pointerStart: { x: number; y: number } | null,
  event: PointerEvent,
): ToastSwipeDelta {
  if (!pointerStart) {
    return { x: 0, y: 0 }
  }

  return {
    x: event.clientX - pointerStart.x,
    y: event.clientY - pointerStart.y,
  }
}

function clampDeltaToDirection(direction: SwipeDirection, delta: ToastSwipeDelta): ToastSwipeDelta {
  if (direction === 'right') return { x: Math.max(0, delta.x), y: 0 }
  if (direction === 'left') return { x: Math.min(0, delta.x), y: 0 }
  if (direction === 'down') return { x: 0, y: Math.max(0, delta.y) }
  return { x: 0, y: Math.min(0, delta.y) }
}

function isDeltaInDirection(
  direction: SwipeDirection,
  delta: ToastSwipeDelta,
  threshold = 0,
): boolean {
  const deltaX = Math.abs(delta.x)
  const deltaY = Math.abs(delta.y)
  const isHorizontal = direction === 'left' || direction === 'right'
  const isPrimaryAxis = isHorizontal ? deltaX > deltaY : deltaY >= deltaX
  const isCorrectSign =
    direction === 'right'
      ? delta.x > 0
      : direction === 'left'
        ? delta.x < 0
        : direction === 'down'
          ? delta.y > 0
          : delta.y < 0
  const distance = isHorizontal ? deltaX : deltaY

  return isPrimaryAxis && isCorrectSign && distance > threshold
}

function getTabbableCandidates(container: HTMLElement): HTMLElement[] {
  const candidates: HTMLElement[] = []
  const ownerDocument = container.ownerDocument
  const nodeFilter = ownerDocument.defaultView?.NodeFilter ?? globalThis.NodeFilter
  const walker = ownerDocument.createTreeWalker(container, nodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const element = node as HTMLElement
      const isHiddenInput = element.tagName === 'INPUT' && element.getAttribute('type') === 'hidden'
      if (
        element.hasAttribute('disabled') ||
        element.hidden ||
        isHiddenInput ||
        element.getAttribute('aria-hidden') === 'true'
      ) {
        return nodeFilter.FILTER_SKIP
      }

      return element.tabIndex >= 0 ? nodeFilter.FILTER_ACCEPT : nodeFilter.FILTER_SKIP
    },
  })

  while (walker.nextNode()) {
    candidates.push(walker.currentNode as HTMLElement)
  }

  return candidates
}

function isNodeFromDocument(value: EventTarget | null, ownerDocument: Document): value is Node {
  const NodeCtor = ownerDocument.defaultView?.Node
  return NodeCtor ? value instanceof NodeCtor : Boolean(value && 'nodeType' in value)
}

function focusFirst(candidates: HTMLElement[]): boolean {
  const previousFocusedElement = candidates[0]?.ownerDocument.activeElement

  for (const candidate of candidates) {
    candidate.focus()
    if (candidate.ownerDocument.activeElement !== previousFocusedElement) {
      return true
    }
  }

  return false
}

function getAnnounceTextContent(container: HTMLElement): string[] {
  const textContent: string[] = []

  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === node.TEXT_NODE && node.textContent) {
      textContent.push(node.textContent)
      continue
    }

    if (node.nodeType !== node.ELEMENT_NODE) continue

    const element = node as HTMLElement
    const isHidden =
      element.getAttribute('aria-hidden') === 'true' ||
      element.hidden ||
      element.style.display === 'none'
    if (isHidden) continue

    if (element.dataset.radixToastAnnounceExclude === '') {
      const altText = element.dataset.radixToastAnnounceAlt
      if (altText) textContent.push(altText)
      continue
    }

    textContent.push(...getAnnounceTextContent(element))
  }

  return textContent
}

function dispatchSwipeEvent(
  name: string,
  handler: ((event: ToastSwipeEvent) => void) | undefined,
  originalEvent: PointerEvent,
  delta: ToastSwipeDelta,
  discrete: boolean,
): ToastSwipeEvent {
  const currentTarget = originalEvent.currentTarget
  const event = new CustomEvent(name, {
    bubbles: true,
    cancelable: true,
    detail: { originalEvent, delta },
  }) as ToastSwipeEvent

  if (handler && currentTarget) {
    currentTarget.addEventListener(name, handler as EventListener, { once: true })
  }

  if (discrete) {
    dispatchDiscreteCustomEvent(currentTarget, event)
  } else {
    currentTarget?.dispatchEvent(event)
  }

  return event
}

function ToastProvider(props: ScopedProps<ToastProviderProps>): FictNode {
  const label = () =>
    props.label === undefined
      ? 'Notification'
      : (readValue(props.label as MaybeAccessor<string | undefined>) ?? 'Notification')
  const duration = () =>
    props.duration === undefined
      ? 5000
      : (readValue(props.duration as MaybeAccessor<number | undefined>) ?? 5000)
  const swipeDirection = () =>
    props.swipeDirection === undefined
      ? 'right'
      : ((readValue(props.swipeDirection as MaybeAccessor<SwipeDirection | undefined>) ??
          'right') as SwipeDirection)
  const swipeThreshold = () =>
    props.swipeThreshold === undefined
      ? 50
      : (readValue(props.swipeThreshold as MaybeAccessor<number | undefined>) ?? 50)
  const viewport = createSignal<ToastViewportElement | null>(null)
  const toastCount = createSignal(0)
  let toastCountValue = 0
  const isClosePausedRef = { current: false }
  const announcerContainer = () =>
    props.announcerContainer === undefined
      ? null
      : (readValue(
          props.announcerContainer as MaybeAccessor<Element | DocumentFragment | null | undefined>,
        ) ?? null)

  return (
    <Collection.Provider scope={props.__scopeToast}>
      <ToastProviderProvider
        scope={props.__scopeToast as Scope<ToastProviderContextValue | undefined>}
        label={label}
        duration={duration}
        swipeDirection={swipeDirection}
        swipeThreshold={swipeThreshold}
        viewport={viewport}
        onViewportChange={(nextViewport: ToastViewportElement | null) => viewport(nextViewport)}
        toastCount={toastCount}
        onToastAdd={() => {
          toastCountValue += 1
          toastCount(toastCountValue)
        }}
        onToastRemove={() => {
          toastCountValue = Math.max(0, toastCountValue - 1)
          toastCount(toastCountValue)
        }}
        announcerContainer={announcerContainer}
        isClosePausedRef={isClosePausedRef}
      >
        {props.children}
      </ToastProviderProvider>
    </Collection.Provider>
  )
}

ToastProvider.displayName = PROVIDER_NAME

function ToastViewport(props: ScopedProps<ToastViewportProps>): FictNode {
  const { __scopeToast, hotkey = VIEWPORT_DEFAULT_HOTKEY, ...viewportProps } = props
  const context = useToastProviderContext(
    VIEWPORT_NAME,
    __scopeToast as Scope<ToastProviderContextValue | undefined>,
  )
  const getItems = useCollection(__scopeToast)
  const wrapperRef = { current: null as HTMLDivElement | null }
  const headFocusProxyRef = { current: null as HTMLSpanElement | null }
  const tailFocusProxyRef = { current: null as HTMLSpanElement | null }
  const ref = { current: null as ToastViewportElement | null }
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<ToastViewportElement>,
    ref as PossibleRef<ToastViewportElement>,
    context.onViewportChange,
  )
  const label = () => {
    const nextLabel =
      props.label === undefined
        ? 'Notifications ({hotkey})'
        : (readValue(props.label as MaybeAccessor<string | undefined>) ??
          'Notifications ({hotkey})')
    const hotkeyText = hotkey.join('+').replace(/Key/g, '').replace(/Digit/g, '')
    return nextLabel.replace('{hotkey}', hotkeyText)
  }
  const getSortedTabbableCandidates = (tabbingDirection: 'forwards' | 'backwards') => {
    const toastCandidates = getItems()
      .map((item) => item.ref.current)
      .filter((item): item is ToastElement => Boolean(item))
      .map((item) => {
        const candidates = [item, ...getTabbableCandidates(item)]
        return tabbingDirection === 'forwards' ? candidates : candidates.reverse()
      })

    return (tabbingDirection === 'forwards' ? toastCandidates.reverse() : toastCandidates).flat()
  }

  useLayoutEffect(() => {
    const ownerDocument = ref.current?.ownerDocument ?? document
    const handleKeyDown = (event: KeyboardEvent) => {
      if (hotkey.length === 0) return

      const eventRecord = event as unknown as Record<string, unknown>
      const isHotkeyPressed = hotkey.every((key) => eventRecord[key] || event.code === key)
      if (isHotkeyPressed) {
        ref.current?.focus()
      }
    }

    ownerDocument.addEventListener('keydown', handleKeyDown)
    return () => {
      ownerDocument.removeEventListener('keydown', handleKeyDown)
    }
  })

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    const viewport = ref.current
    if (!wrapper || !viewport) return
    const ownerDocument = viewport.ownerDocument
    const ownerWindow = ownerDocument.defaultView ?? window

    const pause = () => {
      if (context.isClosePausedRef.current) return
      viewport.dispatchEvent(new CustomEvent(VIEWPORT_PAUSE))
      context.isClosePausedRef.current = true
    }

    const resume = () => {
      if (!context.isClosePausedRef.current) return
      viewport.dispatchEvent(new CustomEvent(VIEWPORT_RESUME))
      context.isClosePausedRef.current = false
    }

    const handleFocusOut = (event: FocusEvent) => {
      const nextTarget = event.relatedTarget
      if (isNodeFromDocument(nextTarget, ownerDocument) && wrapper.contains(nextTarget)) {
        return
      }
      resume()
    }

    const handlePointerLeave = () => {
      if (!wrapper.contains(ownerDocument.activeElement)) {
        resume()
      }
    }

    wrapper.addEventListener('pointermove', pause)
    wrapper.addEventListener('pointerleave', handlePointerLeave)
    wrapper.addEventListener('focusin', pause)
    wrapper.addEventListener('focusout', handleFocusOut)
    ownerWindow.addEventListener('blur', pause)
    ownerWindow.addEventListener('focus', resume)

    return () => {
      wrapper.removeEventListener('pointermove', pause)
      wrapper.removeEventListener('pointerleave', handlePointerLeave)
      wrapper.removeEventListener('focusin', pause)
      wrapper.removeEventListener('focusout', handleFocusOut)
      ownerWindow.removeEventListener('blur', pause)
      ownerWindow.removeEventListener('focus', resume)
    }
  })

  useLayoutEffect(() => {
    const viewport = ref.current
    if (!viewport) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMetaKey = event.altKey || event.ctrlKey || event.metaKey
      if (event.key !== 'Tab' || isMetaKey) return

      const focusedElement = viewport.ownerDocument.activeElement
      const isTabbingBackwards = event.shiftKey

      if (event.target === viewport && isTabbingBackwards) {
        headFocusProxyRef.current?.focus()
        return
      }

      const direction = isTabbingBackwards ? 'backwards' : 'forwards'
      const candidates = getSortedTabbableCandidates(direction)
      const currentIndex = candidates.findIndex((candidate) => candidate === focusedElement)
      if (focusFirst(candidates.slice(currentIndex + 1))) {
        event.preventDefault()
        return
      }

      if (isTabbingBackwards) {
        headFocusProxyRef.current?.focus()
      } else {
        tailFocusProxyRef.current?.focus()
      }
    }

    viewport.addEventListener('keydown', handleKeyDown)
    return () => {
      viewport.removeEventListener('keydown', handleKeyDown)
    }
  })

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    wrapper.style.pointerEvents = context.toastCount() > 0 ? 'auto' : 'none'
  })

  useLayoutEffect(() => {
    const forwardedRef = props.ref as PossibleRef<ToastViewportElement>
    return () => {
      context.onViewportChange(null)

      if (!forwardedRef) return

      if (typeof forwardedRef === 'function') {
        forwardedRef(null)
        return
      }

      forwardedRef.current = null
    }
  })

  const primitiveProps = mergeProps(
    {
      tabIndex: -1,
      'data-state': prop(() => (context.toastCount() > 0 ? 'open' : 'closed')),
    },
    prop(() => viewportProps as Record<string, unknown>),
    {
      __scopeToast: undefined,
      hotkey: undefined,
      label: undefined,
      ref: undefined,
    },
  )

  return (
    <DismissableLayerBranch
      ref={wrapperRef}
      role="region"
      aria-label={prop(label) as unknown as string}
      tabIndex={-1}
    >
      <ToastFocusProxy
        ref={headFocusProxyRef}
        __scopeToast={__scopeToast}
        enabled={() => context.toastCount() > 0}
        onFocusFromOutsideViewport={() => {
          focusFirst(getSortedTabbableCandidates('forwards'))
        }}
      />
      <Collection.Slot scope={__scopeToast}>
        <Primitive.ol {...primitiveProps} ref={composedRefs} />
      </Collection.Slot>
      <ToastFocusProxy
        ref={tailFocusProxyRef}
        __scopeToast={__scopeToast}
        enabled={() => context.toastCount() > 0}
        onFocusFromOutsideViewport={() => {
          focusFirst(getSortedTabbableCandidates('backwards'))
        }}
      />
    </DismissableLayerBranch>
  )
}

ToastViewport.displayName = VIEWPORT_NAME

type ToastFocusProxyProps = JSX.IntrinsicElements['span'] & {
  __scopeToast?: Scope
  enabled: () => boolean
  onFocusFromOutsideViewport(): void
}

function ToastFocusProxy(props: ToastFocusProxyProps): FictNode {
  const { __scopeToast, enabled, onFocusFromOutsideViewport, ...proxyProps } = props
  const context = useToastProviderContext(
    'ToastFocusProxy',
    __scopeToast as Scope<ToastProviderContextValue | undefined>,
  )

  return (
    <VisuallyHidden
      {...(proxyProps as Record<string, unknown>)}
      data-radix-toast-focus-proxy=""
      style={{ position: 'fixed' }}
      tabIndex={prop(() => (enabled() ? 0 : -1)) as unknown as number}
      aria-hidden={prop(() => (enabled() ? undefined : 'true')) as unknown as 'true'}
      onFocus={(event: FocusEvent) => {
        const previousFocusedElement = event.relatedTarget
        const viewport = context.viewport()
        if (
          !viewport ||
          !isNodeFromDocument(previousFocusedElement, viewport.ownerDocument) ||
          !viewport.contains(previousFocusedElement)
        ) {
          onFocusFromOutsideViewport()
        }
      }}
    />
  )
}

function Toast(props: ScopedProps<ToastProps>): FictNode {
  const { __scopeToast, forceMount, ...toastProps } = props
  const providerContext = useToastProviderContext(
    TOAST_NAME,
    __scopeToast as Scope<ToastProviderContextValue | undefined>,
  )
  const ref = { current: null as ToastElement | null }
  const node = createSignal<ToastElement | null>(null)
  const composedRefs = useComposedRefs(props.ref as PossibleRef<ToastElement>, ref, (nextNode) =>
    node(nextNode),
  )
  const openProp = () =>
    props.open === undefined
      ? undefined
      : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? true
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? true)
  const resolvedDuration = () =>
    props.duration === undefined
      ? providerContext.duration()
      : (readValue(props.duration as MaybeAccessor<number | undefined>) ??
        providerContext.duration())
  const type = () =>
    props.type === undefined
      ? 'foreground'
      : (readValue(props.type as MaybeAccessor<ToastType | undefined>) ?? 'foreground')
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: TOAST_NAME,
    onChange: (nextOpen) => props.onOpenChange?.(nextOpen),
  })
  const present = () =>
    Boolean(
      (forceMount === undefined
        ? false
        : readValue(forceMount as MaybeAccessor<boolean | undefined>)) || open(),
    )
  const remainingDuration = createSignal(0)
  const closeStartTime = createSignal(0)
  const isRegistered = { current: false }
  const timeoutRef = { current: undefined as number | undefined }
  const pointerStartRef = { current: null as { x: number; y: number } | null }
  const swipeDeltaRef = { current: null as ToastSwipeDelta | null }
  const swipeDelta = createSignal({ x: 0, y: 0 })
  const swipeState = createSignal<SwipeState | undefined>(undefined)
  const announceText = createSignal<string[] | null>(null)
  const viewport = () => providerContext.viewport()

  const clearCloseTimer = () => {
    const ownerWindow = ref.current?.ownerDocument.defaultView ?? window
    if (timeoutRef.current !== undefined) {
      ownerWindow.clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }

  const close = () => {
    clearCloseTimer()
    const currentNode = node()
    if (currentNode?.contains(currentNode.ownerDocument.activeElement)) {
      viewport()?.focus()
    }
    setOpen(false)
  }

  const startCloseTimer = (duration: number) => {
    clearCloseTimer()
    remainingDuration(duration)
    if (duration <= 0 || duration === Infinity || !open()) {
      return
    }

    closeStartTime(Date.now())
    const ownerWindow = ref.current?.ownerDocument.defaultView ?? window
    timeoutRef.current = ownerWindow.setTimeout(() => {
      close()
    }, duration)
  }

  const pauseCloseTimer = () => {
    if (timeoutRef.current === undefined) return
    clearCloseTimer()
    const elapsed = Date.now() - closeStartTime()
    remainingDuration(Math.max(0, remainingDuration() - elapsed))
  }

  const resumeCloseTimer = () => {
    if (!open()) return
    startCloseTimer(remainingDuration())
  }

  useLayoutEffect(() => {
    if (!open()) {
      clearCloseTimer()
      return
    }

    const duration = resolvedDuration()
    remainingDuration(duration)
    if (!providerContext.isClosePausedRef.current) {
      startCloseTimer(duration)
    }
    return () => {
      clearCloseTimer()
    }
  })

  useLayoutEffect(() => {
    const currentViewport = viewport()
    if (!currentViewport) return

    const handlePause = () => {
      pauseCloseTimer()
      props.onPause?.()
    }
    const handleResume = () => {
      resumeCloseTimer()
      props.onResume?.()
    }

    currentViewport.addEventListener(VIEWPORT_PAUSE, handlePause as EventListener)
    currentViewport.addEventListener(VIEWPORT_RESUME, handleResume as EventListener)
    return () => {
      currentViewport.removeEventListener(VIEWPORT_PAUSE, handlePause as EventListener)
      currentViewport.removeEventListener(VIEWPORT_RESUME, handleResume as EventListener)
    }
  })

  useLayoutEffect(() => {
    const currentNode = node()

    if (currentNode && !isRegistered.current) {
      providerContext.onToastAdd()
      isRegistered.current = true
    }

    if (!currentNode && isRegistered.current) {
      providerContext.onToastRemove()
      isRegistered.current = false
    }
  })

  useLayoutEffect(() => {
    const currentNode = node()
    if (!currentNode || !open()) {
      announceText(null)
      return
    }

    const text = getAnnounceTextContent(currentNode)
    announceText(text.length > 0 ? text : null)
  })

  useLayoutEffect(() => {
    return () => {
      clearCloseTimer()

      if (isRegistered.current) {
        providerContext.onToastRemove()
        isRegistered.current = false
      }

      const forwardedRef = props.ref as PossibleRef<ToastElement>
      if (!forwardedRef) return

      if (typeof forwardedRef === 'function') {
        forwardedRef(null)
        return
      }

      forwardedRef.current = null
    }
  })

  const primitiveProps = mergeProps(
    {
      tabIndex: 0,
      'data-state': prop(() => getState(open())),
      'data-swipe-direction': prop(providerContext.swipeDirection),
      'data-swipe': prop(swipeState),
      style: prop(() => ({
        userSelect: 'none',
        touchAction: 'none',
        '--radix-toast-swipe-move-x': `${swipeDelta().x}px`,
        '--radix-toast-swipe-move-y': `${swipeDelta().y}px`,
        '--radix-toast-swipe-end-x': `${swipeDelta().x}px`,
        '--radix-toast-swipe-end-y': `${swipeDelta().y}px`,
        ...readStyle(props.style),
      })),
    },
    prop(() => toastProps as Record<string, unknown>),
    {
      __scopeToast: undefined,
      defaultOpen: undefined,
      duration: undefined,
      forceMount: undefined,
      onEscapeKeyDown: undefined,
      onOpenChange: undefined,
      onPause: undefined,
      onResume: undefined,
      onSwipeCancel: undefined,
      onSwipeEnd: undefined,
      onSwipeMove: undefined,
      onSwipeStart: undefined,
      open: undefined,
      ref: undefined,
      type: undefined,
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event) => {
          if (event.key !== 'Escape') return

          props.onEscapeKeyDown?.(event)
          if (event.defaultPrevented) return

          event.preventDefault()
          close()
        },
      ),
      onPointerDown: composeEventHandlers<PointerEvent>(
        props.onPointerDown as ((event: PointerEvent) => void) | undefined,
        (event: PointerEvent) => {
          if (event.button !== 0) return

          pointerStartRef.current = { x: event.clientX, y: event.clientY }
          swipeDeltaRef.current = null
          swipeDelta({ x: 0, y: 0 })
          swipeState(undefined)
        },
      ),
      onPointerMove: composeEventHandlers<PointerEvent>(
        props.onPointerMove as ((event: PointerEvent) => void) | undefined,
        (event: PointerEvent) => {
          if (!pointerStartRef.current) return

          const rawDelta = getSwipeDirectionDelta(pointerStartRef.current, event)
          const direction = providerContext.swipeDirection()
          const moveStartBuffer = event.pointerType === 'touch' ? 10 : 2

          if (swipeDeltaRef.current) {
            const delta = clampDeltaToDirection(direction, rawDelta)
            swipeDeltaRef.current = delta
            const swipeEvent = dispatchSwipeEvent(
              TOAST_SWIPE_MOVE,
              props.onSwipeMove,
              event,
              delta,
              false,
            )
            if (!swipeEvent.defaultPrevented) {
              swipeDelta(delta)
              swipeState('move')
            }
            return
          }

          if (isDeltaInDirection(direction, rawDelta, moveStartBuffer)) {
            const delta = clampDeltaToDirection(direction, rawDelta)
            swipeDeltaRef.current = delta
            const swipeEvent = dispatchSwipeEvent(
              TOAST_SWIPE_START,
              props.onSwipeStart,
              event,
              delta,
              false,
            )
            if (!swipeEvent.defaultPrevented) {
              swipeDelta(delta)
              swipeState('start')
            }

            const currentTarget = event.currentTarget as Element | null
            currentTarget?.setPointerCapture?.(event.pointerId)
            return
          }

          if (Math.abs(rawDelta.x) > moveStartBuffer || Math.abs(rawDelta.y) > moveStartBuffer) {
            pointerStartRef.current = null
          }
        },
      ),
      onPointerUp: composeEventHandlers<PointerEvent>(
        props.onPointerUp as ((event: PointerEvent) => void) | undefined,
        (event: PointerEvent) => {
          const delta = swipeDeltaRef.current
          const currentTarget = event.currentTarget as Element | null
          if (currentTarget?.hasPointerCapture?.(event.pointerId)) {
            currentTarget.releasePointerCapture(event.pointerId)
          }

          swipeDeltaRef.current = null
          pointerStartRef.current = null
          if (!delta) return

          const shouldClose = isDeltaInDirection(
            providerContext.swipeDirection(),
            delta,
            providerContext.swipeThreshold(),
          )
          const swipeEvent = dispatchSwipeEvent(
            shouldClose ? TOAST_SWIPE_END : TOAST_SWIPE_CANCEL,
            shouldClose ? props.onSwipeEnd : props.onSwipeCancel,
            event,
            delta,
            true,
          )

          if (!swipeEvent.defaultPrevented) {
            swipeDelta(delta)
            swipeState(shouldClose ? 'end' : 'cancel')
            if (shouldClose) close()
          }

          currentTarget?.addEventListener('click', (clickEvent) => clickEvent.preventDefault(), {
            once: true,
          })
        },
      ),
      onPointerCancel: composeEventHandlers<PointerEvent>(
        props.onPointerCancel as ((event: PointerEvent) => void) | undefined,
        (event: PointerEvent) => {
          const delta = swipeDeltaRef.current
          const currentTarget = event.currentTarget as Element | null
          if (currentTarget?.hasPointerCapture?.(event.pointerId)) {
            currentTarget.releasePointerCapture(event.pointerId)
          }

          swipeDeltaRef.current = null
          pointerStartRef.current = null
          if (!delta) return

          const swipeEvent = dispatchSwipeEvent(
            TOAST_SWIPE_CANCEL,
            props.onSwipeCancel,
            event,
            delta,
            true,
          )
          if (!swipeEvent.defaultPrevented) {
            swipeDelta(delta)
            swipeState('cancel')
          }
        },
      ),
    },
  )

  return (
    <ToastProviderItem
      scope={__scopeToast as Scope<ToastContextValue | undefined>}
      open={open}
      onOpenChange={setOpen}
      close={close}
    >
      <Presence present={present}>
        {() => {
          const currentViewport = viewport()
          if (!currentViewport || (!present() && !open())) {
            return null
          }

          const interactivePortal = createFictPortal(
            currentViewport,
            () => (
              <Collection.ItemSlot scope={__scopeToast}>
                <Primitive.li {...primitiveProps} ref={composedRefs}>
                  {props.children}
                </Primitive.li>
              </Collection.ItemSlot>
            ),
            createElement,
          ) as unknown as FictNode

          return (
            <>
              {reactive(() => {
                const text = announceText()
                return text ? (
                  <ToastAnnounce
                    __scopeToast={__scopeToast}
                    type={type()}
                    text={text}
                    {...(node()?.ownerDocument ? { ownerDocument: node()!.ownerDocument } : {})}
                  />
                ) : null
              })}
              {interactivePortal}
            </>
          )
        }}
      </Presence>
    </ToastProviderItem>
  )
}

Toast.displayName = TOAST_NAME

type ToastAnnounceProps = {
  __scopeToast?: Scope
  ownerDocument?: Document
  type: ToastType
  text: string[]
}

function ToastAnnounce(props: ToastAnnounceProps): FictNode {
  const context = useToastProviderContext(
    TOAST_NAME,
    props.__scopeToast as Scope<ToastProviderContextValue | undefined>,
  )
  const renderText = createSignal(false)
  const ownerDocument = props.ownerDocument ?? globalThis.document
  const container = context.announcerContainer() ?? ownerDocument?.body ?? null

  useLayoutEffect(() => {
    const ownerWindow = ownerDocument?.defaultView ?? window
    const timerId = ownerWindow.setTimeout(() => renderText(true))
    return () => {
      ownerWindow.clearTimeout(timerId)
    }
  })

  if (!container) return null

  return createFictPortal(
    container,
    () => (
      <VisuallyHidden
        role="status"
        aria-live={props.type === 'foreground' ? 'assertive' : 'polite'}
        aria-atomic="true"
        data-radix-toast-announcer=""
      >
        <>{reactive(() => (renderText() ? `${context.label()} ${props.text.join(' ')}` : null))}</>
      </VisuallyHidden>
    ),
    createElement,
  ) as unknown as FictNode
}

function ToastTitle(props: ScopedProps<ToastTitleProps>): FictNode {
  const { __scopeToast: _scope, ...titleProps } = props
  return <Primitive.h3 {...(titleProps as Record<string, unknown>)} />
}

ToastTitle.displayName = TITLE_NAME

function ToastDescription(props: ScopedProps<ToastDescriptionProps>): FictNode {
  const { __scopeToast: _scope, ...descriptionProps } = props
  return <Primitive.p {...(descriptionProps as Record<string, unknown>)} />
}

ToastDescription.displayName = DESCRIPTION_NAME

function ToastAction(props: ScopedProps<ToastActionProps>): FictNode {
  const { altText, ...actionProps } = props

  if (!altText.trim()) {
    console.error(
      `Invalid prop \`altText\` supplied to \`${ACTION_NAME}\`. Expected non-empty \`string\`.`,
    )
    return null
  }

  return (
    <ToastClose
      {...actionProps}
      data-radix-toast-announce-exclude=""
      data-radix-toast-announce-alt={altText}
    />
  )
}

ToastAction.displayName = ACTION_NAME

function ToastClose(props: ScopedProps<ToastCloseProps>): FictNode {
  const context = useToastContext(
    CLOSE_NAME,
    props.__scopeToast as Scope<ToastContextValue | undefined>,
  )
  const primitiveProps = mergeProps(
    {
      type: 'button',
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeToast: undefined,
      'data-radix-toast-announce-exclude': '',
      onClick: composeEventHandlers<MouseEvent>(
        props.onClick as ((event: MouseEvent) => void) | undefined,
        () => {
          context.close()
        },
      ),
    },
  )

  return <Primitive.button {...primitiveProps} />
}

ToastClose.displayName = CLOSE_NAME

const Provider = ToastProvider
const Viewport = ToastViewport
const Root = Toast
const Title = ToastTitle
const Description = ToastDescription
const Action = ToastAction
const Close = ToastClose

export {
  createToastScope,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  Provider,
  Viewport,
  Root,
  Title,
  Description,
  Action,
  Close,
  VIEWPORT_PAUSE,
  VIEWPORT_RESUME,
}

export type {
  SwipeDirection,
  ToastType,
  ToastSwipeEvent,
  ToastProviderProps,
  ToastViewportProps,
  ToastProps,
  ToastTitleProps,
  ToastDescriptionProps,
  ToastActionProps,
  ToastCloseProps,
}
