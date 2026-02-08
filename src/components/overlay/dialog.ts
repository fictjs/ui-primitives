import { createContext, useContext, type FictNode } from '@fictjs/runtime'
import { createRef } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'
import { useId } from '../../internal/ids'
import { composeRefs } from '../../internal/ref'
import { Primitive } from '../core/primitive'
import { Portal } from '../core/portal'
import { DismissableLayer } from '../interaction/dismissable-layer'
import { FocusScope } from '../interaction/focus-scope'
import { ScrollLock } from '../interaction/scroll-lock'

export interface DialogRootProps {
  id?: string
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  children?: FictNode
}

export interface DialogPortalProps {
  container?: HTMLElement | null | (() => HTMLElement | null)
  forceMount?: boolean
  children?: FictNode
}

export interface DialogTriggerProps {
  as?: string
  asChild?: boolean
  children?: FictNode
  onClick?: (event: MouseEvent) => void
  [key: string]: unknown
}

export interface DialogOverlayProps {
  forceMount?: boolean
  children?: FictNode
  onClick?: (event: MouseEvent) => void
  [key: string]: unknown
}

export interface DialogContentProps {
  forceMount?: boolean
  portal?: boolean
  onDismiss?: () => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void
  onPointerDownOutside?: (event: PointerEvent) => void
  onFocusOutside?: (event: FocusEvent) => void
  children?: FictNode
  [key: string]: unknown
}

export interface DialogCloseProps {
  as?: string
  asChild?: boolean
  children?: FictNode
  onClick?: (event: MouseEvent) => void
  [key: string]: unknown
}

interface DialogContextValue {
  open: () => boolean
  setOpen: (open: boolean) => void
  modal: () => boolean
  contentId: string
  titleId: string
  descriptionId: string
  triggerRef: { current: HTMLElement | null }
  contentRef: { current: HTMLElement | null }
}

type ElementRefProp = ((node: HTMLElement | null) => void) | { current: HTMLElement | null } | undefined

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext(component: string): DialogContextValue {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error(`${component} must be used inside DialogRoot`)
  }
  return context
}

function shouldRender(open: boolean, forceMount?: boolean): boolean {
  return open || !!forceMount
}

export function DialogRoot(props: DialogRootProps): FictNode {
  const openState = createControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  })
  const baseId = useId(props.id, 'dialog')

  const context: DialogContextValue = {
    open: () => openState.get(),
    setOpen: value => openState.set(value),
    modal: () => props.modal ?? true,
    contentId: `${baseId}-content`,
    titleId: `${baseId}-title`,
    descriptionId: `${baseId}-description`,
    triggerRef: createRef<HTMLElement>(),
    contentRef: createRef<HTMLElement>(),
  }

  return {
    type: DialogContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}

export function DialogPortal(props: DialogPortalProps): FictNode {
  const context = useDialogContext('DialogPortal')

  return {
    type: Portal,
    props: {
      container: props.container,
      children: () => (shouldRender(context.open(), props.forceMount) ? props.children ?? null : null),
    },
  }
}

export function DialogTrigger(props: DialogTriggerProps): FictNode {
  const context = useDialogContext('DialogTrigger')
  const tag = props.as ?? 'button'
  const refProp = props.ref as ElementRefProp

  const onClick = (event: MouseEvent) => {
    props.onClick?.(event)
    if (event.defaultPrevented) return
    context.setOpen(!context.open())
  }

  return Primitive({
    ...props,
    as: tag,
    type: !props.asChild && tag === 'button' ? (props.type ?? 'button') : props.type,
    ref: composeRefs(context.triggerRef, refProp),
    'aria-haspopup': 'dialog',
    'aria-expanded': () => context.open(),
    'aria-controls': context.contentId,
    'data-state': () => (context.open() ? 'open' : 'closed'),
    onClick,
    children: props.children,
  })
}

