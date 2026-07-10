import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { DismissableLayer, type DismissableLayerProps } from '@fictjs/dismissable-layer'
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
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type PrimitiveLinkProps = JSX.IntrinsicElements['a'] & {
  asChild?: boolean
}
type ScopedProps<P> = P & { __scopeHoverCard?: Scope }
type StyleRecord = Record<string, string | number>
type HoverCardContentElement = HTMLDivElement
type HoverCardArrowElement = SVGSVGElement
type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>
type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>

const HOVERCARD_NAME = 'HoverCard'
const TRIGGER_NAME = 'HoverCardTrigger'
const PORTAL_NAME = 'HoverCardPortal'
const CONTENT_NAME = 'HoverCardContent'
const ARROW_NAME = 'HoverCardArrow'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createHoverCardContext, createHoverCardScope] = createContextScope(HOVERCARD_NAME, [
  createPopperScope,
])
const usePopperScope = createPopperScope()

type HoverCardContextValue = {
  open: () => boolean
  onOpenChange(open: boolean): void
  onOpen(): void
  onClose(): void
  onDismiss(): void
  hasSelectionRef: { current: boolean }
  isPointerDownOnContentRef: { current: boolean }
}

type PortalContextValue = {
  forceMount: boolean | undefined
}

const [HoverCardProvider, useHoverCardContext] =
  createHoverCardContext<HoverCardContextValue>(HOVERCARD_NAME)
const [PortalProvider, usePortalContext] = createHoverCardContext<PortalContextValue>(PORTAL_NAME, {
  forceMount: undefined,
})

type HoverCardProps = {
  children?: FictNode | FictNode[]
  open?: MaybeAccessor<boolean | undefined>
  defaultOpen?: MaybeAccessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
  openDelay?: MaybeAccessor<number | undefined>
  closeDelay?: MaybeAccessor<number | undefined>
}

type HoverCardTriggerProps = PrimitiveLinkProps

type HoverCardPortalProps = {
  children?: FictNode | FictNode[]
  container?: PortalPrimitiveProps['container']
  forceMount?: MaybeAccessor<boolean | undefined>
}

type HoverCardContentImplProps = Omit<PopperContentPrimitiveProps, 'onPlaced'> &
  Omit<DismissableLayerProps, 'onDismiss'> & {
    onEscapeKeyDown?: DismissableLayerProps['onEscapeKeyDown']
    onPointerDownOutside?: DismissableLayerProps['onPointerDownOutside']
    onFocusOutside?: DismissableLayerProps['onFocusOutside']
    onInteractOutside?: DismissableLayerProps['onInteractOutside']
  }

type HoverCardContentProps = HoverCardContentImplProps & {
  forceMount?: MaybeAccessor<boolean | undefined>
}

type HoverCardArrowProps = PopperArrowPrimitiveProps

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

function getState(open: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed'
}

function HoverCard(props: ScopedProps<HoverCardProps>): FictNode {
  const popperScope = usePopperScope(props.__scopeHoverCard)
  const openDelay = () =>
    props.openDelay === undefined
      ? 700
      : (readValue(props.openDelay as MaybeAccessor<number | undefined>) ?? 700)
  const closeDelay = () =>
    props.closeDelay === undefined
      ? 300
      : (readValue(props.closeDelay as MaybeAccessor<number | undefined>) ?? 300)
  const openProp = () =>
    props.open === undefined
      ? undefined
      : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? false
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? false)
  const openTimerRef = { current: 0 as ReturnType<typeof setTimeout> | 0 }
  const closeTimerRef = { current: 0 as ReturnType<typeof setTimeout> | 0 }
  const hasSelectionRef = { current: false }
  const isPointerDownOnContentRef = { current: false }
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: HOVERCARD_NAME,
    onChange: (nextOpen) => props.onOpenChange?.(nextOpen),
  })
  const handleOpen = () => {
    clearTimeout(closeTimerRef.current)
    openTimerRef.current = setTimeout(() => setOpen(true), openDelay())
  }
  const handleClose = () => {
    clearTimeout(openTimerRef.current)
    if (!hasSelectionRef.current && !isPointerDownOnContentRef.current) {
      closeTimerRef.current = setTimeout(() => setOpen(false), closeDelay())
    }
  }

  useLayoutEffect(() => {
    return () => {
      clearTimeout(openTimerRef.current)
      clearTimeout(closeTimerRef.current)
    }
  })

  return (
    <PopperRoot {...popperScope}>
      <HoverCardProvider
        scope={props.__scopeHoverCard as Scope<HoverCardContextValue | undefined>}
        open={open}
        onOpenChange={setOpen}
        onOpen={handleOpen}
        onClose={handleClose}
        onDismiss={() => setOpen(false)}
        hasSelectionRef={hasSelectionRef}
        isPointerDownOnContentRef={isPointerDownOnContentRef}
      >
        {props.children}
      </HoverCardProvider>
    </PopperRoot>
  )
}

