import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import {
  DismissableLayer,
  type DismissableLayerProps,
} from '@fictjs/dismissable-layer'
import { useId } from '@fictjs/id'
import {
  createPopperScope,
  Popper as PopperRoot,
  PopperAnchor as PopperAnchorPrimitive,
  PopperArrow as PopperArrowPrimitive,
  PopperContent as PopperContentPrimitive,
  type PopperArrowProps as PopperArrowPrimitiveProps,
  type PopperContentProps as PopperContentPrimitiveProps,
} from '@fictjs/popper'
import { Portal as PortalPrimitive, type PortalProps as PortalPrimitiveProps } from '@fictjs/portal'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { createSlottable } from '@fictjs/slot'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'
import { VisuallyHidden } from '@fictjs/visually-hidden'

type MaybeAccessor<T> = T | (() => T)
type PrimitiveButtonProps = JSX.IntrinsicElements['button'] & {
  asChild?: boolean
}
type ScopedProps<P> = P & { __scopeTooltip?: Scope }
type Point = { x: number; y: number }
type Polygon = Point[]
type Side = 'top' | 'right' | 'bottom' | 'left'
type StyleRecord = Record<string, string | number>

const PROVIDER_NAME = 'TooltipProvider'
const TOOLTIP_NAME = 'Tooltip'
const TRIGGER_NAME = 'TooltipTrigger'
const PORTAL_NAME = 'TooltipPortal'
const CONTENT_NAME = 'TooltipContent'
const ARROW_NAME = 'TooltipArrow'
const DEFAULT_DELAY_DURATION = 700
const TOOLTIP_OPEN = 'tooltip.open'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createTooltipContext, createTooltipScope] = createContextScope(TOOLTIP_NAME, [
  createPopperScope,
])
const usePopperScope = createPopperScope()

type TooltipProviderContextValue = {
  isOpenDelayedRef: { current: boolean }
  delayDuration: () => number
  onOpen(): void
  onClose(): void
  onPointerInTransitChange(inTransit: boolean): void
  isPointerInTransitRef: { current: boolean }
  disableHoverableContent: () => boolean
}

type TooltipContextValue = {
  contentId: () => string
  open: () => boolean
  stateAttribute: () => 'closed' | 'delayed-open' | 'instant-open'
  trigger: { current: HTMLButtonElement | null }
  onTriggerChange(trigger: HTMLButtonElement | null): void
  onTriggerEnter(): void
  onTriggerLeave(): void
  onOpen(): void
  onClose(): void
  disableHoverableContent: () => boolean
}

type PortalContextValue = {
  forceMount: boolean | undefined
}

type VisuallyHiddenContentContextValue = {
  isInside: boolean
}

const [TooltipProviderContextProvider, useTooltipProviderContext] =
  createTooltipContext<TooltipProviderContextValue>(PROVIDER_NAME)
const [TooltipContextProvider, useTooltipContext] =
  createTooltipContext<TooltipContextValue>(TOOLTIP_NAME)
const [PortalProvider, usePortalContext] = createTooltipContext<PortalContextValue>(PORTAL_NAME, {
  forceMount: undefined,
})
const [VisuallyHiddenContentContextProvider, useVisuallyHiddenContentContext] =
  createTooltipContext<VisuallyHiddenContentContextValue>(TOOLTIP_NAME, { isInside: false })

type TooltipProviderProps = {
  children?: FictNode | FictNode[]
  delayDuration?: MaybeAccessor<number | undefined>
  skipDelayDuration?: MaybeAccessor<number | undefined>
  disableHoverableContent?: MaybeAccessor<boolean | undefined>
}

type TooltipProps = {
  children?: FictNode | FictNode[]
  open?: MaybeAccessor<boolean | undefined>
  defaultOpen?: MaybeAccessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
  delayDuration?: MaybeAccessor<number | undefined>
  disableHoverableContent?: MaybeAccessor<boolean | undefined>
}

type TooltipTriggerProps = PrimitiveButtonProps

type TooltipPortalProps = {
  children?: FictNode | FictNode[]
  container?: PortalPrimitiveProps['container']
  forceMount?: MaybeAccessor<boolean | undefined>
}

type TooltipContentImplProps = Omit<PopperContentPrimitiveProps, 'onPlaced'> & {
  'aria-label'?: string
  onEscapeKeyDown?: DismissableLayerProps['onEscapeKeyDown']
  onPointerDownOutside?: DismissableLayerProps['onPointerDownOutside']
}

