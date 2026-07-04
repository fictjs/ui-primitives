import {
  createElement,
  createPortal as createFictPortal,
  mergeProps,
  prop,
  type FictNode,
  type JSX,
} from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'
import { VisuallyHidden } from '@fictjs/visually-hidden'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeToast?: Scope }
type SwipeDirection = 'up' | 'down' | 'left' | 'right'
type ToastViewportElement = HTMLOListElement
type ToastElement = HTMLLIElement
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
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createToastContext, createToastScope] = createContextScope('Toast')
const [ToastProviderProvider, useToastProviderContext] =
  createToastContext<ToastProviderContextValue>(PROVIDER_NAME)
const [ToastProviderItem, useToastContext] = createToastContext<ToastContextValue>(TOAST_NAME)

type ToastProviderProps = {
  children?: FictNode | FictNode[]
  label?: MaybeAccessor<string | undefined>
  duration?: MaybeAccessor<number | undefined>
  swipeDirection?: MaybeAccessor<SwipeDirection | undefined>
  swipeThreshold?: MaybeAccessor<number | undefined>
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
  forceMount?: MaybeAccessor<boolean | undefined>
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
): { x: number; y: number } {
  if (!pointerStart) {
    return { x: 0, y: 0 }
  }

  return {
    x: event.clientX - pointerStart.x,
    y: event.clientY - pointerStart.y,
  }
}

function isDeltaInDirection(direction: SwipeDirection, delta: { x: number; y: number }): boolean {
  if (direction === 'right') return delta.x >= 0 && Math.abs(delta.x) >= Math.abs(delta.y)
  if (direction === 'left') return delta.x <= 0 && Math.abs(delta.x) >= Math.abs(delta.y)
  if (direction === 'down') return delta.y >= 0 && Math.abs(delta.y) >= Math.abs(delta.x)
  return delta.y <= 0 && Math.abs(delta.y) >= Math.abs(delta.x)
}

function isDeltaPastThreshold(
  direction: SwipeDirection,
  delta: { x: number; y: number },
  threshold: number,
): boolean {
  if (!isDeltaInDirection(direction, delta)) {
    return false
  }

  const distance =
    direction === 'left' || direction === 'right' ? Math.abs(delta.x) : Math.abs(delta.y)
  return distance >= threshold
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
  const isClosePausedRef = { current: false }

  return (
    <ToastProviderProvider
      scope={props.__scopeToast as Scope<ToastProviderContextValue | undefined>}
      label={label}
      duration={duration}
      swipeDirection={swipeDirection}
      swipeThreshold={swipeThreshold}
      viewport={viewport}
      onViewportChange={(nextViewport: ToastViewportElement | null) => viewport(nextViewport)}
      toastCount={toastCount}
      onToastAdd={() => toastCount(toastCount() + 1)}
      onToastRemove={() => toastCount(Math.max(0, toastCount() - 1))}
      isClosePausedRef={isClosePausedRef}
    >
      {props.children}
    </ToastProviderProvider>
  )
}

ToastProvider.displayName = PROVIDER_NAME

