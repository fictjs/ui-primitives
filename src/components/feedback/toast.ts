import { createContext, onDestroy, useContext, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'
import { useDebounceFn } from '@fictjs/hooks'

import { createId } from '../../internal/ids'
import { Primitive } from '../core/primitive'
import { VisuallyHidden } from '../core/visually-hidden'

export interface ToastProviderProps {
  duration?: number
  children?: FictNode
}

export interface ToastViewportProps {
  children?: FictNode
  [key: string]: unknown
}

export interface ToastRootProps {
  id?: string
  title?: string
  description?: string
  duration?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: FictNode
  [key: string]: unknown
}

export interface ToastActionProps {
  altText: string
  onClick?: (event: MouseEvent) => void
  children?: FictNode
  [key: string]: unknown
}

export interface ToastCloseProps {
  as?: string
  asChild?: boolean
  onClick?: (event: MouseEvent) => void
  children?: FictNode
  [key: string]: unknown
}

interface ToastRecord {
  id: string
  title?: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toasts: () => ToastRecord[]
  show: (toast: Omit<ToastRecord, 'id'> & { id?: string }) => string
  dismiss: (id: string) => void
  duration: () => number
}

interface ToastTimerController {
  run: () => void
  cancel: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function useToastContext(component: string): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error(`${component} must be used inside ToastProvider`)
  }
  return context
}

export function ToastProvider(props: ToastProviderProps): FictNode {
  const toastsSignal = createSignal<ToastRecord[]>([])
  const timers = new Map<string, ToastTimerController>()

  const dismiss = (id: string) => {
    toastsSignal(toastsSignal().filter(toast => toast.id !== id))
    const timer = timers.get(id)
    if (timer) {
      timer.cancel()
      timers.delete(id)
    }
  }

  const show = (toast: Omit<ToastRecord, 'id'> & { id?: string }): string => {
    const id = toast.id ?? createId('toast')
    const existingTimer = timers.get(id)
    existingTimer?.cancel()
    timers.delete(id)
    const nextToast: ToastRecord = {
      id,
      title: toast.title,
      description: toast.description,
      duration: toast.duration,
    }

    toastsSignal([...toastsSignal(), nextToast])

    const timer = useDebounceFn(
      () => {
        dismiss(id)
      },
      toast.duration ?? props.duration ?? 5000,
    )
    timer.run()
    timers.set(id, timer)

    return id
  }

  onDestroy(() => {
    for (const timer of timers.values()) {
      timer.cancel()
    }
    timers.clear()
  })

  const context: ToastContextValue = {
    toasts: () => toastsSignal(),
    show,
    dismiss,
    duration: () => props.duration ?? 5000,
  }

  return {
    type: ToastContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}

export function useToast() {
  const context = useToastContext('useToast')
  return {
    show: context.show,
    dismiss: context.dismiss,
    toasts: context.toasts,
  }
}

export function ToastViewport(props: ToastViewportProps): FictNode {
  const context = useToastContext('ToastViewport')

  return {
    type: 'div',
    props: {
      ...props,
      role: 'region',
      'aria-live': 'polite',
      'aria-relevant': 'additions text',
      'data-toast-viewport': '',
      children: [
        props.children,
        {
          type: 'div',
          props: {
            children: () =>
              context.toasts().map(toast => ({
                type: ToastRoot,
                props: {
                  id: toast.id,
                  title: toast.title,
                  description: toast.description,
                  duration: toast.duration ?? context.duration(),
                },
              })),
          },
        },
      ],
    },
  }
}

export function ToastRoot(props: ToastRootProps): FictNode {
  const context = useContext(ToastContext)

  const close = () => {
    if (props.id && context) {
      context.dismiss(props.id)
    }
    props.onOpenChange?.(false)
  }

  return {
    type: 'div',
    props: {
      ...props,
      role: props.role ?? 'status',
      'data-toast-root': '',
      children: [
        props.title ? { type: ToastTitle, props: { children: props.title } } : null,
        props.description ? { type: ToastDescription, props: { children: props.description } } : null,
        props.children,
        {
          type: ToastClose,
          props: {
            onClick: () => close(),
            children: props['data-close-label'] ?? 'Dismiss',
          },
        },
      ],
    },
  }
}

export function ToastTitle(props: Record<string, unknown> & { children?: FictNode }): FictNode {
  return {
    type: 'div',
    props: {
      ...props,
      'data-toast-title': '',
      children: props.children,
    },
  }
}

export function ToastDescription(props: Record<string, unknown> & { children?: FictNode }): FictNode {
  return {
    type: 'div',
    props: {
      ...props,
      'data-toast-description': '',
      children: props.children,
    },
  }
}

export function ToastAction(props: ToastActionProps): FictNode {
  return {
    type: 'button',
    props: {
      ...props,
      type: 'button',
      'data-toast-action': '',
      'aria-label': props.altText,
      children: [props.children, { type: VisuallyHidden, props: { children: props.altText } }],
    },
  }
}

export function ToastClose(props: ToastCloseProps): FictNode {
  const tag = props.as ?? 'button'

  return Primitive({
    ...props,
    as: tag,
    type: !props.asChild && tag === 'button' ? 'button' : props.type,
    'data-toast-close': '',
    onClick: (event: MouseEvent) => {
      props.onClick?.(event)
    },
    children: props.children ?? 'Close',
  })
}
