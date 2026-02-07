import type { FictNode } from '@fictjs/runtime'

import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  type DialogRootProps,
  type DialogContentProps,
} from './dialog'

export function AlertDialogRoot(props: DialogRootProps): FictNode {
  return {
    type: DialogRoot,
    props: {
      ...props,
      modal: true,
    },
  }
}

export const AlertDialogTrigger = DialogTrigger
export const AlertDialogPortal = DialogPortal
export const AlertDialogOverlay = DialogOverlay
export const AlertDialogTitle = DialogTitle
export const AlertDialogDescription = DialogDescription

export function AlertDialogContent(props: DialogContentProps): FictNode {
  return {
    type: DialogContent,
    props: {
      ...props,
      role: props.role ?? 'alertdialog',
    },
  }
}

export function AlertDialogAction(props: Record<string, unknown> & { children?: FictNode }): FictNode {
  return {
    type: DialogClose,
    props,
  }
}

export function AlertDialogCancel(props: Record<string, unknown> & { children?: FictNode }): FictNode {
  return {
    type: DialogClose,
    props,
  }
}
