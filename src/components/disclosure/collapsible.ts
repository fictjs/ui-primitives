import { createContext, useContext, type FictNode } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'
import { Primitive } from '../core/primitive'

export interface CollapsibleRootProps {
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  children?: FictNode
}

export interface CollapsibleTriggerProps {
  as?: string
  asChild?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface CollapsibleContentProps {
  forceMount?: boolean
  children?: FictNode
  [key: string]: unknown
}

interface CollapsibleContextValue {
  open: () => boolean
  setOpen: (open: boolean) => void
  disabled: () => boolean
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null)

function useCollapsibleContext(component: string): CollapsibleContextValue {
  const context = useContext(CollapsibleContext)
  if (!context) {
    throw new Error(`${component} must be used inside CollapsibleRoot`)
  }
  return context
}

export function CollapsibleRoot(props: CollapsibleRootProps): FictNode {
  const state = createControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  })

  const context: CollapsibleContextValue = {
    open: () => state.get(),
    setOpen: open => state.set(open),
    disabled: () => props.disabled ?? false,
  }

  return {
    type: CollapsibleContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}

export function CollapsibleTrigger(props: CollapsibleTriggerProps): FictNode {
  const context = useCollapsibleContext('CollapsibleTrigger')
  const tag = props.as ?? 'button'

  return Primitive({
    ...props,
    as: tag,
    type: !props.asChild && tag === 'button' ? (props.type ?? 'button') : props.type,
    disabled: () => context.disabled(),
    'aria-expanded': () => context.open(),
    'data-state': () => (context.open() ? 'open' : 'closed'),
    onClick: (event: MouseEvent) => {
      ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
      if (event.defaultPrevented) return
      if (context.disabled()) return
      context.setOpen(!context.open())
    },
    children: props.children,
  })
}

export function CollapsibleContent(props: CollapsibleContentProps): FictNode {
  const context = useCollapsibleContext('CollapsibleContent')

  return {
    type: 'div',
    props: {
      'data-collapsible-content-wrapper': '',
      children: () =>
        context.open() || props.forceMount
          ? {
              type: 'div',
              props: {
                ...props,
                forceMount: undefined,
                'data-state': () => (context.open() ? 'open' : 'closed'),
                'data-collapsible-content': '',
                children: props.children,
              },
            }
          : null,
    },
  }
}