HoverCard.displayName = HOVERCARD_NAME

function HoverCardTrigger(props: ScopedProps<HoverCardTriggerProps>): FictNode {
  const { __scopeHoverCard, ...triggerProps } = props
  const context = useHoverCardContext(
    TRIGGER_NAME,
    __scopeHoverCard as Scope<HoverCardContextValue | undefined>,
  )
  const popperScope = usePopperScope(__scopeHoverCard)
  const primitiveProps = mergeProps(
    {
      'data-state': prop(() => getState(context.open())),
    },
    prop(() => triggerProps as Record<string, unknown>),
    {
      onPointerEnter: composeEventHandlers<PointerEvent>(
        props.onPointerEnter as ((event: PointerEvent) => void) | undefined,
        excludeTouch(context.onOpen),
      ),
      onPointerLeave: composeEventHandlers<PointerEvent>(
        props.onPointerLeave as ((event: PointerEvent) => void) | undefined,
        excludeTouch(context.onClose),
      ),
      onFocus: composeEventHandlers<FocusEvent>(
        props.onFocus as ((event: FocusEvent) => void) | undefined,
        context.onOpen,
      ),
      onBlur: composeEventHandlers<FocusEvent>(
        props.onBlur as ((event: FocusEvent) => void) | undefined,
        context.onClose,
      ),
      onTouchStart: composeEventHandlers<TouchEvent>(
        props.onTouchStart as ((event: TouchEvent) => void) | undefined,
        (event) => event.preventDefault(),
      ),
    },
  )

  return (
    <PopperAnchorPrimitive asChild {...popperScope}>
      <Primitive.a {...(primitiveProps as Record<string, unknown>)} />
    </PopperAnchorPrimitive>
  )
}

HoverCardTrigger.displayName = TRIGGER_NAME

function HoverCardPortal(props: ScopedProps<HoverCardPortalProps>): FictNode {
  const { __scopeHoverCard, children, container, forceMount } = props
  const nextForceMount = forceMount === undefined ? undefined : readValue(forceMount)
  const portalProps =
    container === undefined
      ? { style: { display: 'contents' } }
      : { container, style: { display: 'contents' } }

  return (
    <PortalProvider
      scope={props.__scopeHoverCard as Scope<PortalContextValue | undefined>}
      forceMount={nextForceMount}
    >
      <PortalPrimitive {...portalProps}>{children}</PortalPrimitive>
    </PortalProvider>
  )
}

HoverCardPortal.displayName = PORTAL_NAME

function HoverCardContent(props: ScopedProps<HoverCardContentProps>): FictNode {
  const portalContext = usePortalContext(
    CONTENT_NAME,
    props.__scopeHoverCard as Scope<PortalContextValue | undefined>,
  )
  const context = useHoverCardContext(
    CONTENT_NAME,
    props.__scopeHoverCard as Scope<HoverCardContextValue | undefined>,
  )
  const { forceMount, ...contentProps } = props
  const present = () =>
    Boolean(
      (forceMount === undefined
        ? portalContext.forceMount
        : readValue(forceMount as MaybeAccessor<boolean | undefined>)) || context.open(),
    )

  return (
    <Presence present={present}>
      <HoverCardContentImpl
        {...(contentProps as ScopedProps<HoverCardContentImplProps>)}
        onPointerEnter={composeEventHandlers<PointerEvent>(
          props.onPointerEnter as ((event: PointerEvent) => void) | undefined,
          excludeTouch(context.onOpen),
        )}
        onPointerLeave={composeEventHandlers<PointerEvent>(
          props.onPointerLeave as ((event: PointerEvent) => void) | undefined,
          excludeTouch(context.onClose),
        )}
      />
    </Presence>
  )
}

HoverCardContent.displayName = CONTENT_NAME