type TooltipContentProps = TooltipContentImplProps & {
  forceMount?: MaybeAccessor<boolean | undefined>
}

type TooltipArrowProps = PopperArrowPrimitiveProps

const Slottable = createSlottable('TooltipContent')

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

function readStyle(value: MaybeAccessor<unknown> | undefined): StyleRecord {
  const resolved = value === undefined ? undefined : readValue(value)

  if (!resolved || typeof resolved !== 'object' || Array.isArray(resolved)) {
    return {}
  }

  return resolved as StyleRecord
}

function TooltipProvider(props: ScopedProps<TooltipProviderProps>): FictNode {
  const delayDuration = () =>
    props.delayDuration === undefined
      ? DEFAULT_DELAY_DURATION
      : (readValue(props.delayDuration as MaybeAccessor<number | undefined>) ??
        DEFAULT_DELAY_DURATION)
  const skipDelayDuration = () =>
    props.skipDelayDuration === undefined
      ? 300
      : (readValue(props.skipDelayDuration as MaybeAccessor<number | undefined>) ?? 300)
  const disableHoverableContent = () =>
    Boolean(readValue(props.disableHoverableContent as MaybeAccessor<boolean | undefined>))
  const isOpenDelayedRef = { current: true }
  const isPointerInTransitRef = { current: false }
  const skipDelayTimerRef = { current: 0 }

  useLayoutEffect(() => {
    return () => {
      window.clearTimeout(skipDelayTimerRef.current)
    }
  })

  return (
    <TooltipProviderContextProvider
      scope={props.__scopeTooltip as Scope<TooltipProviderContextValue | undefined>}
      isOpenDelayedRef={isOpenDelayedRef}
      delayDuration={delayDuration}
      onOpen={() => {
        window.clearTimeout(skipDelayTimerRef.current)
        isOpenDelayedRef.current = false
      }}
      onClose={() => {
        window.clearTimeout(skipDelayTimerRef.current)
        skipDelayTimerRef.current = window.setTimeout(() => {
          isOpenDelayedRef.current = true
        }, skipDelayDuration())
      }}
      onPointerInTransitChange={(inTransit) => {
        isPointerInTransitRef.current = inTransit
      }}
      isPointerInTransitRef={isPointerInTransitRef}
      disableHoverableContent={disableHoverableContent}
    >
      {props.children}
    </TooltipProviderContextProvider>
  )
}

TooltipProvider.displayName = PROVIDER_NAME

function Tooltip(props: ScopedProps<TooltipProps>): FictNode {
  const providerContext = useTooltipProviderContext(
    TOOLTIP_NAME,
    props.__scopeTooltip as Scope<TooltipProviderContextValue | undefined>,
  )
  const popperScope = usePopperScope(props.__scopeTooltip)
  const trigger = { current: null as HTMLButtonElement | null }
  const contentId = useId()
  const openTimerRef = { current: 0 }
  const wasOpenDelayedRef = { current: false }
  const delayDuration = () =>
    props.delayDuration === undefined
      ? providerContext.delayDuration()
      : (readValue(props.delayDuration as MaybeAccessor<number | undefined>) ??
        providerContext.delayDuration())
  const disableHoverableContent = () =>
    props.disableHoverableContent === undefined
      ? providerContext.disableHoverableContent()
      : Boolean(readValue(props.disableHoverableContent as MaybeAccessor<boolean | undefined>))
  const openProp = () =>
    props.open === undefined ? undefined : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? false
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? false)
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: TOOLTIP_NAME,
    onChange: (nextOpen) => {
      if (nextOpen) {
        providerContext.onOpen()
        document.dispatchEvent(new CustomEvent(TOOLTIP_OPEN))
      } else {
        providerContext.onClose()
      }

      props.onOpenChange?.(nextOpen)
    },
  })
  const stateAttribute = () => {
    if (!open()) {
      return 'closed'
    }

    return wasOpenDelayedRef.current ? 'delayed-open' : 'instant-open'
  }
  const handleOpen = () => {
    window.clearTimeout(openTimerRef.current)
    openTimerRef.current = 0
    wasOpenDelayedRef.current = false
    setOpen(true)
  }
  const handleClose = () => {
    window.clearTimeout(openTimerRef.current)
    openTimerRef.current = 0
    setOpen(false)
  }
  const handleDelayedOpen = () => {
    window.clearTimeout(openTimerRef.current)
    openTimerRef.current = window.setTimeout(() => {
      wasOpenDelayedRef.current = true
      setOpen(true)
      openTimerRef.current = 0
    }, delayDuration())
  }

  useLayoutEffect(() => {
    return () => {
      if (openTimerRef.current) {
        window.clearTimeout(openTimerRef.current)
        openTimerRef.current = 0
      }
    }
  })

  return (
    <PopperRoot {...popperScope}>
      <TooltipContextProvider
        scope={props.__scopeTooltip as Scope<TooltipContextValue | undefined>}
        contentId={contentId}
        open={open}
        stateAttribute={stateAttribute}
        trigger={trigger}
        onTriggerChange={(nextTrigger) => {
          trigger.current = nextTrigger
        }}
        onTriggerEnter={() => {
          if (providerContext.isOpenDelayedRef.current) {
            handleDelayedOpen()
          } else {
            handleOpen()
          }
        }}
        onTriggerLeave={() => {
          if (disableHoverableContent()) {
            handleClose()
          } else {
            window.clearTimeout(openTimerRef.current)
            openTimerRef.current = 0
          }
        }}
        onOpen={handleOpen}
        onClose={handleClose}
        disableHoverableContent={disableHoverableContent}
      >
        {props.children}
      </TooltipContextProvider>
    </PopperRoot>
  )
}

