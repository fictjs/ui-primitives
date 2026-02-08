import { createContext, useContext, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useId } from '../../internal/ids'
import { Primitive } from '../core/primitive'
import { RovingFocusGroup } from '../interaction/roving-focus'

export interface MenubarRootProps {
  children?: FictNode
  [key: string]: unknown
}

export interface MenubarMenuProps {
  value?: string
  children?: FictNode
}

export interface MenubarTriggerProps {
  as?: string
  asChild?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface MenubarContentProps {
  forceMount?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface MenubarItemProps {
  as?: string
  asChild?: boolean
  children?: FictNode
  onSelect?: (event: MouseEvent) => void
  [key: string]: unknown
}

interface MenubarRootContextValue {
  activeMenu: () => string | null
  setActiveMenu: (id: string | null) => void
}

interface MenubarMenuContextValue {
  id: string
}

const MenubarRootContext = createContext<MenubarRootContextValue | null>(null)
const MenubarMenuContext = createContext<MenubarMenuContextValue | null>(null)

function useMenubarRootContext(component: string): MenubarRootContextValue {
  const context = useContext(MenubarRootContext)
  if (!context) {
    throw new Error(`${component} must be used inside MenubarRoot`)
  }
  return context
}

function useMenubarMenuContext(component: string): MenubarMenuContextValue {
  const context = useContext(MenubarMenuContext)
  if (!context) {
    throw new Error(`${component} must be used inside MenubarMenu`)
  }
  return context
}

export function MenubarRoot(props: MenubarRootProps): FictNode {
  const activeMenuSignal = createSignal<string | null>(null)

  const context: MenubarRootContextValue = {
    activeMenu: () => activeMenuSignal(),
    setActiveMenu: id => activeMenuSignal(id),
  }

  return {
    type: MenubarRootContext.Provider,
    props: {
      value: context,
      children: {
        type: 'div',
        props: {
          ...props,
          role: 'menubar',
          'data-menubar-root': '',
          children: {
            type: RovingFocusGroup,
            props: {
              orientation: 'horizontal',
              loop: true,
              children: props.children,
            },
          },
        },
      },
    },
  } as unknown as FictNode
}

export function MenubarMenu(props: MenubarMenuProps): FictNode {
  const id = useId(props.value, 'menubar-menu')

  return {
    type: MenubarMenuContext.Provider,
    props: {
      value: { id },
      children: {
        type: 'div',
        props: {
          'data-menubar-menu': id,
          children: props.children,
        },
      },
    },
  } as unknown as FictNode
}

export function MenubarTrigger(props: MenubarTriggerProps): FictNode {
  const root = useMenubarRootContext('MenubarTrigger')
  const menu = useMenubarMenuContext('MenubarTrigger')
  const tag = props.as ?? 'button'

  const open = () => root.activeMenu() === menu.id

  return Primitive({
    ...props,
    as: tag,
    type: !props.asChild && tag === 'button' ? (props.type ?? 'button') : props.type,
    role: 'menuitem',
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'data-state': () => (open() ? 'open' : 'closed'),
    'data-menubar-trigger': menu.id,
    onClick: (event: MouseEvent) => {
      ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
      if (event.defaultPrevented) return
      root.setActiveMenu(open() ? null : menu.id)
    },
    onMouseOver: (event: MouseEvent) => {
      ;(props.onMouseOver as ((event: MouseEvent) => void) | undefined)?.(event)
      if (event.defaultPrevented) return
      root.setActiveMenu(menu.id)
    },
    children: props.children,
  })
}

export function MenubarContent(props: MenubarContentProps): FictNode {
  const root = useMenubarRootContext('MenubarContent')
  const menu = useMenubarMenuContext('MenubarContent')

  const open = () => root.activeMenu() === menu.id

  return {
    type: 'div',
    props: {
      'data-menubar-content-wrapper': menu.id,
      children: () =>
        open() || props.forceMount
          ? {
              type: 'div',
              props: {
                ...props,
                forceMount: undefined,
                role: 'menu',
                'data-menubar-content': menu.id,
                children: props.children,
              },
            }
          : null,
    },
  }
}

export function MenubarItem(props: MenubarItemProps): FictNode {
  const root = useMenubarRootContext('MenubarItem')
  const tag = props.as ?? 'button'

  return Primitive({
    ...props,
    as: tag,
    type: !props.asChild && tag === 'button' ? (props.type ?? 'button') : props.type,
    role: props.role ?? 'menuitem',
    'data-menubar-item': '',
    onClick: (event: MouseEvent) => {
      ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
      props.onSelect?.(event)
      if (!event.defaultPrevented) {
        root.setActiveMenu(null)
      }
    },
    children: props.children,
  })
}
