import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import {
  DismissableLayer,
  type DismissableLayerProps,
} from '@fictjs/dismissable-layer'
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
import { Presence } from '@fictjs/presence'
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
  forceMount: boolean | undefined
}

const [PopoverProvider, usePopoverContext] =
  createPopoverContext<PopoverContextValue>(POPOVER_NAME)
const [PortalProvider, usePortalContext] = createPopoverContext<PortalContextValue>(PORTAL_NAME, {
  forceMount: undefined,
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

function Popover(props: ScopedProps<PopoverProps>): FictNode {
  const popperScope = usePopperScope(props.__scopePopover)
  const triggerRef = { current: null as HTMLButtonElement | null }
  const contentId = useId()
  const hasCustomAnchor = createSignal(false)
  const openProp = () =>
    props.open === undefined ? undefined : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? false
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? false)
  const modal = () => Boolean(readValue(props.modal as MaybeAccessor<boolean | undefined>))
  const controllableStateProps = {
    prop: openProp,
    defaultProp: defaultOpen,
    caller: POPOVER_NAME,
    ...(props.onOpenChange ? { onChange: props.onOpenChange } : {}),
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
  const { __scopePopover, ...anchorProps } = props
  const context = usePopoverContext(
    ANCHOR_NAME,
    __scopePopover as Scope<PopoverContextValue | undefined>,
  )
  const popperScope = usePopperScope(__scopePopover)

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
  const { __scopePopover, ...triggerProps } = props
  const context = usePopoverContext(
    TRIGGER_NAME,
    __scopePopover as Scope<PopoverContextValue | undefined>,
  )
  const popperScope = usePopperScope(__scopePopover)
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
    () => triggerProps as Record<string, unknown>,
    {
      onClick: composeEventHandlers<MouseEvent>(
        props.onClick as ((event: MouseEvent) => void) | undefined,
        context.onOpenToggle,
      ),
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
  const { __scopePopover, children, container, forceMount } = props
  const nextForceMount = forceMount === undefined ? undefined : readValue(forceMount)
  const portalProps =
    container === undefined
      ? { style: { display: 'contents' } }
      : { container, style: { display: 'contents' } }

  return (
    <PortalProvider
      scope={__scopePopover as Scope<PortalContextValue | undefined>}
      forceMount={nextForceMount}
    >
      <PortalPrimitive {...portalProps}>
        {children}
      </PortalPrimitive>
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
  const { forceMount, ...contentProps } = props
  const present = () =>
    Boolean(
      (forceMount === undefined
        ? portalContext.forceMount
        : readValue(forceMount as MaybeAccessor<boolean | undefined>)) || context.open(),
    )

  return (
    <Presence present={present}>
      {context.modal() ? (
        <PopoverContentModal {...(contentProps as ScopedProps<PopoverContentTypeProps>)} />
      ) : (
        <PopoverContentNonModal {...(contentProps as ScopedProps<PopoverContentTypeProps>)} />
      )}
    </Presence>
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

  return (
    <RemoveScroll allowPinchZoom forwardProps>
      <PopoverContentImpl
        {...props}
        ref={composedRefs}
        trapFocus={() => context.open()}
        disableOutsidePointerEvents
        onCloseAutoFocus={composeEventHandlers(
          props.onCloseAutoFocus,
          (event) => {
            event.preventDefault()
            if (!isRightClickOutsideRef.current) {
              context.triggerRef.current?.focus()
            }
          },
        )}
        onPointerDownOutside={composeEventHandlers(
          props.onPointerDownOutside,
          (event) => {
            const originalEvent = event.detail.originalEvent
            const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true
            const isRightClick = originalEvent.button === 2 || ctrlLeftClick

            isRightClickOutsideRef.current = isRightClick
          },
          { checkForDefaultPrevented: false },
        )}
        onFocusOutside={composeEventHandlers(
          props.onFocusOutside,
          (event) => {
            event.preventDefault()
          },
          { checkForDefaultPrevented: false },
        )}
      />
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

  return (
    <PopoverContentImpl
      {...props}
      trapFocus={false}
      disableOutsidePointerEvents={false}
      onCloseAutoFocus={(event) => {
        props.onCloseAutoFocus?.(event)

        if (!event.defaultPrevented) {
          if (!hasInteractedOutsideRef.current) {
            context.triggerRef.current?.focus()
          }
          event.preventDefault()
        }

        hasInteractedOutsideRef.current = false
        hasPointerDownOutsideRef.current = false
      }}
      onInteractOutside={(event) => {
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
      }}
    />
  )
}

function PopoverContentImpl(props: ScopedProps<PopoverContentImplProps>): FictNode {
  const {
    __scopePopover,
    trapFocus,
    onOpenAutoFocus,
    onCloseAutoFocus,
    disableOutsidePointerEvents,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
    ...contentProps
  } = props
  const context = usePopoverContext(
    CONTENT_NAME,
    __scopePopover as Scope<PopoverContextValue | undefined>,
  )
  const popperScope = usePopperScope(__scopePopover)

  useFocusGuards()

  const popperProps = mergeProps(
    {
      'data-state': prop(() => getState(context.open())),
      role: 'dialog',
      id: prop(context.contentId),
    },
    popperScope,
    () => contentProps as Record<string, unknown>,
    {
      style: prop(() => ({
        ...readStyle(contentProps.style as MaybeAccessor<unknown> | undefined),
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
  }
  if (trapFocus !== undefined) {
    focusScopeProps.trapped = trapFocus
  }
  if (onOpenAutoFocus !== undefined) {
    focusScopeProps.onMountAutoFocus = onOpenAutoFocus
  }
  if (onCloseAutoFocus !== undefined) {
    focusScopeProps.onUnmountAutoFocus = onCloseAutoFocus
  }

  const dismissableLayerProps: Record<string, unknown> = {
    asChild: true,
    onDismiss: () => context.onOpenChange(false),
  }
  if (disableOutsidePointerEvents !== undefined) {
    dismissableLayerProps.disableOutsidePointerEvents = disableOutsidePointerEvents
  }
  if (onEscapeKeyDown !== undefined) {
    dismissableLayerProps.onEscapeKeyDown = onEscapeKeyDown
  }
  if (onPointerDownOutside !== undefined) {
    dismissableLayerProps.onPointerDownOutside = onPointerDownOutside
  }
  if (onFocusOutside !== undefined) {
    dismissableLayerProps.onFocusOutside = onFocusOutside
  }
  if (onInteractOutside !== undefined) {
    dismissableLayerProps.onInteractOutside = onInteractOutside
  }
  const contentPrimitiveProps =
    props.ref === undefined
      ? popperProps
      : mergeProps(popperProps, {
          ref: props.ref as PossibleRef<HTMLDivElement>,
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
  const { __scopePopover, ...closeProps } = props
  const context = usePopoverContext(
    CLOSE_NAME,
    __scopePopover as Scope<PopoverContextValue | undefined>,
  )
  const primitiveProps = mergeProps(
    {
      type: 'button',
    },
    () => closeProps as Record<string, unknown>,
    {
      onClick: composeEventHandlers<MouseEvent>(
        props.onClick as ((event: MouseEvent) => void) | undefined,
        () => {
          context.onOpenChange(false)
        },
      ),
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
  const { __scopePopover, ...arrowProps } = props
  const popperScope = usePopperScope(__scopePopover)

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
