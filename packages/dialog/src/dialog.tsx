import {
  createContext,
  mergeProps,
  prop,
  useContext,
  type FictNode,
  type JSX,
} from '@fictjs/runtime'

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
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type ScopedProps<P> = P & { __scopeDialog?: Scope }
type StyleRecord = Record<string, string | number>
type DialogContentElement = HTMLDivElement
type DialogOverlayElement = HTMLDivElement

const DIALOG_NAME = 'Dialog'
const TRIGGER_NAME = 'DialogTrigger'
const PORTAL_NAME = 'DialogPortal'
const OVERLAY_NAME = 'DialogOverlay'
const CONTENT_NAME = 'DialogContent'
const TITLE_NAME = 'DialogTitle'
const DESCRIPTION_NAME = 'DialogDescription'
const CLOSE_NAME = 'DialogClose'
const TITLE_WARNING_NAME = 'DialogTitleWarning'
const DESCRIPTION_WARNING_NAME = 'DialogDescriptionWarning'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createDialogContext, createDialogScope] = createContextScope(DIALOG_NAME)

type DialogContextValue = {
  triggerRef: { current: HTMLButtonElement | null }
  contentRef: { current: DialogContentElement | null }
  contentId: () => string
  titleId: () => string
  descriptionId: () => string
  open: () => boolean
  onOpenChange(open: boolean): void
  onOpenToggle(): void
  modal: () => boolean
}

type PortalContextValue = {
  forceMount: boolean | undefined
}

const [DialogProvider, useDialogContext] = createDialogContext<DialogContextValue>(DIALOG_NAME)
const [PortalProvider, usePortalContext] = createDialogContext<PortalContextValue>(PORTAL_NAME, {
  forceMount: undefined,
})

type WarningContextValue = {
  contentName: string
  titleName: string
  docsSlug: string
}

const WarningContext = createContext<WarningContextValue>({
  contentName: CONTENT_NAME,
  titleName: TITLE_NAME,
  docsSlug: 'dialog',
})

type DialogProps = {
  children?: FictNode | FictNode[]
  open?: MaybeAccessor<boolean | undefined>
  defaultOpen?: MaybeAccessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
  modal?: MaybeAccessor<boolean | undefined>
}

type DialogTriggerProps = PrimitiveButtonProps

type DialogPortalProps = {
  children?: FictNode | FictNode[]
  container?: PortalPrimitiveProps['container']
  forceMount?: MaybeAccessor<boolean | undefined>
}

type DialogOverlayProps = DialogOverlayImplProps & {
  forceMount?: MaybeAccessor<boolean | undefined>
}

type DialogContentImplProps = Omit<DismissableLayerProps, 'onDismiss'> & {
  trapFocus?: FocusScopeProps['trapped']
  onOpenAutoFocus?: FocusScopeProps['onMountAutoFocus']
  onCloseAutoFocus?: FocusScopeProps['onUnmountAutoFocus']
}

type DialogContentTypeProps = Omit<
  DialogContentImplProps,
  'trapFocus' | 'disableOutsidePointerEvents'
>

type DialogContentProps = DialogContentTypeProps & {
  forceMount?: MaybeAccessor<boolean | undefined>
}

type DialogOverlayImplProps = PrimitiveDivProps

type DialogTitleProps = JSX.IntrinsicElements['h2'] & {
  asChild?: boolean
}

type DialogDescriptionProps = JSX.IntrinsicElements['p'] & {
  asChild?: boolean
}

type DialogCloseProps = PrimitiveButtonProps

type WarningProviderProps = Partial<WarningContextValue> & {
  children?: FictNode | FictNode[]
}

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

function Dialog(props: ScopedProps<DialogProps>): FictNode {
  const triggerRef = { current: null as HTMLButtonElement | null }
  const contentRef = { current: null as DialogContentElement | null }
  const contentId = useId()
  const titleId = useId()
  const descriptionId = useId()
  const openProp = () =>
    props.open === undefined ? undefined : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? false
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? false)
  const modal = () =>
    props.modal === undefined ? true : Boolean(readValue(props.modal as MaybeAccessor<boolean | undefined>))
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: DIALOG_NAME,
    ...(props.onOpenChange ? { onChange: props.onOpenChange } : {}),
  })

  return (
    <DialogProvider
      scope={props.__scopeDialog as Scope<DialogContextValue | undefined>}
      contentId={contentId}
      contentRef={contentRef}
      descriptionId={descriptionId}
      modal={modal}
      onOpenChange={setOpen}
      onOpenToggle={() => {
        setOpen((previousOpen) => !previousOpen)
      }}
      open={open}
      titleId={titleId}
      triggerRef={triggerRef}
    >
      {props.children}
    </DialogProvider>
  )
}

Dialog.displayName = DIALOG_NAME

function DialogTrigger(props: ScopedProps<DialogTriggerProps>): FictNode {
  const { __scopeDialog, ...triggerProps } = props
  const context = useDialogContext(
    TRIGGER_NAME,
    __scopeDialog as Scope<DialogContextValue | undefined>,
  )
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

  return <Primitive.button {...primitiveProps} ref={composedTriggerRef} />
}

