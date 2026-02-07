import { createContext, useContext, type FictNode } from '@fictjs/runtime'
import { createRef } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'
import { createId } from '../../internal/ids'
import { composeRefs } from '../../internal/ref'
import { Portal } from '../core/portal'
import { DismissableLayer } from '../interaction/dismissable-layer'
import { PopperAnchor, PopperContent, PopperRoot, type PopperContentProps } from '../interaction/popper'

export interface PopoverRootProps {
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: FictNode
}

export interface PopoverTriggerProps {
  as?: string
  children?: FictNode
  onClick?: (event: MouseEvent) => void
  [key: string]: unknown
}

export interface PopoverContentPropsExt extends PopperContentProps {
  forceMount?: boolean
  portal?: boolean
  children?: FictNode
  [key: string]: unknown
}

interface PopoverContextValue {
  open: () => boolean
  setOpen: (open: boolean) => void
  contentId: string
  triggerRef: { current: HTMLElement | null }
}

type ElementRefProp = ((node: HTMLElement | null) => void) | { current: HTMLElement | null } | undefined

const PopoverContext = createContext<PopoverContextValue | null>(null)

function usePopoverContext(component: string): PopoverContextValue {
  const context = useContext(PopoverContext)
  if (!context) {
    throw new Error(`${component} must be used inside PopoverRoot`)
  }
  return context
}

export function PopoverRoot(props: PopoverRootProps): FictNode {
  const openState = createControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  })

  const context: PopoverContextValue = {
    open: () => openState.get(),
    setOpen: value => openState.set(value),
    contentId: createId('popover-content'),
    triggerRef: createRef<HTMLElement>(),
  }

  return {
    type: PopoverContext.Provider,
    props: {
      value: context,
      children: {
        type: PopperRoot,
        props: {
          children: props.children,
        },
      },
    },
  } as unknown as FictNode
}

export function PopoverTrigger(props: PopoverTriggerProps): FictNode {
  const context = usePopoverContext('PopoverTrigger')
  const tag = props.as ?? 'button'
  const refProp = props.ref as ElementRefProp

  return {
    type: PopperAnchor,
    props: {
      children: {
        type: tag,
        props: {
          ...props,
          as: undefined,
          type: tag === 'button' ? (props.type ?? 'button') : props.type,
          ref: composeRefs(context.triggerRef, refProp),
          'aria-haspopup': 'dialog',
          'aria-expanded': () => context.open(),
          'aria-controls': context.contentId,
          'data-state': () => (context.open() ? 'open' : 'closed'),
          onClick: (event: MouseEvent) => {
            props.onClick?.(event)
            if (event.defaultPrevented) return
            context.setOpen(!context.open())
          },
          children: props.children,
        },
      },
    },
  }
}

function buildPopoverContent(context: PopoverContextValue, props: PopoverContentPropsExt): FictNode {
  return {
    type: DismissableLayer,
    props: {
      onDismiss: () => context.setOpen(false),
      children: {
        type: PopperContent,
        props: {
          ...props,
          portal: undefined,
          forceMount: undefined,
          id: props.id ?? context.contentId,
          role: props.role ?? 'dialog',
          'data-popover-content': '',
          'data-state': () => (context.open() ? 'open' : 'closed'),
          children: props.children,
        },
      },
    },
  }
}

export function PopoverContent(props: PopoverContentPropsExt): FictNode {
  const context = usePopoverContext('PopoverContent')
  const content = buildPopoverContent(context, props)

  const child = () => ((context.open() || props.forceMount) ? content : null)

  if (props.portal ?? true) {
    return {
      type: Portal,
      props: {
        children: child,
      },
    }
  }

  return {
    type: 'div',
    props: {
      'data-popover-inline-container': '',
      children: child,
    },
  }
}

export function PopoverClose(props: Record<string, unknown> & { children?: FictNode }): FictNode {
  const context = usePopoverContext('PopoverClose')
  const tag = (props.as as string | undefined) ?? 'button'

  return {
    type: tag,
    props: {
      ...props,
      as: undefined,
      type: tag === 'button' ? ((props.type as string | undefined) ?? 'button') : props.type,
      onClick: (event: MouseEvent) => {
        ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
        if (event.defaultPrevented) return
        context.setOpen(false)
      },
      children: props.children,
    },
  }
}
