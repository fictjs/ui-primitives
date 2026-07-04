import {
  createElement,
  createPortal as createFictPortal,
  mergeProps,
  prop,
  type FictNode,
  type JSX,
} from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { createContextScope, type Scope } from '@fictjs/context'
import { useId } from '@fictjs/id'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeNavigationMenu?: Scope }
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type PrimitiveListProps = JSX.IntrinsicElements['ul'] & {
  asChild?: boolean
}
type PrimitiveItemProps = JSX.IntrinsicElements['li'] & {
  asChild?: boolean
}
type PrimitiveButtonProps = JSX.IntrinsicElements['button'] & {
  asChild?: boolean
}
type PrimitiveAnchorProps = JSX.IntrinsicElements['a'] & {
  asChild?: boolean
}
type NavigationMenuContextValue = {
  value: () => string
  onValueChange(value: string): void
  viewport: () => HTMLDivElement | null
  setViewport(node: HTMLDivElement | null): void
}
type NavigationMenuItemContextValue = {
  value: () => string
}

const ROOT_NAME = 'NavigationMenu'
const SUB_NAME = 'NavigationMenuSub'
const LIST_NAME = 'NavigationMenuList'
const ITEM_NAME = 'NavigationMenuItem'
const TRIGGER_NAME = 'NavigationMenuTrigger'
const LINK_NAME = 'NavigationMenuLink'
const INDICATOR_NAME = 'NavigationMenuIndicator'
const CONTENT_NAME = 'NavigationMenuContent'
const VIEWPORT_NAME = 'NavigationMenuViewport'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createNavigationMenuContext, createNavigationMenuScope] = createContextScope(ROOT_NAME)
const [NavigationMenuProvider, useNavigationMenuContext] =
  createNavigationMenuContext<NavigationMenuContextValue>(ROOT_NAME)
const [NavigationMenuItemProvider, useNavigationMenuItemContext] =
  createNavigationMenuContext<NavigationMenuItemContextValue>(ITEM_NAME)

type NavigationMenuProps = PrimitiveDivProps & {
  value?: MaybeAccessor<string | undefined>
  defaultValue?: MaybeAccessor<string | undefined>
  onValueChange?: (value: string) => void
}
type NavigationMenuSubProps = NavigationMenuProps
type NavigationMenuListProps = PrimitiveListProps
type NavigationMenuItemProps = Omit<PrimitiveItemProps, 'value'> & {
  value?: MaybeAccessor<string | undefined>
}
type NavigationMenuTriggerProps = PrimitiveButtonProps
type NavigationMenuLinkProps = PrimitiveAnchorProps & {
  active?: MaybeAccessor<boolean | undefined>
}
type NavigationMenuIndicatorProps = PrimitiveDivProps
type NavigationMenuContentProps = PrimitiveDivProps
type NavigationMenuViewportProps = PrimitiveDivProps

function readValue<T>(value: MaybeAccessor<T>): T {
  if (
    typeof value === 'function' &&
    (value.length === 0 ||
      (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  ) {
    return (value as () => T)()
  }

  return value as T
}

function NavigationMenuImpl(props: ScopedProps<NavigationMenuProps>, name: string): FictNode {
  const valueProp = () =>
    props.value === undefined
      ? undefined
      : readValue(props.value as MaybeAccessor<string | undefined>)
  const defaultValue = () =>
    props.defaultValue === undefined
      ? ''
      : (readValue(props.defaultValue as MaybeAccessor<string | undefined>) ?? '')
  const [value, setValue] = useControllableState<string>({
    prop: valueProp,
    defaultProp: defaultValue,
    caller: name,
    ...(props.onValueChange ? { onChange: props.onValueChange } : {}),
  })
  const viewport = createSignal<HTMLDivElement | null>(null)
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeNavigationMenu: undefined,
      defaultValue: undefined,
      onValueChange: undefined,
      value: undefined,
    },
  )

  return (
    <NavigationMenuProvider
      scope={props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>}
      value={value}
      onValueChange={setValue}
      viewport={viewport}
      setViewport={viewport}
    >
      <Primitive.div {...primitiveProps} />
    </NavigationMenuProvider>
  )
}

function NavigationMenu(props: ScopedProps<NavigationMenuProps>): FictNode {
  return NavigationMenuImpl(props, ROOT_NAME)
}

NavigationMenu.displayName = ROOT_NAME

function NavigationMenuSub(props: ScopedProps<NavigationMenuSubProps>): FictNode {
  return NavigationMenuImpl(props, SUB_NAME)
}

NavigationMenuSub.displayName = SUB_NAME

function NavigationMenuList(props: ScopedProps<NavigationMenuListProps>): FictNode {
  return <Primitive.ul {...(props as Record<string, unknown>)} />
}