DialogTrigger.displayName = TRIGGER_NAME

function DialogPortal(props: ScopedProps<DialogPortalProps>): FictNode {
  const { __scopeDialog, children, container, forceMount } = props
  const nextForceMount = forceMount === undefined ? undefined : readValue(forceMount)
  const portalProps =
    container === undefined
      ? { style: { display: 'contents' } }
      : { container, style: { display: 'contents' } }

  return (
    <PortalProvider
      scope={__scopeDialog as Scope<PortalContextValue | undefined>}
      forceMount={nextForceMount}
    >
      <PortalPrimitive {...portalProps}>{children}</PortalPrimitive>
    </PortalProvider>
  )
}

DialogPortal.displayName = PORTAL_NAME

function DialogOverlay(props: ScopedProps<DialogOverlayProps>): FictNode {
  const portalContext = usePortalContext(
    OVERLAY_NAME,
    props.__scopeDialog as Scope<PortalContextValue | undefined>,
  )
  const context = useDialogContext(
    OVERLAY_NAME,
    props.__scopeDialog as Scope<DialogContextValue | undefined>,
  )
  const { forceMount, ...overlayProps } = props
  const present = () =>
    Boolean(
      (forceMount === undefined
        ? portalContext.forceMount
        : readValue(forceMount as MaybeAccessor<boolean | undefined>)) || context.open(),
    )

  if (!context.modal()) {
    return null
  }

  return (
    <Presence present={present}>
      <DialogOverlayImpl {...(overlayProps as ScopedProps<DialogOverlayImplProps>)} />
    </Presence>
  )
}

DialogOverlay.displayName = OVERLAY_NAME

function DialogOverlayImpl(props: ScopedProps<DialogOverlayImplProps>): FictNode {
  const { __scopeDialog, ...overlayProps } = props
  const context = useDialogContext(
    OVERLAY_NAME,
    __scopeDialog as Scope<DialogContextValue | undefined>,
  )
  const primitiveProps = mergeProps(
    {
      'data-state': prop(() => getState(context.open())),
    },
    () => overlayProps as Record<string, unknown>,
    {
      style: prop(() => ({
        pointerEvents: 'auto',
        ...readStyle(overlayProps.style as MaybeAccessor<unknown> | undefined),
      })),
    },
  )
  const overlayPrimitiveProps =
    props.ref === undefined
      ? primitiveProps
      : mergeProps(primitiveProps, {
          ref: props.ref as PossibleRef<DialogOverlayElement>,
        })

  return (
    <RemoveScroll allowPinchZoom shards={[context.contentRef]}>
      <Primitive.div {...(overlayPrimitiveProps as Record<string, unknown>)} />
    </RemoveScroll>
  )
}

function DialogContent(props: ScopedProps<DialogContentProps>): FictNode {
  const portalContext = usePortalContext(
    CONTENT_NAME,
    props.__scopeDialog as Scope<PortalContextValue | undefined>,
  )
  const context = useDialogContext(
    CONTENT_NAME,
    props.__scopeDialog as Scope<DialogContextValue | undefined>,
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
        <DialogContentModal {...(contentProps as ScopedProps<DialogContentTypeProps>)} />
      ) : (
        <DialogContentNonModal {...(contentProps as ScopedProps<DialogContentTypeProps>)} />
      )}
    </Presence>
  )
}

DialogContent.displayName = CONTENT_NAME

function DialogContentModal(props: ScopedProps<DialogContentTypeProps>): FictNode {
  const context = useDialogContext(
    CONTENT_NAME,
    props.__scopeDialog as Scope<DialogContextValue | undefined>,
  )
  const contentRef = { current: null as HTMLDivElement | null }
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLDivElement>,
    context.contentRef,
    contentRef,
  )

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
    <DialogContentImpl
      {...props}
      ref={composedRefs}
      trapFocus={() => context.open()}
      disableOutsidePointerEvents
      onCloseAutoFocus={composeEventHandlers(
        props.onCloseAutoFocus,
        (event) => {
          event.preventDefault()
          context.triggerRef.current?.focus()
        },
      )}
      onPointerDownOutside={composeEventHandlers(
        props.onPointerDownOutside,
        (event) => {
          const originalEvent = event.detail.originalEvent
          const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true
          const isRightClick = originalEvent.button === 2 || ctrlLeftClick

          if (isRightClick) {
            event.preventDefault()
          }
        },
      )}
      onFocusOutside={composeEventHandlers(
        props.onFocusOutside,
        (event) => {
          event.preventDefault()
        },
        { checkForDefaultPrevented: false },
      )}
    />
  )
}

