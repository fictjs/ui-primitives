import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { DismissableLayer, type DismissableLayerProps } from '@fictjs/dismissable-layer'
import { RemoveScroll } from '@fictjs/fict-remove-scroll'
import { useFocusGuards } from '@fictjs/focus-guards'
import { FocusScope, type FocusScopeProps } from '@fictjs/focus-scope'
import { useId } from '@fictjs/id'
import {
  createPopperScope,
  Popper as PopperRoot,
  PopperAnchor as PopperAnchorPrimitive,
  PopperArrow as PopperArrowPrimitive,
  PopperContent as PopperContentPrimitive,
  type PopperAnchorProps as PopperAnchorPrimitiveProps,
  type PopperArrowProps as PopperArrowPrimitiveProps,
  type PopperContentProps as PopperContentPrimitiveProps,
} from '@fictjs/popper'
import { Portal as PortalPrimitive, type PortalProps as PortalPrimitiveProps } from '@fictjs/portal'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'
import { hideOthers } from 'aria-hidden'

type MaybeAccessor<T> = T | (() => T)
type PrimitiveButtonProps = JSX.IntrinsicElements['button'] & {
  asChild?: boolean
}
type ScopedProps<P> = P & { __scopePopover?: Scope }
type StyleRecord = Record<string, string | number>
type PopoverInteractOutsideEvent = Parameters<
  NonNullable<DismissableLayerProps['onInteractOutside']>
>[0]
type PopoverPointerDownOutsideEvent = Parameters<
  NonNullable<DismissableLayerProps['onPointerDownOutside']>
>[0]
type PopoverFocusOutsideEvent = Parameters<NonNullable<DismissableLayerProps['onFocusOutside']>>[0]

const POPOVER_NAME = 'Popover'
const ANCHOR_NAME = 'PopoverAnchor'
const TRIGGER_NAME = 'PopoverTrigger'
const PORTAL_NAME = 'PopoverPortal'
const CONTENT_NAME = 'PopoverContent'
const CLOSE_NAME = 'PopoverClose'
const ARROW_NAME = 'PopoverArrow'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createPopoverContext, createPopoverScope] = createContextScope(POPOVER_NAME, [
  createPopperScope,
])
const usePopperScope = createPopperScope()

type PopoverContextValue = {
  triggerRef: { current: HTMLButtonElement | null }
  contentId: () => string
  open: () => boolean
  onOpenChange(open: boolean): void
  onOpenToggle(): void
  hasCustomAnchor: () => boolean
  onCustomAnchorAdd(): void
  onCustomAnchorRemove(): void
  modal: () => boolean
}

type PortalContextValue = {
  forceMount: () => boolean | undefined
}

const [PopoverProvider, usePopoverContext] = createPopoverContext<PopoverContextValue>(POPOVER_NAME)
const [PortalProvider, usePortalContext] = createPopoverContext<PortalContextValue>(PORTAL_NAME, {
  forceMount: () => undefined,
})

type PopoverProps = {
  children?: FictNode | FictNode[]
  open?: MaybeAccessor<boolean | undefined>
  defaultOpen?: MaybeAccessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
  modal?: MaybeAccessor<boolean | undefined>
}

type PopoverAnchorProps = PopperAnchorPrimitiveProps

type PopoverTriggerProps = PrimitiveButtonProps

type PopoverPortalProps = {
  children?: FictNode | FictNode[]
  container?: PortalPrimitiveProps['container']
  forceMount?: MaybeAccessor<boolean | undefined>
}

type PopoverContentImplProps = Omit<PopperContentPrimitiveProps, 'onPlaced'> &
  Omit<DismissableLayerProps, 'onDismiss'> & {
    trapFocus?: FocusScopeProps['trapped']
    onOpenAutoFocus?: FocusScopeProps['onMountAutoFocus']
    onCloseAutoFocus?: FocusScopeProps['onUnmountAutoFocus']
  }

type PopoverContentTypeProps = Omit<
  PopoverContentImplProps,
  'trapFocus' | 'disableOutsidePointerEvents'
>

type PopoverContentProps = PopoverContentTypeProps & {
  forceMount?: MaybeAccessor<boolean | undefined>
}

type PopoverCloseProps = PrimitiveButtonProps

type PopoverArrowProps = PopperArrowPrimitiveProps

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