Tooltip.displayName = TOOLTIP_NAME

function TooltipTrigger(props: ScopedProps<TooltipTriggerProps>): FictNode {
  const { __scopeTooltip, ...triggerProps } = props
  const context = useTooltipContext(
    TRIGGER_NAME,
    __scopeTooltip as Scope<TooltipContextValue | undefined>,
  )
  const providerContext = useTooltipProviderContext(
    TRIGGER_NAME,
    __scopeTooltip as Scope<TooltipProviderContextValue | undefined>,
  )
  const popperScope = usePopperScope(__scopeTooltip)
  const isPointerDownRef = { current: false }
  const hasPointerMoveOpenedRef = { current: false }
  const handlePointerUp = () => {
    isPointerDownRef.current = false
  }
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLButtonElement>,
    context.onTriggerChange,
  )

  useLayoutEffect(() => {
    return () => {
      document.removeEventListener('pointerup', handlePointerUp)
    }
  })

  const primitiveProps = mergeProps(
    {
      'aria-describedby': prop(() => (context.open() ? context.contentId() : undefined)),
      'data-state': prop(context.stateAttribute),
    },
    () => triggerProps as Record<string, unknown>,
    {
      onPointerMove: composeEventHandlers<PointerEvent>(
        props.onPointerMove as ((event: PointerEvent) => void) | undefined,
        (event) => {
          if (event.pointerType === 'touch') {
            return
          }

          if (
            !hasPointerMoveOpenedRef.current &&
            !providerContext.isPointerInTransitRef.current
          ) {
            context.onTriggerEnter()
            hasPointerMoveOpenedRef.current = true
          }
        },
      ),
      onPointerLeave: composeEventHandlers<PointerEvent>(
        props.onPointerLeave as ((event: PointerEvent) => void) | undefined,
        () => {
          context.onTriggerLeave()
          hasPointerMoveOpenedRef.current = false
        },
      ),
      onPointerDown: composeEventHandlers<PointerEvent>(
        props.onPointerDown as ((event: PointerEvent) => void) | undefined,
        () => {
          if (context.open()) {
            context.onClose()
          }

          isPointerDownRef.current = true
          document.addEventListener('pointerup', handlePointerUp, { once: true })
        },
      ),
      onFocus: composeEventHandlers<FocusEvent>(
        props.onFocus as ((event: FocusEvent) => void) | undefined,
        () => {
          if (!isPointerDownRef.current) {
            context.onOpen()
          }
        },
      ),
      onBlur: composeEventHandlers<FocusEvent>(
        props.onBlur as ((event: FocusEvent) => void) | undefined,
        context.onClose,
      ),
      onClick: composeEventHandlers<MouseEvent>(
        props.onClick as ((event: MouseEvent) => void) | undefined,
        context.onClose,
      ),
      ref: undefined,
    },
  )
  const button = <Primitive.button {...primitiveProps} ref={composedRefs} />

  return (
    <PopperAnchorPrimitive asChild {...popperScope}>
      {button}
    </PopperAnchorPrimitive>
  )
}

TooltipTrigger.displayName = TRIGGER_NAME