function DialogContentNonModal(props: ScopedProps<DialogContentTypeProps>): FictNode {
  const context = useDialogContext(
    CONTENT_NAME,
    props.__scopeDialog as Scope<DialogContextValue | undefined>,
  )
  const hasInteractedOutsideRef = { current: false }
  const hasPointerDownOutsideRef = { current: false }

  return (
    <DialogContentImpl
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

function DialogContentImpl(props: ScopedProps<DialogContentImplProps>): FictNode {
  const {
    __scopeDialog,
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
  const context = useDialogContext(
    CONTENT_NAME,
    __scopeDialog as Scope<DialogContextValue | undefined>,
  )

  useFocusGuards()

  const primitiveProps = mergeProps(
    {
      role: 'dialog',
      id: prop(context.contentId),
      'aria-describedby': prop(context.descriptionId),
      'aria-labelledby': prop(context.titleId),
      'data-state': prop(() => getState(context.open())),
    },
    () => contentProps as Record<string, unknown>,
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
      ? primitiveProps
      : mergeProps(primitiveProps, {
          ref: props.ref as PossibleRef<DialogContentElement>,
        })

  return (
    <>
      <FocusScope {...(focusScopeProps as Record<string, unknown>)}>
        <DismissableLayer {...dismissableLayerProps}>
          <Primitive.div {...(contentPrimitiveProps as Record<string, unknown>)} />
        </DismissableLayer>
      </FocusScope>
      {process.env.NODE_ENV !== 'production' ? (
        <>
          <TitleWarning titleId={context.titleId()} />
          <DescriptionWarning contentRef={context.contentRef} descriptionId={context.descriptionId()} />
        </>
      ) : null}
    </>
  )
}

function DialogTitle(props: ScopedProps<DialogTitleProps>): FictNode {
  const { __scopeDialog, ...titleProps } = props
  const context = useDialogContext(
    TITLE_NAME,
    __scopeDialog as Scope<DialogContextValue | undefined>,
  )
  const primitiveProps = mergeProps(
    {
      id: prop(context.titleId),
    },
    () => titleProps as Record<string, unknown>,
  )

  return <Primitive.h2 {...primitiveProps} />
}

DialogTitle.displayName = TITLE_NAME

function DialogDescription(props: ScopedProps<DialogDescriptionProps>): FictNode {
  const { __scopeDialog, ...descriptionProps } = props
  const context = useDialogContext(
    DESCRIPTION_NAME,
    __scopeDialog as Scope<DialogContextValue | undefined>,
  )
  const primitiveProps = mergeProps(
    {
      id: prop(context.descriptionId),
    },
    () => descriptionProps as Record<string, unknown>,
  )

  return <Primitive.p {...primitiveProps} />
}

DialogDescription.displayName = DESCRIPTION_NAME

function DialogClose(props: ScopedProps<DialogCloseProps>): FictNode {
  const { __scopeDialog, ...closeProps } = props
  const context = useDialogContext(
    CLOSE_NAME,
    __scopeDialog as Scope<DialogContextValue | undefined>,
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

DialogClose.displayName = CLOSE_NAME

function WarningProvider(props: WarningProviderProps): FictNode {
  return WarningContext.Provider({
    value: {
      contentName: props.contentName ?? CONTENT_NAME,
      titleName: props.titleName ?? TITLE_NAME,
      docsSlug: props.docsSlug ?? 'dialog',
    },
    children: props.children,
  })
}

WarningProvider.displayName = 'DialogWarningProvider'

type TitleWarningProps = {
  titleId?: string
}

function TitleWarning({ titleId }: TitleWarningProps): null {
  const warningContext = useContext(WarningContext)

  useLayoutEffect(() => {
    if (!titleId) {
      return
    }

    queueMicrotask(() => {
      const hasTitle = document.getElementById(titleId)
      if (!hasTitle) {
        console.error(
          `\`${warningContext.contentName}\` requires a \`${warningContext.titleName}\` for the component to be accessible for screen reader users.\n\nIf you want to hide the \`${warningContext.titleName}\`, you can wrap it with our VisuallyHidden component.\n\nFor more information, see https://radix-ui.com/primitives/docs/components/${warningContext.docsSlug}`,
        )
      }
    })
  })

  return null
}

type DescriptionWarningProps = {
  contentRef: { current: DialogContentElement | null }
  descriptionId?: string
}

function DescriptionWarning({ contentRef, descriptionId }: DescriptionWarningProps): null {
  const warningContext = useContext(WarningContext)

  useLayoutEffect(() => {
    queueMicrotask(() => {
      const describedById = contentRef.current?.getAttribute('aria-describedby')
      if (descriptionId && describedById) {
        const hasDescription = document.getElementById(descriptionId)
        if (!hasDescription) {
          console.warn(
            `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for \`${warningContext.contentName}\`.`,
          )
        }
      }
    })
  })

  return null
}

const Root = Dialog
const Trigger = DialogTrigger
const Portal = DialogPortal
const Overlay = DialogOverlay
const Content = DialogContent
const Title = DialogTitle
const Description = DialogDescription
const Close = DialogClose

export {
  createDialogScope,
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  Title,
  Description,
  Close,
  WarningProvider,
}

export type {
  DialogProps,
  DialogTriggerProps,
  DialogPortalProps,
  DialogOverlayProps,
  DialogContentProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogCloseProps,
}