function ToastViewport(props: ScopedProps<ToastViewportProps>): FictNode {
  const { __scopeToast, hotkey = VIEWPORT_DEFAULT_HOTKEY, ...viewportProps } = props
  const context = useToastProviderContext(
    VIEWPORT_NAME,
    __scopeToast as Scope<ToastProviderContextValue | undefined>,
  )
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

  useLayoutEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (hotkey.length === 0) return

      const eventRecord = event as unknown as Record<string, unknown>
      const isHotkeyPressed = hotkey.every((key) => eventRecord[key] || event.code === key)
      if (isHotkeyPressed) {
        ref.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  })

  useLayoutEffect(() => {
    const viewport = ref.current
    if (!viewport) return

    const pause = () => {
      if (context.isClosePausedRef.current) return
      context.isClosePausedRef.current = true
      viewport.dispatchEvent(new CustomEvent(VIEWPORT_PAUSE))
    }

    const resume = () => {
      if (!context.isClosePausedRef.current) return
      context.isClosePausedRef.current = false
      viewport.dispatchEvent(new CustomEvent(VIEWPORT_RESUME))
    }

    const handleFocusOut = (event: FocusEvent) => {
      const nextTarget = event.relatedTarget
      if (nextTarget instanceof Node && viewport.contains(nextTarget)) {
        return
      }
      resume()
    }

    viewport.addEventListener('pointermove', pause)
    viewport.addEventListener('pointerleave', resume)
    viewport.addEventListener('focusin', pause)
    viewport.addEventListener('focusout', handleFocusOut)
    window.addEventListener('blur', pause)
    window.addEventListener('focus', resume)

    return () => {
      viewport.removeEventListener('pointermove', pause)
      viewport.removeEventListener('pointerleave', resume)
      viewport.removeEventListener('focusin', pause)
      viewport.removeEventListener('focusout', handleFocusOut)
      window.removeEventListener('blur', pause)
      window.removeEventListener('focus', resume)
    }
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
      role: 'region',
      tabIndex: -1,
      'aria-label': prop(label),
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

  return <Primitive.ol {...primitiveProps} ref={composedRefs} />
}

ToastViewport.displayName = VIEWPORT_NAME

function Toast(props: ScopedProps<ToastProps>): FictNode {
  const { __scopeToast, forceMount, ...toastProps } = props
  const providerContext = useToastProviderContext(
    TOAST_NAME,
    __scopeToast as Scope<ToastProviderContextValue | undefined>,
  )
  const ref = { current: null as ToastElement | null }
  const composedRefs = useComposedRefs(props.ref as PossibleRef<ToastElement>, ref)
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
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: TOAST_NAME,
    ...(props.onOpenChange ? { onChange: props.onOpenChange } : {}),
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
  const timeoutRef = { current: 0 as number | undefined }
  const pointerStartRef = { current: null as { x: number; y: number } | null }
  const swipeDelta = createSignal({ x: 0, y: 0 })
  const swipeState = createSignal<SwipeState | undefined>(undefined)
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
    setOpen(false)
  }

  const startCloseTimer = (duration: number) => {
    clearCloseTimer()
    if (duration <= 0 || !open()) {
      return
    }

    remainingDuration(duration)
    closeStartTime(Date.now())
    const ownerWindow = ref.current?.ownerDocument.defaultView ?? window
    timeoutRef.current = ownerWindow.setTimeout(() => {
      close()
    }, duration)
  }

  const pauseCloseTimer = () => {
    if (!timeoutRef.current) return
    clearCloseTimer()
    const elapsed = Date.now() - closeStartTime()
    remainingDuration(Math.max(0, remainingDuration() - elapsed))
  }

  const resumeCloseTimer = () => {
    if (!open()) return
    startCloseTimer(remainingDuration() || resolvedDuration())
  }

  useLayoutEffect(() => {
    if (!open()) {
      clearCloseTimer()
      return
    }

    startCloseTimer(resolvedDuration())
    return () => {
      clearCloseTimer()
    }
  })

  useLayoutEffect(() => {
    const currentViewport = viewport()
    if (!currentViewport) return

    const handlePause = () => {
      pauseCloseTimer()
    }
    const handleResume = () => {
      resumeCloseTimer()
    }

    currentViewport.addEventListener(VIEWPORT_PAUSE, handlePause as EventListener)
    currentViewport.addEventListener(VIEWPORT_RESUME, handleResume as EventListener)
    return () => {
      currentViewport.removeEventListener(VIEWPORT_PAUSE, handlePause as EventListener)
      currentViewport.removeEventListener(VIEWPORT_RESUME, handleResume as EventListener)
    }
  })

  useLayoutEffect(() => {
    if (open() && !isRegistered.current) {
      providerContext.onToastAdd()
      isRegistered.current = true
    }

    if (!open() && isRegistered.current) {
      providerContext.onToastRemove()
      isRegistered.current = false
    }
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
      role: 'status',
      tabIndex: 0,
      'aria-live': 'off',
      'data-state': prop(() => getState(open())),
      'data-swipe-direction': prop(providerContext.swipeDirection),
      'data-swipe': prop(swipeState),
      style: prop(() => ({
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
      onOpenChange: undefined,
      open: undefined,
      ref: undefined,
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            close()
          }
        },
      ),
      onPointerDown: composeEventHandlers<PointerEvent>(
        props.onPointerDown as ((event: PointerEvent) => void) | undefined,
        (event: PointerEvent) => {
          pointerStartRef.current = { x: event.clientX, y: event.clientY }
          swipeState('start')
          swipeDelta({ x: 0, y: 0 })
        },
      ),
      onPointerMove: composeEventHandlers<PointerEvent>(
        props.onPointerMove as ((event: PointerEvent) => void) | undefined,
        (event: PointerEvent) => {
          if (!pointerStartRef.current) return

          const delta = getSwipeDirectionDelta(pointerStartRef.current, event)
          swipeDelta(delta)
          swipeState(
            isDeltaInDirection(providerContext.swipeDirection(), delta) ? 'move' : 'cancel',
          )
        },
      ),
      onPointerUp: composeEventHandlers<PointerEvent>(
        props.onPointerUp as ((event: PointerEvent) => void) | undefined,
        (event: PointerEvent) => {
          if (!pointerStartRef.current) return

          const delta = getSwipeDirectionDelta(pointerStartRef.current, event)
          const shouldClose = isDeltaPastThreshold(
            providerContext.swipeDirection(),
            delta,
            providerContext.swipeThreshold(),
          )
          swipeDelta(delta)
          swipeState(shouldClose ? 'end' : 'cancel')
          pointerStartRef.current = null

          if (shouldClose) {
            close()
            return
          }

          setTimeout(() => {
            swipeState(undefined)
            swipeDelta({ x: 0, y: 0 })
          }, 0)
        },
      ),
      onMouseEnter: composeEventHandlers<MouseEvent>(
        props.onMouseEnter as ((event: MouseEvent) => void) | undefined,
        (_event: MouseEvent) => {
          pauseCloseTimer()
        },
      ),
      onMouseLeave: composeEventHandlers<MouseEvent>(
        props.onMouseLeave as ((event: MouseEvent) => void) | undefined,
        (_event: MouseEvent) => {
          resumeCloseTimer()
        },
      ),
      onFocusIn: composeEventHandlers<FocusEvent>(
        (props as Record<string, unknown>).onFocusIn as ((event: FocusEvent) => void) | undefined,
        () => {
          pauseCloseTimer()
        },
      ),
      onFocusOut: composeEventHandlers<FocusEvent>(
        (props as Record<string, unknown>).onFocusOut as ((event: FocusEvent) => void) | undefined,
        (event: FocusEvent) => {
          const relatedTarget = event.relatedTarget
          if (relatedTarget instanceof Node && ref.current?.contains(relatedTarget)) {
            return
          }

          resumeCloseTimer()
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

          return createFictPortal(
            currentViewport,
            () => (
              <Primitive.li {...primitiveProps} ref={composedRefs}>
                <VisuallyHidden>{providerContext.label()}</VisuallyHidden>
                {props.children}
              </Primitive.li>
            ),
            createElement,
          ) as unknown as FictNode
        }}
      </Presence>
    </ToastProviderItem>
  )
}

Toast.displayName = TOAST_NAME

function ToastTitle(props: ScopedProps<ToastTitleProps>): FictNode {
  return <Primitive.h3 {...(props as Record<string, unknown>)} />
}

ToastTitle.displayName = TITLE_NAME

function ToastDescription(props: ScopedProps<ToastDescriptionProps>): FictNode {
  return <Primitive.p {...(props as Record<string, unknown>)} />
}

ToastDescription.displayName = DESCRIPTION_NAME

function ToastAction(props: ScopedProps<ToastActionProps>): FictNode {
  const { altText, ...actionProps } = props

  if (!altText.trim()) {
    console.error(
      `Invalid prop \`altText\` supplied to \`${ACTION_NAME}\`. Expected non-empty \`string\`.`,
    )
  }

  return <Primitive.button {...actionProps} aria-label={altText} />
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
  ToastProviderProps,
  ToastViewportProps,
  ToastProps,
  ToastTitleProps,
  ToastDescriptionProps,
  ToastActionProps,
  ToastCloseProps,
}