function Popover(props: ScopedProps<PopoverProps>): FictNode {
  const popperScope = usePopperScope(props.__scopePopover)
  const triggerRef = { current: null as HTMLButtonElement | null }
  const contentId = useId()
  const hasCustomAnchor = createSignal(false)
  const openProp = () =>
    props.open === undefined
      ? undefined
      : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? false
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? false)
  const modal = () => Boolean(readValue(props.modal as MaybeAccessor<boolean | undefined>))
  const controllableStateProps = {
    prop: openProp,
    defaultProp: defaultOpen,
    caller: POPOVER_NAME,
    onChange: (nextOpen: boolean) => props.onOpenChange?.(nextOpen),
  }
  const [open, setOpen] = useControllableState<boolean>(controllableStateProps)
  const onOpenToggle = () => {
    setOpen((previousOpen) => !previousOpen)
  }

  return (
    <PopperRoot {...popperScope}>
      <PopoverProvider
        scope={props.__scopePopover as Scope<PopoverContextValue | undefined>}
        triggerRef={triggerRef}
        contentId={contentId}
        open={open}
        onOpenChange={setOpen}
        onOpenToggle={onOpenToggle}
        hasCustomAnchor={hasCustomAnchor}
        onCustomAnchorAdd={() => hasCustomAnchor(true)}
        onCustomAnchorRemove={() => hasCustomAnchor(false)}
        modal={modal}
      >
        {props.children}
      </PopoverProvider>
    </PopperRoot>
  )
}

Popover.displayName = POPOVER_NAME

function PopoverAnchor(props: ScopedProps<PopoverAnchorProps>): FictNode {
  const context = usePopoverContext(
    ANCHOR_NAME,
    props.__scopePopover as Scope<PopoverContextValue | undefined>,
  )
  const popperScope = usePopperScope(props.__scopePopover)
  const anchorProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopePopover: undefined,
    },
  )

  if (!context.hasCustomAnchor()) {
    context.onCustomAnchorAdd()
  }

  useLayoutEffect(() => {
    return () => {
      context.onCustomAnchorRemove()
    }
  })

  return <PopperAnchorPrimitive {...popperScope} {...anchorProps} />
}

PopoverAnchor.displayName = ANCHOR_NAME

function PopoverTrigger(props: ScopedProps<PopoverTriggerProps>): FictNode {
  const context = usePopoverContext(
    TRIGGER_NAME,
    props.__scopePopover as Scope<PopoverContextValue | undefined>,
  )
  const popperScope = usePopperScope(props.__scopePopover)
  const composedTriggerRef = useComposedRefs(
    props.ref as PossibleRef<HTMLButtonElement>,
    context.triggerRef,
  )
  const primitiveProps = mergeProps(
    {
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': prop(() => String(context.open())),
      'aria-controls': prop(context.contentId),
      'data-state': prop(() => getState(context.open())),
    },
    prop(() => props as Record<string, unknown>),
    {
      onClick: composeEventHandlers<MouseEvent>(
        (event) => props.onClick?.(event),
        context.onOpenToggle,
      ),
      __scopePopover: undefined,
      ref: undefined,
    },
  )
  const trigger = <Primitive.button {...primitiveProps} ref={composedTriggerRef} />

  if (context.hasCustomAnchor()) {
    return trigger
  }

  return (
    <PopperAnchorPrimitive asChild {...popperScope}>
      {trigger}
    </PopperAnchorPrimitive>
  )
}

PopoverTrigger.displayName = TRIGGER_NAME

function PopoverPortal(props: ScopedProps<PopoverPortalProps>): FictNode {
  const forceMount = () =>
    props.forceMount === undefined
      ? undefined
      : readValue(props.forceMount as MaybeAccessor<boolean | undefined>)
  const portalProps = {
    container: prop(() => props.container) as unknown as Element | DocumentFragment | null,
    style: { display: 'contents' },
  }

  return (
    <PortalProvider
      scope={props.__scopePopover as Scope<PortalContextValue | undefined>}
      forceMount={forceMount}
    >
      <PortalPrimitive {...portalProps}>{props.children}</PortalPrimitive>
    </PortalProvider>
  )
}

PopoverPortal.displayName = PORTAL_NAME

function PopoverContent(props: ScopedProps<PopoverContentProps>): FictNode {
  const portalContext = usePortalContext(
    CONTENT_NAME,
    props.__scopePopover as Scope<PortalContextValue | undefined>,
  )
  const context = usePopoverContext(
    CONTENT_NAME,
    props.__scopePopover as Scope<PopoverContextValue | undefined>,
  )
  const present = () =>
    Boolean(
      (props.forceMount === undefined
        ? portalContext.forceMount()
        : readValue(props.forceMount as MaybeAccessor<boolean | undefined>)) || context.open(),
    )
  const contentProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      forceMount: undefined,
    },
  )

  return (
    <>
      {reactive(() =>
        present() ? (
          context.modal() ? (
            <PopoverContentModal {...(contentProps as ScopedProps<PopoverContentTypeProps>)} />
          ) : (
            <PopoverContentNonModal {...(contentProps as ScopedProps<PopoverContentTypeProps>)} />
          )
        ) : null,
      )}
    </>
  )
}