function TooltipPortal(props: ScopedProps<TooltipPortalProps>): FictNode {
  const { __scopeTooltip, children, container, forceMount } = props
  const nextForceMount = forceMount === undefined ? undefined : readValue(forceMount)
  const portalProps =
    container === undefined
      ? { style: { display: 'contents' } }
      : { container, style: { display: 'contents' } }

  return (
    <PortalProvider
      scope={__scopeTooltip as Scope<PortalContextValue | undefined>}
      forceMount={nextForceMount}
    >
      <PortalPrimitive {...portalProps}>{children}</PortalPrimitive>
    </PortalProvider>
  )
}

TooltipPortal.displayName = PORTAL_NAME

function TooltipContent(props: ScopedProps<TooltipContentProps>): FictNode {
  const portalContext = usePortalContext(
    CONTENT_NAME,
    props.__scopeTooltip as Scope<PortalContextValue | undefined>,
  )
  const context = useTooltipContext(
    CONTENT_NAME,
    props.__scopeTooltip as Scope<TooltipContextValue | undefined>,
  )
  const { forceMount, ...contentProps } = props
  const present = () =>
    Boolean(
      (forceMount === undefined
        ? portalContext.forceMount
        : readValue(forceMount as MaybeAccessor<boolean | undefined>)) || context.open(),
    )
  const contentWithDefaultSide =
    contentProps.side === undefined
      ? mergeProps(contentProps as Record<string, unknown>, { side: 'top' })
      : (contentProps as Record<string, unknown>)

  return (
    <Presence present={present}>
      {context.disableHoverableContent() ? (
        <TooltipContentImpl {...(contentWithDefaultSide as ScopedProps<TooltipContentImplProps>)} />
      ) : (
        <TooltipContentHoverable
          {...(contentWithDefaultSide as ScopedProps<TooltipContentImplProps>)}
        />
      )}
    </Presence>
  )
}

TooltipContent.displayName = CONTENT_NAME

function TooltipContentHoverable(props: ScopedProps<TooltipContentImplProps>): FictNode {
  const context = useTooltipContext(
    CONTENT_NAME,
    props.__scopeTooltip as Scope<TooltipContextValue | undefined>,
  )
  const providerContext = useTooltipProviderContext(
    CONTENT_NAME,
    props.__scopeTooltip as Scope<TooltipProviderContextValue | undefined>,
  )
  const contentRef = { current: null as HTMLDivElement | null }
  const pointerGraceArea = createSignal<Polygon | null>(null)
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLDivElement>,
    contentRef,
  )
  const handleRemoveGraceArea = () => {
    pointerGraceArea(null)
    providerContext.onPointerInTransitChange(false)
  }
  const handleCreateGraceArea = (event: PointerEvent, hoverTarget: HTMLElement) => {
    const currentTarget = event.currentTarget as HTMLElement
    const exitPoint = { x: event.clientX, y: event.clientY }
    const exitSide = getExitSideFromRect(exitPoint, currentTarget.getBoundingClientRect())
    const paddedExitPoints = getPaddedExitPoints(exitPoint, exitSide)
    const hoverTargetPoints = getPointsFromRect(hoverTarget.getBoundingClientRect())
    pointerGraceArea(getHull([...paddedExitPoints, ...hoverTargetPoints]))
    providerContext.onPointerInTransitChange(true)
  }

  useLayoutEffect(() => {
    return () => {
      handleRemoveGraceArea()
    }
  })

  useLayoutEffect(() => {
    const trigger = context.trigger.current
    const currentContent = contentRef.current

    if (!trigger || !currentContent) {
      return
    }

    const handleTriggerLeave = (event: PointerEvent) => {
      handleCreateGraceArea(event, currentContent)
    }
    const handleContentLeave = (event: PointerEvent) => {
      handleCreateGraceArea(event, trigger)
    }

    trigger.addEventListener('pointerleave', handleTriggerLeave)
    currentContent.addEventListener('pointerleave', handleContentLeave)
    return () => {
      trigger.removeEventListener('pointerleave', handleTriggerLeave)
      currentContent.removeEventListener('pointerleave', handleContentLeave)
    }
  })

  useLayoutEffect(() => {
    const trigger = context.trigger.current
    const currentContent = contentRef.current
    const currentGraceArea = pointerGraceArea()

    if (!currentGraceArea) {
      return
    }

    const handleTrackPointerGrace = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      const pointerPosition = { x: event.clientX, y: event.clientY }
      const hasEnteredTarget =
        (!!target && !!trigger && trigger.contains(target)) ||
        (!!target && !!currentContent && currentContent.contains(target))
      const isPointerOutsideGraceArea = !isPointInPolygon(pointerPosition, currentGraceArea)

      if (hasEnteredTarget) {
        handleRemoveGraceArea()
      } else if (isPointerOutsideGraceArea) {
        handleRemoveGraceArea()
        context.onClose()
      }
    }

    document.addEventListener('pointermove', handleTrackPointerGrace)
    return () => {
      document.removeEventListener('pointermove', handleTrackPointerGrace)
    }
  })

  const contentProps =
    composedRefs === undefined
      ? props
      : mergeProps(props as Record<string, unknown>, {
          ref: composedRefs,
        })

  return <TooltipContentImpl {...(contentProps as ScopedProps<TooltipContentImplProps>)} />
}