export function DialogOverlay(props: DialogOverlayProps): FictNode {
  const context = useDialogContext('DialogOverlay')

  const overlayNode = {
    type: 'div',
    props: {
      ...props,
      forceMount: undefined,
      role: 'presentation',
      'data-state': () => (context.open() ? 'open' : 'closed'),
      'data-dialog-overlay': '',
      onClick: (event: MouseEvent) => {
        props.onClick?.(event)
        if (event.defaultPrevented) return
        context.setOpen(false)
      },
      children: props.children,
    },
  }

  return {
    type: DialogPortal,
    props: {
      forceMount: props.forceMount,
      children: overlayNode,
    },
  }
}

function buildDialogContentNode(context: DialogContextValue, props: DialogContentProps): FictNode {
  const refProp = props.ref as ElementRefProp

  return {
    type: DismissableLayer,
    props: {
      onEscapeKeyDown: props.onEscapeKeyDown,
      onInteractOutside: props.onInteractOutside,
      onPointerDownOutside: props.onPointerDownOutside,
      onFocusOutside: props.onFocusOutside,
      onDismiss: () => {
        props.onDismiss?.()
        context.setOpen(false)
      },
      children: {
        type: FocusScope,
        props: {
          trapped: () => context.modal(),
          loop: true,
          autoFocus: true,
          restoreFocus: true,
          children: [
            context.modal() ? { type: ScrollLock, props: { enabled: true } } : null,
            {
              type: 'div',
              props: {
                ...props,
                portal: undefined,
                forceMount: undefined,
                onDismiss: undefined,
                onEscapeKeyDown: undefined,
                onInteractOutside: undefined,
                onPointerDownOutside: undefined,
                onFocusOutside: undefined,
                ref: composeRefs(context.contentRef, refProp),
                id: props.id ?? context.contentId,
                role: props.role ?? 'dialog',
                'aria-modal': context.modal() ? 'true' : undefined,
                'aria-labelledby': props['aria-labelledby'] ?? context.titleId,
                'aria-describedby': props['aria-describedby'] ?? context.descriptionId,
                'data-state': () => (context.open() ? 'open' : 'closed'),
                'data-dialog-content': '',
                children: props.children,
              },
            },
          ],
        },
      },
    },
  }
}

export function DialogContent(props: DialogContentProps): FictNode {
  const context = useDialogContext('DialogContent')
  const node = buildDialogContentNode(context, props)

  if (props.portal ?? true) {
    return {
      type: DialogPortal,
      props: {
        forceMount: props.forceMount,
        children: node,
      },
    }
  }

  return {
    type: 'div',
    props: {
      'data-dialog-inline-container': '',
      children: () => (shouldRender(context.open(), props.forceMount) ? node : null),
    },
  }
}

export function DialogClose(props: DialogCloseProps): FictNode {
  const context = useDialogContext('DialogClose')
  const tag = props.as ?? 'button'

  return Primitive({
    ...props,
    as: tag,
    type: !props.asChild && tag === 'button' ? (props.type ?? 'button') : props.type,
    onClick: (event: MouseEvent) => {
      props.onClick?.(event)
      if (event.defaultPrevented) return
      context.setOpen(false)
    },
    children: props.children,
  })
}

export function DialogTitle(props: Record<string, unknown> & { children?: FictNode }): FictNode {
  const context = useDialogContext('DialogTitle')

  return {
    type: 'h2',
    props: {
      ...props,
      id: (props.id as string | undefined) ?? context.titleId,
      'data-dialog-title': '',
      children: props.children,
    },
  }
}

export function DialogDescription(props: Record<string, unknown> & { children?: FictNode }): FictNode {
  const context = useDialogContext('DialogDescription')

  return {
    type: 'p',
    props: {
      ...props,
      id: (props.id as string | undefined) ?? context.descriptionId,
      'data-dialog-description': '',
      children: props.children,
    },
  }
}
