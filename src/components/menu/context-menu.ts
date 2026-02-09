import { createContext, useContext, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'
import { useEventListener } from '@fictjs/hooks'

import { createControllableState } from '../../internal/state'
import { Primitive } from '../core/primitive'
import { Portal } from '../core/portal'
import { DismissableLayer } from '../interaction/dismissable-layer'
import { RovingFocusGroup } from '../interaction/roving-focus'
import { PopoverContent, PopoverRoot, PopoverTrigger, type PopoverContentPropsExt } from '../overlay/popover'

export interface ContextMenuRootProps {
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: FictNode
}

export interface ContextMenuTriggerProps {
  as?: string
  asChild?: boolean
  children?: FictNode
  [key: string]: unknown
}

type TriggerRefProp = ((node: HTMLElement | null) => void) | { current: HTMLElement | null } | undefined

export interface ContextMenuContentProps {
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

export interface ContextMenuItemProps {
  as?: string
  asChild?: boolean
  keepOpen?: boolean
  onSelect?: (event: MouseEvent) => void
  children?: FictNode
  [key: string]: unknown
}

export interface ContextMenuSubProps {
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: FictNode
}

export type ContextMenuSubTriggerProps = Omit<ContextMenuItemProps, 'keepOpen'>

export interface ContextMenuSubContentProps extends Omit<PopoverContentPropsExt, 'role'> {
  children?: FictNode
}

interface ContextMenuContextValue {
  open: () => boolean
  setOpen: (open: boolean) => void
  x: () => number
  y: () => number
  setPosition: (x: number, y: number) => void
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null)

function useContextMenuContext(component: string): ContextMenuContextValue {
  const context = useContext(ContextMenuContext)
  if (!context) {
    throw new Error(`${component} must be used inside ContextMenuRoot`)
  }
  return context
}

export function ContextMenuRoot(props: ContextMenuRootProps): FictNode {
  const state = createControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  })

  const position = createSignal({ x: 0, y: 0 })

  const context: ContextMenuContextValue = {
    open: () => state.get(),
    setOpen: open => state.set(open),
    x: () => position().x,
    y: () => position().y,
    setPosition: (x, y) => position({ x, y }),
  }

  return {
    type: ContextMenuContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}

export function ContextMenuTrigger(props: ContextMenuTriggerProps): FictNode {
  const context = useContextMenuContext('ContextMenuTrigger')
  const tag = props.as ?? 'div'
  const refProp = props.ref as TriggerRefProp
  const triggerNode = createSignal<HTMLElement | null>(null)

  const handleContextMenu = (event: MouseEvent) => {
    ;(props.onContextMenu as ((event: MouseEvent) => void) | undefined)?.(event)
    if (event.defaultPrevented) return
    event.preventDefault()
    context.setPosition(event.clientX, event.clientY)
    context.setOpen(true)
  }

  const contextMenuListener = useEventListener<MouseEvent>(
    () => triggerNode(),
    'contextmenu',
    handleContextMenu,
    { immediate: false },
  )

  const registerRef = (node: HTMLElement | null) => {
    contextMenuListener.stop()

    if (typeof refProp === 'function') {
      refProp(node)
    } else if (refProp) {
      refProp.current = node
    }
    triggerNode(node)
    if (node) {
      contextMenuListener.start()
    }
  }

  return Primitive({
    ...props,
    as: tag,
    ref: registerRef,
    onContextMenu: handleContextMenu,
    children: props.children,
  })
}

export function ContextMenuContent(props: ContextMenuContentProps): FictNode {
  const context = useContextMenuContext('ContextMenuContent')

  const content = {
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
        type: 'div',
        props: {
          ...props,
          forceMount: undefined,
          portal: undefined,
          onDismiss: undefined,
          onEscapeKeyDown: undefined,
          onInteractOutside: undefined,
          onPointerDownOutside: undefined,
          onFocusOutside: undefined,
          role: 'menu',
          'data-context-menu-content': '',
          style: {
            position: 'fixed',
            left: `${context.x()}px`,
            top: `${context.y()}px`,
          },
          children: {
            type: RovingFocusGroup,
            props: {
              orientation: 'vertical',
              loop: true,
              children: props.children,
            },
          },
        },
      },
    },
  }

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
      'data-context-menu-inline-container': '',
      children: child,
    },
  }
}

export function ContextMenuItem(props: ContextMenuItemProps): FictNode {
  const context = useContextMenuContext('ContextMenuItem')
  const tag = props.as ?? 'button'

  return Primitive({
    ...props,
    as: tag,
    type: !props.asChild && tag === 'button' ? (props.type ?? 'button') : props.type,
    role: props.role ?? 'menuitem',
    'data-context-menu-item': '',
    onClick: (event: MouseEvent) => {
      ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
      props.onSelect?.(event)
      if (event.defaultPrevented) return
      if (!props.keepOpen) {
        context.setOpen(false)
      }
    },
    children: props.children,
  })
}

export function ContextMenuSub(props: ContextMenuSubProps): FictNode {
  const state = createControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  })

  return {
    type: PopoverRoot,
    props: {
      open: () => state.get(),
      onOpenChange: (open: boolean) => state.set(open),
      children: props.children,
    },
  }
}

export function ContextMenuSubTrigger(props: ContextMenuSubTriggerProps): FictNode {
  return {
    type: PopoverTrigger,
    props: {
      asChild: true,
      'aria-haspopup': 'menu',
      children: {
        type: ContextMenuItem,
        props: {
          ...props,
          keepOpen: true,
          'aria-haspopup': props['aria-haspopup'] ?? 'menu',
          'aria-expanded': props['aria-expanded'],
          'data-context-menu-sub-trigger': '',
          children: props.children,
        },
      },
    },
  }
}

export function ContextMenuSubContent(props: ContextMenuSubContentProps): FictNode {
  return {
    type: PopoverContent,
    props: {
      ...props,
      role: 'menu',
      side: props.side ?? 'right',
      align: props.align ?? 'start',
      'aria-orientation': 'vertical',
      'data-context-menu-sub-content': '',
      children: {
        type: RovingFocusGroup,
        props: {
          orientation: 'vertical',
          loop: true,
          children: props.children,
        },
      },
    },
  }
}