function TooltipContentImpl(props: ScopedProps<TooltipContentImplProps>): FictNode {
  const {
    __scopeTooltip,
    children,
    'aria-label': ariaLabel,
    onEscapeKeyDown,
    onPointerDownOutside,
    ...contentProps
  } = props
  const context = useTooltipContext(
    CONTENT_NAME,
    __scopeTooltip as Scope<TooltipContextValue | undefined>,
  )
  const popperScope = usePopperScope(__scopeTooltip)

  useLayoutEffect(() => {
    document.addEventListener(TOOLTIP_OPEN, context.onClose)
    return () => {
      document.removeEventListener(TOOLTIP_OPEN, context.onClose)
    }
  })

  useLayoutEffect(() => {
    const trigger = context.trigger.current
    if (!trigger) {
      return
    }

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement | null
      if (target?.contains(trigger)) {
        context.onClose()
      }
    }

    window.addEventListener('scroll', handleScroll, { capture: true })
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  })

  const dismissableLayerProps: Record<string, unknown> = {
    asChild: true,
    disableOutsidePointerEvents: false,
    onFocusOutside: (event: Event) => {
      event.preventDefault()
    },
    onDismiss: context.onClose,
  }
  if (onEscapeKeyDown !== undefined) {
    dismissableLayerProps.onEscapeKeyDown = onEscapeKeyDown
  }
  if (onPointerDownOutside !== undefined) {
    dismissableLayerProps.onPointerDownOutside = onPointerDownOutside
  }

  const popperProps = mergeProps(
    {
      'data-state': prop(context.stateAttribute),
    },
    popperScope,
    () => contentProps as Record<string, unknown>,
    {
      style: prop(() => ({
        ...readStyle(contentProps.style as MaybeAccessor<unknown> | undefined),
        ['--radix-tooltip-content-transform-origin' as string]:
          'var(--radix-popper-transform-origin)',
        ['--radix-tooltip-content-available-width' as string]:
          'var(--radix-popper-available-width)',
        ['--radix-tooltip-content-available-height' as string]:
          'var(--radix-popper-available-height)',
        ['--radix-tooltip-trigger-width' as string]: 'var(--radix-popper-anchor-width)',
        ['--radix-tooltip-trigger-height' as string]: 'var(--radix-popper-anchor-height)',
      })),
    },
  )
  const contentPrimitiveProps =
    props.ref === undefined
      ? popperProps
      : mergeProps(popperProps, {
          ref: props.ref as PossibleRef<HTMLDivElement>,
        })

  return (
    <DismissableLayer {...dismissableLayerProps}>
      <PopperContentPrimitive {...(contentPrimitiveProps as Record<string, unknown>)}>
        <Slottable>{children}</Slottable>
        <VisuallyHiddenContentContextProvider
          scope={__scopeTooltip as Scope<VisuallyHiddenContentContextValue | undefined>}
          isInside={true}
        >
          <VisuallyHidden id={context.contentId()} role="tooltip">
            {ariaLabel ?? children}
          </VisuallyHidden>
        </VisuallyHiddenContentContextProvider>
      </PopperContentPrimitive>
    </DismissableLayer>
  )
}

function TooltipArrow(props: ScopedProps<TooltipArrowProps>): FictNode {
  const { __scopeTooltip, ...arrowProps } = props
  const popperScope = usePopperScope(__scopeTooltip)
  const visuallyHiddenContentContext = useVisuallyHiddenContentContext(
    ARROW_NAME,
    __scopeTooltip as Scope<VisuallyHiddenContentContextValue | undefined>,
  )

  if (visuallyHiddenContentContext.isInside) {
    return null
  }

  return <PopperArrowPrimitive {...popperScope} {...arrowProps} />
}