PopoverContent.displayName = CONTENT_NAME

function PopoverContentModal(props: ScopedProps<PopoverContentTypeProps>): FictNode {
  const context = usePopoverContext(
    CONTENT_NAME,
    props.__scopePopover as Scope<PopoverContextValue | undefined>,
  )
  const contentRef = { current: null as HTMLDivElement | null }
  const composedRefs = useComposedRefs(props.ref as PossibleRef<HTMLDivElement>, contentRef)
  const isRightClickOutsideRef = { current: false }

  useLayoutEffect(() => {
    const content = contentRef.current
    if (content) {
      const body = content.ownerDocument.body
      if (!body.contains(content) && process.env.NODE_ENV !== 'test') {
        return undefined
      }

      try {
        return hideOthers(content)
      } catch {
        return undefined
      }
    }
  })

  const contentProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      ref: composedRefs,
      trapFocus: () => context.open(),
      disableOutsidePointerEvents: true,
      onCloseAutoFocus: composeEventHandlers<Event>(
        (event) => props.onCloseAutoFocus?.(event),
        (event) => {
          event.preventDefault()
          if (!isRightClickOutsideRef.current) {
            context.triggerRef.current?.focus()
          }
        },
      ),
      onPointerDownOutside: composeEventHandlers<PopoverPointerDownOutsideEvent>(
        (event) => props.onPointerDownOutside?.(event),
        (event) => {
          const originalEvent = event.detail.originalEvent
          const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true
          const isRightClick = originalEvent.button === 2 || ctrlLeftClick

          isRightClickOutsideRef.current = isRightClick
        },
        { checkForDefaultPrevented: false },
      ),
      onFocusOutside: composeEventHandlers<PopoverFocusOutsideEvent>(
        (event) => props.onFocusOutside?.(event),
        (event) => {
          event.preventDefault()
        },
        { checkForDefaultPrevented: false },
      ),
    },
  )

  return (
    <RemoveScroll allowPinchZoom forwardProps>
      <PopoverContentImpl {...contentProps} />
    </RemoveScroll>
  )
}

function PopoverContentNonModal(props: ScopedProps<PopoverContentTypeProps>): FictNode {
  const context = usePopoverContext(
    CONTENT_NAME,
    props.__scopePopover as Scope<PopoverContextValue | undefined>,
  )
  const hasInteractedOutsideRef = { current: false }
  const hasPointerDownOutsideRef = { current: false }

  const contentProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      trapFocus: false,
      disableOutsidePointerEvents: false,
      onCloseAutoFocus: (event: Event) => {
        props.onCloseAutoFocus?.(event)

        if (!event.defaultPrevented) {
          if (!hasInteractedOutsideRef.current) {
            context.triggerRef.current?.focus()
          }
          event.preventDefault()
        }

        hasInteractedOutsideRef.current = false
        hasPointerDownOutsideRef.current = false
      },
      onInteractOutside: (event: PopoverInteractOutsideEvent) => {
        props.onInteractOutside?.(event)

        if (!event.defaultPrevented) {
          hasInteractedOutsideRef.current = true
          if (event.detail.originalEvent.type === 'pointerdown') {
            hasPointerDownOutsideRef.current = true
          }
        }

        const target = event.target as HTMLElement | null
        const targetIsTrigger = !!target && context.triggerRef.current?.contains(target)
        if (targetIsTrigger) {
          event.preventDefault()
        }

        if (event.detail.originalEvent.type === 'focusin' && hasPointerDownOutsideRef.current) {
          event.preventDefault()
        }
      },
    },
  )

  return <PopoverContentImpl {...contentProps} />
}

