import { createContext, useContext, type FictNode } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'
import { useId } from '../../internal/ids'
import { Primitive } from '../core/primitive'
import { Portal } from '../core/portal'
import { PopperAnchor, PopperContent, PopperRoot, type PopperContentProps } from '../interaction/popper'

export interface HoverCardRootProps {
  id?: string
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  openDelay?: number
  closeDelay?: number
  children?: FictNode
}

export interface HoverCardTriggerProps {
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

export interface HoverCardContentProps extends PopperContentProps {
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

interface HoverCardContextValue {
  open: () => boolean
  setOpen: (value: boolean) => void
  contentId: string
  scheduleOpen: () => void
  scheduleClose: () => void
  clearTimers: () => void
}

type TriggerElementRef = ((node: HTMLElement | null) => void) | { current: HTMLElement | null } | undefined

const HoverCardContext = createContext<HoverCardContextValue | null>(null)

function useHoverCardContext(component: string): HoverCardContextValue {
  const context = useContext(HoverCardContext)
  if (!context) {
    throw new Error(`${component} must be used inside HoverCardRoot`)
  }
  return context
}

export function HoverCardRoot(props: HoverCardRootProps): FictNode {
  const openState = createControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  })
  const baseId = useId(props.id, 'hover-card')

  let openTimer: ReturnType<typeof setTimeout> | null = null
  let closeTimer: ReturnType<typeof setTimeout> | null = null

  const clearTimers = () => {
    if (openTimer) {
      clearTimeout(openTimer)
      openTimer = null
    }
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
  }

  const scheduleOpen = () => {
    clearTimers()
    openTimer = setTimeout(() => {
      openState.set(true)
      openTimer = null
    }, props.openDelay ?? 200)
  }

  const scheduleClose = () => {
    clearTimers()
    closeTimer = setTimeout(() => {
      openState.set(false)
      closeTimer = null
    }, props.closeDelay ?? 200)
  }

  const context: HoverCardContextValue = {
    open: () => openState.get(),
    setOpen: value => openState.set(value),
    contentId: `${baseId}-content`,
    scheduleOpen,
    scheduleClose,
    clearTimers,
  }

  return {
    type: HoverCardContext.Provider,
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

export function HoverCardTrigger(props: HoverCardTriggerProps): FictNode {
  const context = useHoverCardContext('HoverCardTrigger')
  const tag = props.as ?? 'button'
  const refProp = props.ref as TriggerElementRef
  let cleanupListeners: (() => void) | null = null

  const registerRef = (node: HTMLElement | null) => {
    cleanupListeners?.()
    cleanupListeners = null

    if (typeof refProp === 'function') {
      refProp(node)
    } else if (refProp) {
      refProp.current = node
    }

    if (!node) return

    const open = (event: Event) => {
      context.scheduleOpen()
      if (event instanceof PointerEvent) props.onPointerEnter?.(event)
      if (event instanceof MouseEvent) {
        props.onMouseEnter?.(event)
        props.onMouseOver?.(event)
      }
    }

    const close = (event: Event) => {
      context.scheduleClose()
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
      context.scheduleClose()
    }

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

export function HoverCardContent(props: HoverCardContentProps): FictNode {
  const context = useHoverCardContext('HoverCardContent')

  const contentNode = {
    type: PopperContent,
    props: {
      ...props,
      forceMount: undefined,
      portal: undefined,
      id: props.id ?? context.contentId,
      role: props.role ?? 'dialog',
      'data-hover-card-content': '',
      'data-state': () => (context.open() ? 'open' : 'closed'),
      onPointerEnter: (event: PointerEvent) => {
        props.onPointerEnter?.(event)
        context.clearTimers()
      },
      onPointerLeave: (event: PointerEvent) => {
        props.onPointerLeave?.(event)
        context.scheduleClose()
      },
      onMouseEnter: (event: MouseEvent) => {
        props.onMouseEnter?.(event)
        context.clearTimers()
      },
      onMouseLeave: (event: MouseEvent) => {
        props.onMouseLeave?.(event)
        context.scheduleClose()
      },
      onMouseOver: (event: MouseEvent) => {
        props.onMouseOver?.(event)
        context.clearTimers()
      },
      onMouseOut: (event: MouseEvent) => {
        props.onMouseOut?.(event)
        context.scheduleClose()
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
      'data-hover-card-inline-container': '',
      children: child,
    },
  }
}
