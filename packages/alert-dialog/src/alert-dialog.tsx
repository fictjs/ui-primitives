import { mergeProps, prop, type FictNode } from '@fictjs/runtime'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import {
  createDialogScope,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  type DialogCloseProps,
  type DialogContentProps,
  type DialogDescriptionProps,
  type DialogOverlayProps,
  type DialogPortalProps,
  type DialogProps,
  type DialogTitleProps,
  type DialogTriggerProps,
} from '@fictjs/dialog'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type ScopedProps<P> = P & { __scopeAlertDialog?: Scope }
type AlertDialogContentElement = HTMLDivElement
type AlertDialogCancelElement = HTMLButtonElement

const ROOT_NAME = 'AlertDialog'
const TRIGGER_NAME = 'AlertDialogTrigger'
const PORTAL_NAME = 'AlertDialogPortal'
const OVERLAY_NAME = 'AlertDialogOverlay'
const CONTENT_NAME = 'AlertDialogContent'
const ACTION_NAME = 'AlertDialogAction'
const CANCEL_NAME = 'AlertDialogCancel'
const TITLE_NAME = 'AlertDialogTitle'
const DESCRIPTION_NAME = 'AlertDialogDescription'

const [createAlertDialogContext, createAlertDialogScope] = createContextScope(ROOT_NAME, [
  createDialogScope,
])
const useDialogScope = createDialogScope()

type AlertDialogContentContextValue = {
  cancelRef: { current: AlertDialogCancelElement | null }
}

const [AlertDialogContentProvider, useAlertDialogContentContext] =
  createAlertDialogContext<AlertDialogContentContextValue>(CONTENT_NAME)

type AlertDialogProps = Omit<DialogProps, 'modal'>
type AlertDialogTriggerProps = DialogTriggerProps
type AlertDialogPortalProps = DialogPortalProps
type AlertDialogOverlayProps = DialogOverlayProps
type AlertDialogTitleProps = DialogTitleProps
type AlertDialogDescriptionProps = DialogDescriptionProps
type AlertDialogActionProps = DialogCloseProps
type AlertDialogCancelProps = DialogCloseProps
type AlertDialogContentProps = Omit<
  DialogContentProps,
  'onPointerDownOutside' | 'onInteractOutside'
>

function AlertDialog(props: ScopedProps<AlertDialogProps>): FictNode {
  const dialogScope = useDialogScope(props.__scopeAlertDialog)
  const alertDialogProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeAlertDialog: undefined,
    },
  )

  return <Dialog {...dialogScope} {...alertDialogProps} modal />
}

AlertDialog.displayName = ROOT_NAME

function AlertDialogTrigger(props: ScopedProps<AlertDialogTriggerProps>): FictNode {
  const dialogScope = useDialogScope(props.__scopeAlertDialog)
  const triggerProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeAlertDialog: undefined,
    },
  )

  return <DialogTrigger {...dialogScope} {...triggerProps} />
}

AlertDialogTrigger.displayName = TRIGGER_NAME

function AlertDialogPortal(props: ScopedProps<AlertDialogPortalProps>): FictNode {
  const dialogScope = useDialogScope(props.__scopeAlertDialog)
  const portalProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeAlertDialog: undefined,
    },
  )

  return <DialogPortal {...dialogScope} {...portalProps} />
}

AlertDialogPortal.displayName = PORTAL_NAME

function AlertDialogOverlay(props: ScopedProps<AlertDialogOverlayProps>): FictNode {
  const dialogScope = useDialogScope(props.__scopeAlertDialog)
  const overlayProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeAlertDialog: undefined,
    },
  )

  return <DialogOverlay {...dialogScope} {...overlayProps} />
}

AlertDialogOverlay.displayName = OVERLAY_NAME

function AlertDialogContent(props: ScopedProps<AlertDialogContentProps>): FictNode {
  const dialogScope = useDialogScope(props.__scopeAlertDialog)
  const cancelRef = { current: null as AlertDialogCancelElement | null }
  const composedRefs = useComposedRefs(props.ref as PossibleRef<AlertDialogContentElement>)
  const contentProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeAlertDialog: undefined,
      children: undefined,
    },
  )

  return (
    <DialogContent
      {...dialogScope}
      {...contentProps}
      ref={composedRefs}
      role="alertdialog"
      onOpenAutoFocus={composeEventHandlers(
        (event) => props.onOpenAutoFocus?.(event),
        (event) => {
          event.preventDefault()
          queueMicrotask(() => {
            cancelRef.current?.focus({ preventScroll: true })
          })
        },
      )}
      onInteractOutside={(event) => {
        event.preventDefault()
      }}
      onPointerDownOutside={(event) => {
        event.preventDefault()
      }}
    >
      <AlertDialogContentProvider
        scope={props.__scopeAlertDialog as Scope<AlertDialogContentContextValue | undefined>}
        cancelRef={cancelRef}
      >
        {props.children}
      </AlertDialogContentProvider>
    </DialogContent>
  )
}

AlertDialogContent.displayName = CONTENT_NAME

function AlertDialogTitle(props: ScopedProps<AlertDialogTitleProps>): FictNode {
  const dialogScope = useDialogScope(props.__scopeAlertDialog)
  const titleProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeAlertDialog: undefined,
    },
  )

  return <DialogTitle {...dialogScope} {...titleProps} />
}

AlertDialogTitle.displayName = TITLE_NAME

function AlertDialogDescription(props: ScopedProps<AlertDialogDescriptionProps>): FictNode {
  const dialogScope = useDialogScope(props.__scopeAlertDialog)
  const descriptionProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeAlertDialog: undefined,
    },
  )

  return <DialogDescription {...dialogScope} {...descriptionProps} />
}

AlertDialogDescription.displayName = DESCRIPTION_NAME

function AlertDialogAction(props: ScopedProps<AlertDialogActionProps>): FictNode {
  const dialogScope = useDialogScope(props.__scopeAlertDialog)
  const actionProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeAlertDialog: undefined,
    },
  )

  return <DialogClose {...dialogScope} {...actionProps} />
}

AlertDialogAction.displayName = ACTION_NAME

function AlertDialogCancel(props: ScopedProps<AlertDialogCancelProps>): FictNode {
  const { cancelRef } = useAlertDialogContentContext(
    CANCEL_NAME,
    props.__scopeAlertDialog as Scope<AlertDialogContentContextValue | undefined>,
  )
  const dialogScope = useDialogScope(props.__scopeAlertDialog)
  const cancelProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeAlertDialog: undefined,
      ref: undefined,
    },
  )
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<AlertDialogCancelElement>,
    cancelRef,
  )

  useLayoutEffect(() => {
    return () => {
      cancelRef.current = null
    }
  })

  return <DialogClose {...dialogScope} {...cancelProps} ref={composedRefs} />
}

AlertDialogCancel.displayName = CANCEL_NAME

const Root = AlertDialog
const Trigger = AlertDialogTrigger
const Portal = AlertDialogPortal
const Overlay = AlertDialogOverlay
const Content = AlertDialogContent
const Action = AlertDialogAction
const Cancel = AlertDialogCancel
const Title = AlertDialogTitle
const Description = AlertDialogDescription

export {
  createAlertDialogScope,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTitle,
  AlertDialogDescription,
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  Action,
  Cancel,
  Title,
  Description,
}

export type {
  AlertDialogProps,
  AlertDialogTriggerProps,
  AlertDialogPortalProps,
  AlertDialogOverlayProps,
  AlertDialogContentProps,
  AlertDialogActionProps,
  AlertDialogCancelProps,
  AlertDialogTitleProps,
  AlertDialogDescriptionProps,
}