function HoverCardContentImpl(props: ScopedProps<HoverCardContentImplProps>): FictNode {
  const {
    __scopeHoverCard,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
    ...contentProps
  } = props
  const context = useHoverCardContext(
    CONTENT_NAME,
    __scopeHoverCard as Scope<HoverCardContextValue | undefined>,
  )
  const popperScope = usePopperScope(__scopeHoverCard)
  const ref = { current: null as HoverCardContentElement | null }
  const containSelection = createSignal(false)
  const composedRefs = useComposedRefs(props.ref as PossibleRef<HoverCardContentElement>, ref)

  useLayoutEffect(() => {
    if (!containSelection()) {
      return
    }

    const body = document.body
    const originalUserSelect = body.style.userSelect || body.style.webkitUserSelect
    body.style.userSelect = 'none'
    body.style.webkitUserSelect = 'none'

    return () => {
      body.style.userSelect = originalUserSelect
      body.style.webkitUserSelect = originalUserSelect
    }
  })

  useLayoutEffect(() => {
    const content = ref.current
    if (!content) return

    const handlePointerUp = () => {
      containSelection(false)
      context.isPointerDownOnContentRef.current = false

      setTimeout(() => {
        const hasSelection = document.getSelection()?.toString() !== ''
        if (hasSelection) {
          context.hasSelectionRef.current = true
        }
      }, 0)
    }

    document.addEventListener('pointerup', handlePointerUp)
    return () => {
      document.removeEventListener('pointerup', handlePointerUp)
      context.hasSelectionRef.current = false
      context.isPointerDownOnContentRef.current = false
    }
  })

  useLayoutEffect(() => {
    const content = ref.current
    if (!content) return

    const tabbables = getTabbableNodes(content)
    for (const tabbable of tabbables) {
      tabbable.setAttribute('tabindex', '-1')
    }
  })

  const popperContentProps = mergeProps(
    {
      'data-state': prop(() => getState(context.open())),
    },
    prop(() => contentProps as Record<string, unknown>),
    {
      onPointerDown: composeEventHandlers<PointerEvent>(
        contentProps.onPointerDown as ((event: PointerEvent) => void) | undefined,
        (event) => {
          const currentTarget = event.currentTarget as HTMLElement
          const target = event.target as HTMLElement | null
          if (target && currentTarget.contains(target)) {
            containSelection(true)
          }
          context.hasSelectionRef.current = false
          context.isPointerDownOnContentRef.current = true
        },
      ),
      style: prop(() => ({
        ...readStyle(contentProps.style as MaybeAccessor<unknown>),
        userSelect: containSelection() ? 'text' : undefined,
        WebkitUserSelect: containSelection() ? 'text' : undefined,
        '--radix-hover-card-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-hover-card-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-hover-card-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-hover-card-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-hover-card-trigger-height': 'var(--radix-popper-anchor-height)',
      })),
    },
  )
  const dismissableLayerProps = mergeProps(
    {
      asChild: true,
      disableOutsidePointerEvents: false,
      onFocusOutside: composeEventHandlers<FocusOutsideEvent>(onFocusOutside, (event) => {
        event.preventDefault()
      }),
      onDismiss: context.onDismiss,
    } as Record<string, unknown>,
    onInteractOutside ? { onInteractOutside } : {},
    onEscapeKeyDown ? { onEscapeKeyDown } : {},
    onPointerDownOutside ? { onPointerDownOutside } : {},
  )

  return (
    <DismissableLayer {...dismissableLayerProps}>
      <PopperContentPrimitive
        {...popperScope}
        {...(popperContentProps as Record<string, unknown>)}
        ref={composedRefs}
      />
    </DismissableLayer>
  )
}

function HoverCardArrow(props: ScopedProps<HoverCardArrowProps>): FictNode {
  const { __scopeHoverCard, ...arrowProps } = props
  const popperScope = usePopperScope(__scopeHoverCard)
  const primitiveProps = mergeProps(
    prop(() => arrowProps as Record<string, unknown>),
    props.ref ? { ref: props.ref as PossibleRef<HoverCardArrowElement> } : {},
  )

  return <PopperArrowPrimitive {...popperScope} {...(primitiveProps as Record<string, unknown>)} />
}

HoverCardArrow.displayName = ARROW_NAME

function excludeTouch(eventHandler: () => void) {
  return (event: PointerEvent) => {
    if (event.pointerType !== 'touch') {
      eventHandler()
    }
  }
}

function getTabbableNodes(container: HTMLElement) {
  const nodes: HTMLElement[] = []
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      return (node as HTMLElement).tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
    },
  })

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as HTMLElement)
  }

  return nodes
}

const Root = HoverCard
const Trigger = HoverCardTrigger
const Portal = HoverCardPortal
const Content = HoverCardContent
const Arrow = HoverCardArrow

export {
  createHoverCardScope,
  HoverCard,
  HoverCardTrigger,
  HoverCardPortal,
  HoverCardContent,
  HoverCardArrow,
  Root,
  Trigger,
  Portal,
  Content,
  Arrow,
}
export type {
  HoverCardProps,
  HoverCardTriggerProps,
  HoverCardPortalProps,
  HoverCardContentProps,
  HoverCardArrowProps,
  PointerDownOutsideEvent,
  FocusOutsideEvent,
}
