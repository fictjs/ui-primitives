import { createContext, useContext, type FictNode } from '@fictjs/runtime'
import { useDebounceFn } from '@fictjs/hooks'

import { createControllableState } from '../../internal/state'
import { useId } from '../../internal/ids'
import { Primitive } from '../core/primitive'
import { Portal } from '../core/portal'
import { PopperAnchor, PopperContent, PopperRoot, type PopperContentProps } from '../interaction/popper'

export interface TooltipProviderProps {
  delayDuration?: number
  children?: FictNode
}

export interface TooltipRootProps {
  id?: string
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
  children?: FictNode
}

export interface TooltipTriggerProps {
  as?: string
  asChild?: boolean
  children?: FictNode
  onPointerEnter?: (event: PointerEvent) => void
  onPointerLeave?: (event: PointerEvent) => void
  onMouseEnter?: (event: MouseEvent) => void
  onMouseLeave?: (event: MouseEvent) => void
  onMouseOver?: (event: MouseEvent) => void
  onMouseOut?: (event: MouseEvent) => void
  onFocus?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void
  [key: string]: unknown
}

export interface TooltipContentProps extends PopperContentProps {
  forceMount?: boolean
  portal?: boolean
  children?: FictNode
  onPointerEnter?: (event: PointerEvent) => void
  onPointerLeave?: (event: PointerEvent) => void
  onMouseEnter?: (event: MouseEvent) => void
  onMouseLeave?: (event: MouseEvent) => void
  onMouseOver?: (event: MouseEvent) => void
  onMouseOut?: (event: MouseEvent) => void
  [key: string]: unknown
}

interface TooltipProviderContextValue {
  delayDuration: number
}

interface TooltipRootContextValue {
  open: () => boolean
  setOpen: (value: boolean) => void
  delayDuration: () => number
  contentId: string
  scheduleOpen: () => void
  clearSchedule: () => void
}

type TriggerElementRef = ((node: HTMLElement | null) => void) | { current: HTMLElement | null } | undefined

const TooltipProviderContext = createContext<TooltipProviderContextValue>({
  delayDuration: 700,
})

const TooltipRootContext = createContext<TooltipRootContextValue | null>(null)

function useTooltipRootContext(component: string): TooltipRootContextValue {
  const context = useContext(TooltipRootContext)
  if (!context) {
    throw new Error(`${component} must be used inside TooltipRoot`)
  }
  return context
}

export function TooltipProvider(props: TooltipProviderProps): FictNode {
  return {
    type: TooltipProviderContext.Provider,
    props: {
      value: {
        delayDuration: props.delayDuration ?? 700,
      },
      children: props.children,
    },
  } as unknown as FictNode
}

export function TooltipRoot(props: TooltipRootProps): FictNode {
  const provider = useContext(TooltipProviderContext)
  const openState = createControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  })
  const baseId = useId(props.id, 'tooltip')
  const openDebounced = useDebounceFn(
    () => {
      openState.set(true)
    },
    props.delayDuration ?? provider.delayDuration,
  )

  const clearSchedule = () => openDebounced.cancel()
  const scheduleOpen = () => openDebounced.run()

  const context: TooltipRootContextValue = {
    open: () => openState.get(),
    setOpen: value => openState.set(value),
    delayDuration: () => props.delayDuration ?? provider.delayDuration,
    contentId: `${baseId}-content`,
    scheduleOpen,
    clearSchedule,
  }

  return {
    type: TooltipRootContext.Provider,
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

export function TooltipTrigger(props: TooltipTriggerProps): FictNode {
  const context = useTooltipRootContext('TooltipTrigger')
  const tag = props.as ?? 'button'
  const refProp = props.ref as TriggerElementRef
  let cleanupListeners: (() => void) | null = null

  const open = (event: Event) => {
    context.scheduleOpen()
    if (event instanceof PointerEvent) props.onPointerEnter?.(event)
    if (event instanceof MouseEvent) {
      props.onMouseEnter?.(event)
      props.onMouseOver?.(event)
    }
  }

  const close = (event: Event) => {
    context.clearSchedule()
    context.setOpen(false)
    if (event instanceof PointerEvent) props.onPointerLeave?.(event)
    if (event instanceof MouseEvent) {
      props.onMouseLeave?.(event)
      props.onMouseOut?.(event)
    }
  }

  const onFocus = (event: FocusEvent) => {
    props.onFocus?.(event)
    context.scheduleOpen()
  }

  const onBlur = (event: FocusEvent) => {
    props.onBlur?.(event)
    context.clearSchedule()
    context.setOpen(false)
  }

  const registerRef = (node: HTMLElement | null) => {
    cleanupListeners?.()
    cleanupListeners = null

    if (typeof refProp === 'function') {
      refProp(node)
    } else if (refProp) {
      refProp.current = node
    }

    if (!node) return

    node.addEventListener('pointerenter', open)
    node.addEventListener('pointerleave', close)
    node.addEventListener('mouseover', open)
    node.addEventListener('mouseout', close)
    node.addEventListener('focus', onFocus)
    node.addEventListener('blur', onBlur)

    cleanupListeners = () => {
      node.removeEventListener('pointerenter', open)
      node.removeEventListener('pointerleave', close)
      node.removeEventListener('mouseover', open)
      node.removeEventListener('mouseout', close)
      node.removeEventListener('focus', onFocus)
      node.removeEventListener('blur', onBlur)
    }
  }

  return {
    type: PopperAnchor,
    props: {
      children: Primitive({
        ...props,
        as: tag,
        type: !props.asChild && tag === 'button' ? (props.type ?? 'button') : props.type,
        ref: registerRef,
        'aria-describedby': () => (context.open() ? context.contentId : undefined),
        'data-state': () => (context.open() ? 'open' : 'closed'),
        children: props.children,
      }),
    },
  }
}

export function TooltipContent(props: TooltipContentProps): FictNode {
  const context = useTooltipRootContext('TooltipContent')

  const contentNode = {
    type: PopperContent,
    props: {
      ...props,
      forceMount: undefined,
      portal: undefined,
      id: props.id ?? context.contentId,
      role: props.role ?? 'tooltip',
      'data-tooltip-content': '',
      'data-state': () => (context.open() ? 'open' : 'closed'),
      onPointerEnter: (event: PointerEvent) => {
        props.onPointerEnter?.(event)
        context.clearSchedule()
      },
      onPointerLeave: (event: PointerEvent) => {
        props.onPointerLeave?.(event)
        context.setOpen(false)
      },
      onMouseEnter: (event: MouseEvent) => {
        props.onMouseEnter?.(event)
        context.clearSchedule()
      },
      onMouseLeave: (event: MouseEvent) => {
        props.onMouseLeave?.(event)
        context.setOpen(false)
      },
      onMouseOver: (event: MouseEvent) => {
        props.onMouseOver?.(event)
        context.clearSchedule()
      },
      onMouseOut: (event: MouseEvent) => {
        props.onMouseOut?.(event)
        context.setOpen(false)
      },
      children: props.children,
    },
  }

  const child = () => ((context.open() || props.forceMount) ? contentNode : null)

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
      'data-tooltip-inline-container': '',
      children: child,
    },
  }
}
