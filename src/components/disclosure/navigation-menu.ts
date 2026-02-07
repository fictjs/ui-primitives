import { createContext, useContext, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

export interface NavigationMenuRootProps {
  children?: FictNode
  [key: string]: unknown
}

export interface NavigationMenuListProps {
  children?: FictNode
  [key: string]: unknown
}

export interface NavigationMenuItemProps {
  value?: string
  children?: FictNode
}

export interface NavigationMenuTriggerProps {
  as?: string
  children?: FictNode
  [key: string]: unknown
}

export interface NavigationMenuContentProps {
  forceMount?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface NavigationMenuLinkProps {
  as?: string
  children?: FictNode
  [key: string]: unknown
}

interface NavigationMenuRootContextValue {
  activeItem: () => string | null
  setActiveItem: (value: string | null) => void
}

interface NavigationMenuItemContextValue {
  value: string
}

const NavigationMenuRootContext = createContext<NavigationMenuRootContextValue | null>(null)
const NavigationMenuItemContext = createContext<NavigationMenuItemContextValue | null>(null)

let nextItemId = 0
function createItemId(): string {
  nextItemId += 1
  return `nav-item-${nextItemId}`
}

function useNavigationRootContext(component: string): NavigationMenuRootContextValue {
  const context = useContext(NavigationMenuRootContext)
  if (!context) {
    throw new Error(`${component} must be used inside NavigationMenuRoot`)
  }
  return context
}

function useNavigationItemContext(component: string): NavigationMenuItemContextValue {
  const context = useContext(NavigationMenuItemContext)
  if (!context) {
    throw new Error(`${component} must be used inside NavigationMenuItem`)
  }
  return context
}

export function NavigationMenuRoot(props: NavigationMenuRootProps): FictNode {
  const activeItemSignal = createSignal<string | null>(null)

  const context: NavigationMenuRootContextValue = {
    activeItem: () => activeItemSignal(),
    setActiveItem: value => activeItemSignal(value),
  }

  return {
    type: NavigationMenuRootContext.Provider,
    props: {
      value: context,
      children: {
        type: 'nav',
        props: {
          ...props,
          'data-navigation-menu-root': '',
          children: props.children,
        },
      },
    },
  } as unknown as FictNode
}

export function NavigationMenuList(props: NavigationMenuListProps): FictNode {
  return {
    type: 'ul',
    props: {
      ...props,
      'data-navigation-menu-list': '',
      children: props.children,
    },
  }
}

export function NavigationMenuItem(props: NavigationMenuItemProps): FictNode {
  const value = props.value ?? createItemId()

  return {
    type: NavigationMenuItemContext.Provider,
    props: {
      value: { value },
      children: {
        type: 'li',
        props: {
          'data-navigation-menu-item': value,
          children: props.children,
        },
      },
    },
  } as unknown as FictNode
}

export function NavigationMenuTrigger(props: NavigationMenuTriggerProps): FictNode {
  const root = useNavigationRootContext('NavigationMenuTrigger')
  const item = useNavigationItemContext('NavigationMenuTrigger')
  const tag = props.as ?? 'button'

  const open = () => root.activeItem() === item.value

  return {
    type: tag,
    props: {
      ...props,
      as: undefined,
      type: tag === 'button' ? (props.type ?? 'button') : props.type,
      'aria-expanded': open,
      'aria-haspopup': 'menu',
      'data-state': () => (open() ? 'open' : 'closed'),
      onClick: (event: MouseEvent) => {
        ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
        if (event.defaultPrevented) return
        root.setActiveItem(open() ? null : item.value)
      },
      children: props.children,
    },
  }
}

export function NavigationMenuContent(props: NavigationMenuContentProps): FictNode {
  const root = useNavigationRootContext('NavigationMenuContent')
  const item = useNavigationItemContext('NavigationMenuContent')

  const open = () => root.activeItem() === item.value

  return {
    type: 'div',
    props: {
      'data-navigation-menu-content-wrapper': item.value,
      children: () =>
        open() || props.forceMount
          ? {
              type: 'div',
              props: {
                ...props,
                forceMount: undefined,
                role: 'menu',
                'data-state': () => (open() ? 'open' : 'closed'),
                'data-navigation-menu-content': item.value,
                children: props.children,
              },
            }
          : null,
    },
  }
}

export function NavigationMenuLink(props: NavigationMenuLinkProps): FictNode {
  const tag = props.as ?? 'a'

  return {
    type: tag,
    props: {
      ...props,
      as: undefined,
      'data-navigation-menu-link': '',
      children: props.children,
    },
  }
}

export function NavigationMenuIndicator(props: Record<string, unknown> & { children?: FictNode }): FictNode {
  return {
    type: 'div',
    props: {
      ...props,
      'data-navigation-menu-indicator': '',
      children: props.children,
    },
  }
}

export function NavigationMenuViewport(props: Record<string, unknown> & { children?: FictNode }): FictNode {
  return {
    type: 'div',
    props: {
      ...props,
      'data-navigation-menu-viewport': '',
      children: props.children,
    },
  }
}