TooltipArrow.displayName = ARROW_NAME

function getExitSideFromRect(point: Point, rect: DOMRect): Side {
  const top = Math.abs(rect.top - point.y)
  const bottom = Math.abs(rect.bottom - point.y)
  const right = Math.abs(rect.right - point.x)
  const left = Math.abs(rect.left - point.x)

  switch (Math.min(top, bottom, right, left)) {
    case left:
      return 'left'
    case right:
      return 'right'
    case top:
      return 'top'
    case bottom:
      return 'bottom'
    default:
      throw new Error('unreachable')
  }
}

function getPaddedExitPoints(exitPoint: Point, exitSide: Side, padding = 5): Point[] {
  const paddedExitPoints: Point[] = []

  switch (exitSide) {
    case 'top':
      paddedExitPoints.push(
        { x: exitPoint.x - padding, y: exitPoint.y + padding },
        { x: exitPoint.x + padding, y: exitPoint.y + padding },
      )
      break
    case 'bottom':
      paddedExitPoints.push(
        { x: exitPoint.x - padding, y: exitPoint.y - padding },
        { x: exitPoint.x + padding, y: exitPoint.y - padding },
      )
      break
    case 'left':
      paddedExitPoints.push(
        { x: exitPoint.x + padding, y: exitPoint.y - padding },
        { x: exitPoint.x + padding, y: exitPoint.y + padding },
      )
      break
    case 'right':
      paddedExitPoints.push(
        { x: exitPoint.x - padding, y: exitPoint.y - padding },
        { x: exitPoint.x - padding, y: exitPoint.y + padding },
      )
      break
  }

  return paddedExitPoints
}

function getPointsFromRect(rect: DOMRect): Point[] {
  const { top, right, bottom, left } = rect
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ]
}

function isPointInPolygon(point: Point, polygon: Polygon): boolean {
  const { x, y } = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const ii = polygon[i]!
    const jj = polygon[j]!
    const xi = ii.x
    const yi = ii.y
    const xj = jj.x
    const yj = jj.y
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) {
      inside = !inside
    }
  }

  return inside
}

function getHull<P extends Point>(points: Readonly<Array<P>>): Array<P> {
  const nextPoints = points.slice()
  nextPoints.sort((a, b) => {
    if (a.x < b.x) return -1
    if (a.x > b.x) return 1
    if (a.y < b.y) return -1
    if (a.y > b.y) return 1
    return 0
  })
  return getHullPresorted(nextPoints)
}

function getHullPresorted<P extends Point>(points: Readonly<Array<P>>): Array<P> {
  if (points.length <= 1) {
    return points.slice()
  }

  const upperHull: Array<P> = []
  for (let index = 0; index < points.length; index++) {
    const point = points[index]!
    while (upperHull.length >= 2) {
      const q = upperHull[upperHull.length - 1]!
      const r = upperHull[upperHull.length - 2]!
      if ((q.x - r.x) * (point.y - r.y) >= (q.y - r.y) * (point.x - r.x)) {
        upperHull.pop()
      } else {
        break
      }
    }
    upperHull.push(point)
  }
  upperHull.pop()

  const lowerHull: Array<P> = []
  for (let index = points.length - 1; index >= 0; index--) {
    const point = points[index]!
    while (lowerHull.length >= 2) {
      const q = lowerHull[lowerHull.length - 1]!
      const r = lowerHull[lowerHull.length - 2]!
      if ((q.x - r.x) * (point.y - r.y) >= (q.y - r.y) * (point.x - r.x)) {
        lowerHull.pop()
      } else {
        break
      }
    }
    lowerHull.push(point)
  }
  lowerHull.pop()

  if (
    upperHull.length === 1 &&
    lowerHull.length === 1 &&
    upperHull[0]!.x === lowerHull[0]!.x &&
    upperHull[0]!.y === lowerHull[0]!.y
  ) {
    return upperHull
  }

  return upperHull.concat(lowerHull)
}

const Provider = TooltipProvider
const Root = Tooltip
const Trigger = TooltipTrigger
const Portal = TooltipPortal
const Content = TooltipContent
const Arrow = TooltipArrow

export {
  createTooltipScope,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
  Provider,
  Root,
  Trigger,
  Portal,
  Content,
  Arrow,
}

export type {
  TooltipProviderProps,
  TooltipProps,
  TooltipTriggerProps,
  TooltipPortalProps,
  TooltipContentProps,
  TooltipArrowProps,
}