function PopoverContentImpl(props: ScopedProps<PopoverContentImplProps>): FictNode {
  const context = usePopoverContext(
    CONTENT_NAME,
    props.__scopePopover as Scope<PopoverContextValue | undefined>,
  )
  const popperScope = usePopperScope(props.__scopePopover)
  const guardDocument = createSignal<Document | undefined>(undefined)
  const contentRef = useComposedRefs(props.ref as PossibleRef<HTMLDivElement>, (node) =>
    guardDocument(node?.ownerDocument),
  )

  useFocusGuards(guardDocument)

  const popperProps = mergeProps<Record<string, unknown>>(
    {
      'data-state': prop(() => getState(context.open())),
      role: 'dialog',
      id: prop(context.contentId),
    },
    popperScope,
    prop(() => props as Record<string, unknown>),
    {
      __scopePopover: undefined,
      trapFocus: undefined,
      onOpenAutoFocus: undefined,
      onCloseAutoFocus: undefined,
      disableOutsidePointerEvents: undefined,
      onEscapeKeyDown: undefined,
      onPointerDownOutside: undefined,
      onFocusOutside: undefined,
      onInteractOutside: undefined,
      style: prop(() => ({
        ...readStyle(props.style as MaybeAccessor<unknown> | undefined),
        ['--radix-popover-content-transform-origin' as string]:
          'var(--radix-popper-transform-origin)',
        ['--radix-popover-content-available-width' as string]:
          'var(--radix-popper-available-width)',
        ['--radix-popover-content-available-height' as string]:
          'var(--radix-popper-available-height)',
        ['--radix-popover-trigger-width' as string]: 'var(--radix-popper-anchor-width)',
        ['--radix-popover-trigger-height' as string]: 'var(--radix-popper-anchor-height)',
      })),
    },
  )
  const focusScopeProps: Record<string, unknown> = {
    asChild: true,
    loop: true,
    trapped: prop(() => props.trapFocus),
    onMountAutoFocus: prop(() => props.onOpenAutoFocus),
    onUnmountAutoFocus: prop(() => props.onCloseAutoFocus),
  }

  const dismissableLayerProps: Record<string, unknown> = {
    asChild: true,
    onDismiss: () => context.onOpenChange(false),
    disableOutsidePointerEvents: prop(() => props.disableOutsidePointerEvents),
    onEscapeKeyDown: prop(() => props.onEscapeKeyDown),
    onPointerDownOutside: prop(() => props.onPointerDownOutside),
    onFocusOutside: prop(() => props.onFocusOutside),
    onInteractOutside: prop(() => props.onInteractOutside),
  }
  const contentPrimitiveProps = mergeProps(popperProps, {
    ref: contentRef,
  })

  return (
    <FocusScope {...(focusScopeProps as Record<string, unknown>)}>
      <DismissableLayer {...(dismissableLayerProps as Record<string, unknown>)}>
        <PopperContentPrimitive {...(contentPrimitiveProps as Record<string, unknown>)} />
      </DismissableLayer>
    </FocusScope>
  )
}

function PopoverClose(props: ScopedProps<PopoverCloseProps>): FictNode {
  const context = usePopoverContext(
    CLOSE_NAME,
    props.__scopePopover as Scope<PopoverContextValue | undefined>,
  )
  const primitiveProps = mergeProps(
    {
      type: 'button',
    },
    prop(() => props as Record<string, unknown>),
    {
      onClick: composeEventHandlers<MouseEvent>(
        (event) => props.onClick?.(event),
        () => {
          context.onOpenChange(false)
        },
      ),
      __scopePopover: undefined,
      ref: undefined,
    },
  )
  const buttonProps =
    props.ref === undefined
      ? primitiveProps
      : mergeProps(primitiveProps, {
          ref: props.ref as PossibleRef<HTMLButtonElement>,
        })

  return <Primitive.button {...(buttonProps as Record<string, unknown>)} />
}

PopoverClose.displayName = CLOSE_NAME

function PopoverArrow(props: ScopedProps<PopoverArrowProps>): FictNode {
  const popperScope = usePopperScope(props.__scopePopover)
  const arrowProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopePopover: undefined,
    },
  )

  return <PopperArrowPrimitive {...popperScope} {...arrowProps} />
}

PopoverArrow.displayName = ARROW_NAME

const Root = Popover
const Anchor = PopoverAnchor
const Trigger = PopoverTrigger
const Portal = PopoverPortal
const Content = PopoverContent
const Close = PopoverClose
const Arrow = PopoverArrow

export {
  createPopoverScope,
  Popover,
  PopoverAnchor,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverClose,
  PopoverArrow,
  Root,
  Anchor,
  Trigger,
  Portal,
  Content,
  Close,
  Arrow,
}

export type {
  PopoverProps,
  PopoverAnchorProps,
  PopoverTriggerProps,
  PopoverPortalProps,
  PopoverContentProps,
  PopoverCloseProps,
  PopoverArrowProps,
}