NavigationMenuList.displayName = LIST_NAME

function NavigationMenuItem(props: ScopedProps<NavigationMenuItemProps>): FictNode {
  const generatedValue = useId()
  const value = () =>
    props.value === undefined
      ? generatedValue()
      : (readValue(props.value as MaybeAccessor<string | undefined>) ?? generatedValue())

  return (
    <NavigationMenuItemProvider
      scope={props.__scopeNavigationMenu as Scope<NavigationMenuItemContextValue | undefined>}
      value={value}
    >
      <Primitive.li {...(props as Record<string, unknown>)} />
    </NavigationMenuItemProvider>
  )
}

NavigationMenuItem.displayName = ITEM_NAME

function NavigationMenuTrigger(props: ScopedProps<NavigationMenuTriggerProps>): FictNode {
  const rootContext = useNavigationMenuContext(
    TRIGGER_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>,
  )
  const itemContext = useNavigationMenuItemContext(
    TRIGGER_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuItemContextValue | undefined>,
  )
  const open = () => rootContext.value() === itemContext.value()
  const primitiveProps = mergeProps(
    {
      type: 'button',
      'aria-expanded': prop(() => String(open())),
      'data-state': prop(() => (open() ? 'open' : 'closed')),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeNavigationMenu: undefined,
      onClick: (event: MouseEvent) => {
        props.onClick?.(event)
        rootContext.onValueChange(open() ? '' : itemContext.value())
      },
    },
  )

  return <Primitive.button {...primitiveProps} />
}

NavigationMenuTrigger.displayName = TRIGGER_NAME

function NavigationMenuLink(props: ScopedProps<NavigationMenuLinkProps>): FictNode {
  const active = () =>
    props.active === undefined
      ? false
      : Boolean(readValue(props.active as MaybeAccessor<boolean | undefined>) ?? false)

  return (
    <Primitive.a {...(props as Record<string, unknown>)} data-active={active() ? '' : undefined} />
  )
}

NavigationMenuLink.displayName = LINK_NAME

function NavigationMenuIndicator(props: ScopedProps<NavigationMenuIndicatorProps>): FictNode {
  const context = useNavigationMenuContext(
    INDICATOR_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>,
  )

  return (
    <Presence present={() => Boolean(context.value())}>
      <Primitive.div {...(props as Record<string, unknown>)} />
    </Presence>
  )
}

NavigationMenuIndicator.displayName = INDICATOR_NAME

function NavigationMenuContent(props: ScopedProps<NavigationMenuContentProps>): FictNode {
  const rootContext = useNavigationMenuContext(
    CONTENT_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>,
  )
  const itemContext = useNavigationMenuItemContext(
    CONTENT_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuItemContextValue | undefined>,
  )
  const present = () => rootContext.value() === itemContext.value()
  const node = <Primitive.div {...(props as Record<string, unknown>)} />

  return (
    <Presence present={present}>
      {() => {
        if (!present()) return null
        if (!rootContext.viewport()) return node

        return createFictPortal(
          rootContext.viewport() as HTMLDivElement,
          () => node,
          createElement,
        ) as unknown as FictNode
      }}
    </Presence>
  )
}

NavigationMenuContent.displayName = CONTENT_NAME

function NavigationMenuViewport(props: ScopedProps<NavigationMenuViewportProps>): FictNode {
  const context = useNavigationMenuContext(
    VIEWPORT_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>,
  )

  return (
    <Primitive.div
      {...(props as Record<string, unknown>)}
      ref={(node: HTMLDivElement | null) => {
        context.setViewport(node)
        if (!props.ref) return
        if (typeof props.ref === 'function') {
          props.ref(node)
          return
        }
        props.ref.current = node
      }}
    />
  )
}

NavigationMenuViewport.displayName = VIEWPORT_NAME

const Root = NavigationMenu
const Sub = NavigationMenuSub
const List = NavigationMenuList
const Item = NavigationMenuItem
const Trigger = NavigationMenuTrigger
const Link = NavigationMenuLink
const Indicator = NavigationMenuIndicator
const Content = NavigationMenuContent
const Viewport = NavigationMenuViewport

export {
  createNavigationMenuScope,
  NavigationMenu,
  NavigationMenuSub,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuContent,
  NavigationMenuViewport,
  Root,
  Sub,
  List,
  Item,
  Trigger,
  Link,
  Indicator,
  Content,
  Viewport,
}

export type {
  NavigationMenuProps,
  NavigationMenuSubProps,
  NavigationMenuListProps,
  NavigationMenuItemProps,
  NavigationMenuTriggerProps,
  NavigationMenuLinkProps,
  NavigationMenuIndicatorProps,
  NavigationMenuContentProps,
  NavigationMenuViewportProps,
}
