import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'

import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useDirection, type Direction } from '@fictjs/direction'
import { useId } from '@fictjs/id'
import {
  createMenuScope,
  Menu as MenuRoot,
  MenuPortal,
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuItemIndicator,
  MenuSeparator,
  MenuArrow,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  type MenuPortalProps,
  type MenuContentProps,
  type MenuGroupProps,
  type MenuLabelProps,
  type MenuItemProps,
  type MenuCheckboxItemProps,
  type MenuRadioGroupProps,
  type MenuRadioItemProps,
  type MenuItemIndicatorProps,
  type MenuSeparatorProps,
  type MenuArrowProps,
  type MenuSubProps,
  type MenuSubTriggerProps,
  type MenuSubContentProps,
} from '@fictjs/menu'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeMenubar?: Scope }
type PrimitiveButtonProps = JSX.IntrinsicElements['button'] & {
  asChild?: boolean
}
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type FocusIntent = 'first' | 'last' | 'next' | 'prev'
type MenubarContextValue = {
  value: () => string | null
  onValueChange(value: string | null): void
  dir: () => Direction
  loop: () => boolean
  rootRef: { current: HTMLDivElement | null }
}
type MenubarMenuContextValue = {
  value: () => string
  triggerId: () => string
  contentId: () => string
  triggerRef: { current: HTMLButtonElement | null }
}

const MENUBAR_NAME = 'Menubar'
const MENU_NAME = 'MenubarMenu'
const TRIGGER_NAME = 'MenubarTrigger'
const PORTAL_NAME = 'MenubarPortal'
const CONTENT_NAME = 'MenubarContent'
const GROUP_NAME = 'MenubarGroup'
const LABEL_NAME = 'MenubarLabel'
const ITEM_NAME = 'MenubarItem'
const CHECKBOX_ITEM_NAME = 'MenubarCheckboxItem'
const RADIO_GROUP_NAME = 'MenubarRadioGroup'
const RADIO_ITEM_NAME = 'MenubarRadioItem'
const ITEM_INDICATOR_NAME = 'MenubarItemIndicator'
const SEPARATOR_NAME = 'MenubarSeparator'
const ARROW_NAME = 'MenubarArrow'
const SUB_NAME = 'MenubarSub'
const SUB_TRIGGER_NAME = 'MenubarSubTrigger'
const SUB_CONTENT_NAME = 'MenubarSubContent'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createMenubarContext, createMenubarScope] = createContextScope(MENUBAR_NAME, [
  createMenuScope,
])
const [MenubarProvider, useMenubarContext] =
  createMenubarContext<MenubarContextValue>(MENUBAR_NAME)
const [MenubarMenuProvider, useMenubarMenuContext] =
  createMenubarContext<MenubarMenuContextValue>(MENU_NAME)
const useMenuScope = createMenuScope()

type MenubarProps = PrimitiveDivProps & {
  value?: MaybeAccessor<string | null | undefined>
  defaultValue?: MaybeAccessor<string | undefined>
  onValueChange?: (value: string | null) => void
  dir?: MaybeAccessor<Direction | undefined>
  loop?: MaybeAccessor<boolean | undefined>
}

type MenubarMenuProps = {
  children?: FictNode | FictNode[]
  value?: MaybeAccessor<string | undefined>
}
type MenubarTriggerProps = PrimitiveButtonProps & {
  disabled?: MaybeAccessor<boolean | undefined>
}
type MenubarPortalProps = MenuPortalProps
type MenubarContentProps = MenuContentProps
type MenubarGroupProps = MenuGroupProps
type MenubarLabelProps = MenuLabelProps
type MenubarItemProps = MenuItemProps
type MenubarCheckboxItemProps = MenuCheckboxItemProps
type MenubarRadioGroupProps = MenuRadioGroupProps
type MenubarRadioItemProps = MenuRadioItemProps
type MenubarItemIndicatorProps = MenuItemIndicatorProps
type MenubarSeparatorProps = MenuSeparatorProps
type MenubarArrowProps = MenuArrowProps
type MenubarSubProps = MenuSubProps
type MenubarSubTriggerProps = MenuSubTriggerProps
type MenubarSubContentProps = MenuSubContentProps

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

function getDirectionAwareKey(key: string, dir: Direction) {
  if (dir !== 'rtl') return key
  return key === 'ArrowLeft' ? 'ArrowRight' : key === 'ArrowRight' ? 'ArrowLeft' : key
}

function Menubar(props: ScopedProps<MenubarProps>): FictNode {
  const inheritedDirection = useDirection()
  const rootRef = { current: null as HTMLDivElement | null }
  const dir = () =>
    props.dir === undefined
      ? inheritedDirection()
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? inheritedDirection())
  const loop = () =>
    props.loop === undefined ? true : Boolean(readValue(props.loop as MaybeAccessor<boolean | undefined>) ?? true)
  const valueProp = () =>
    props.value === undefined
      ? undefined
      : (readValue(props.value as MaybeAccessor<string | null | undefined>) ?? null)
  const defaultValue = () =>
    props.defaultValue === undefined
      ? null
      : (readValue(props.defaultValue as MaybeAccessor<string | undefined>) ?? null)
  const [value, setValue] = useControllableState<string | null>({
    prop: valueProp,
    defaultProp: defaultValue,
    caller: MENUBAR_NAME,
    ...(props.onValueChange ? { onChange: props.onValueChange } : {}),
  })
  const primitiveProps = mergeProps(
    {
      role: 'menubar',
      'data-orientation': 'horizontal',
    },
    () => props as Record<string, unknown>,
    {
      __scopeMenubar: undefined,
      defaultValue: undefined,
      dir: undefined,
      loop: undefined,
      onValueChange: undefined,
      value: undefined,
      ref: undefined,
    },
  )

  return (
    <MenubarProvider
      scope={props.__scopeMenubar as Scope<MenubarContextValue | undefined>}
      value={value}
      onValueChange={setValue}
      dir={dir}
      loop={loop}
      rootRef={rootRef}
    >
      <Primitive.div
        {...primitiveProps}
        ref={(node: HTMLDivElement | null) => {
          rootRef.current = node
          if (!props.ref) return
          if (typeof props.ref === 'function') {
            props.ref(node)
            return
          }
          props.ref.current = node
        }}
      />
    </MenubarProvider>
  )
}

Menubar.displayName = MENUBAR_NAME

function MenubarMenu(props: ScopedProps<MenubarMenuProps>): FictNode {
  const context = useMenubarContext(MENU_NAME, props.__scopeMenubar as Scope<MenubarContextValue | undefined>)
  const menuScope = useMenuScope(props.__scopeMenubar)
  const generatedValue = useId()
  const value = () =>
    props.value === undefined ? generatedValue() : (readValue(props.value as MaybeAccessor<string | undefined>) ?? generatedValue())
  const triggerId = useId()
  const contentId = useId()
  const triggerRef = { current: null as HTMLButtonElement | null }
  const open = () => context.value() === value()

  return (
    <MenubarMenuProvider
      scope={props.__scopeMenubar as Scope<MenubarMenuContextValue | undefined>}
      value={value}
      triggerId={triggerId}
      contentId={contentId}
      triggerRef={triggerRef}
    >
      <MenuRoot
        {...menuScope}
        open={open}
        onOpenChange={(nextOpen) => {
          context.onValueChange(nextOpen ? value() : null)
        }}
        modal={false}
      >
        {props.children}
      </MenuRoot>
    </MenubarMenuProvider>
  )
}

MenubarMenu.displayName = MENU_NAME

function getTriggerElements(root: HTMLDivElement | null): HTMLButtonElement[] {
  return Array.from(root?.querySelectorAll<HTMLButtonElement>('[data-menubar-trigger]') ?? [])
}

function focusMenuTrigger(root: HTMLDivElement | null, current: HTMLButtonElement | null, intent: FocusIntent, loop: boolean): void {
  const items = getTriggerElements(root)
  if (items.length === 0) return

  if (intent === 'first') {
    items[0]?.focus()
    return
  }

  if (intent === 'last') {
    items[items.length - 1]?.focus()
    return
  }

  const currentIndex = items.indexOf(current as HTMLButtonElement)
  if (currentIndex === -1) {
    items[0]?.focus()
    return
  }

  const nextIndex = currentIndex + (intent === 'next' ? 1 : -1)
  if (loop) {
    items[(nextIndex + items.length) % items.length]?.focus()
    return
  }

  items[nextIndex]?.focus()
}

function MenubarTrigger(props: ScopedProps<MenubarTriggerProps>): FictNode {
  const rootContext = useMenubarContext(
    TRIGGER_NAME,
    props.__scopeMenubar as Scope<MenubarContextValue | undefined>,
  )
  const menuContext = useMenubarMenuContext(
    TRIGGER_NAME,
    props.__scopeMenubar as Scope<MenubarMenuContextValue | undefined>,
  )
  const disabled = () =>
    props.disabled === undefined
      ? false
      : Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const primitiveProps = mergeProps(
    {
      type: 'button',
      role: 'menuitem',
      'data-menubar-trigger': '',
      id: prop(menuContext.triggerId),
      'aria-haspopup': 'menu',
      'aria-expanded': prop(() => String(rootContext.value() === menuContext.value())),
      'aria-controls': prop(() =>
        rootContext.value() === menuContext.value() ? menuContext.contentId() : undefined,
      ),
      'data-state': prop(() => (rootContext.value() === menuContext.value() ? 'open' : 'closed')),
      'data-disabled': prop(() => (disabled() ? '' : undefined)),
      disabled: prop(() => (disabled() ? true : undefined)),
    },
    () => props as Record<string, unknown>,
    {
      __scopeMenubar: undefined,
      disabled: undefined,
      ref: undefined,
      onClick: composeEventHandlers<MouseEvent>(
        props.onClick as ((event: MouseEvent) => void) | undefined,
        (event) => {
          if (disabled()) {
            event.preventDefault()
            return
          }
          rootContext.onValueChange(rootContext.value() === menuContext.value() ? null : menuContext.value())
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event) => {
          if (disabled()) return

          const key = getDirectionAwareKey(event.key, rootContext.dir())
          if (key === 'ArrowDown' || key === 'Enter' || key === ' ') {
            event.preventDefault()
            rootContext.onValueChange(menuContext.value())
            return
          }

          if (key === 'ArrowRight') {
            event.preventDefault()
            focusMenuTrigger(rootContext.rootRef.current, menuContext.triggerRef.current, 'next', rootContext.loop())
            return
          }

          if (key === 'ArrowLeft') {
            event.preventDefault()
            focusMenuTrigger(rootContext.rootRef.current, menuContext.triggerRef.current, 'prev', rootContext.loop())
            return
          }

          if (key === 'Home') {
            event.preventDefault()
            focusMenuTrigger(rootContext.rootRef.current, menuContext.triggerRef.current, 'first', rootContext.loop())
            return
          }

          if (key === 'End') {
            event.preventDefault()
            focusMenuTrigger(rootContext.rootRef.current, menuContext.triggerRef.current, 'last', rootContext.loop())
          }
        },
      ),
    },
  )

  return (
    <Primitive.button
      {...primitiveProps}
      ref={(node: HTMLButtonElement | null) => {
        menuContext.triggerRef.current = node
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

MenubarTrigger.displayName = TRIGGER_NAME

function MenubarPortal(props: ScopedProps<MenubarPortalProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuPortal {...menuScope} {...props} />
}

MenubarPortal.displayName = PORTAL_NAME

function MenubarContent(props: ScopedProps<MenubarContentProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  const rootContext = useMenubarContext(CONTENT_NAME, props.__scopeMenubar as Scope<MenubarContextValue | undefined>)
  const menuContext = useMenubarMenuContext(
    CONTENT_NAME,
    props.__scopeMenubar as Scope<MenubarMenuContextValue | undefined>,
  )

  return (
    <MenuContent
      {...menuScope}
      {...props}
      id={menuContext.contentId()}
      aria-labelledby={menuContext.triggerId()}
      onCloseAutoFocus={(event) => {
        props.onCloseAutoFocus?.(event)
        event.preventDefault()
        menuContext.triggerRef.current?.focus()
      }}
      onInteractOutside={(event: Event) => {
        props.onInteractOutside?.(event)
        rootContext.onValueChange(null)
      }}
    />
  )
}

MenubarContent.displayName = CONTENT_NAME

function MenubarGroup(props: ScopedProps<MenubarGroupProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuGroup {...menuScope} {...props} />
}

MenubarGroup.displayName = GROUP_NAME

function MenubarLabel(props: ScopedProps<MenubarLabelProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuLabel {...menuScope} {...props} />
}

MenubarLabel.displayName = LABEL_NAME

function MenubarItem(props: ScopedProps<MenubarItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuItem {...menuScope} {...props} />
}

MenubarItem.displayName = ITEM_NAME

function MenubarCheckboxItem(props: ScopedProps<MenubarCheckboxItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuCheckboxItem {...menuScope} {...props} />
}

MenubarCheckboxItem.displayName = CHECKBOX_ITEM_NAME

function MenubarRadioGroup(props: ScopedProps<MenubarRadioGroupProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuRadioGroup {...menuScope} {...props} />
}

MenubarRadioGroup.displayName = RADIO_GROUP_NAME

function MenubarRadioItem(props: ScopedProps<MenubarRadioItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuRadioItem {...menuScope} {...props} />
}

MenubarRadioItem.displayName = RADIO_ITEM_NAME

function MenubarItemIndicator(props: ScopedProps<MenubarItemIndicatorProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuItemIndicator {...menuScope} {...props} />
}

MenubarItemIndicator.displayName = ITEM_INDICATOR_NAME

function MenubarSeparator(props: ScopedProps<MenubarSeparatorProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuSeparator {...menuScope} {...props} />
}

MenubarSeparator.displayName = SEPARATOR_NAME

function MenubarArrow(props: ScopedProps<MenubarArrowProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuArrow {...menuScope} {...props} />
}

MenubarArrow.displayName = ARROW_NAME

function MenubarSub(props: ScopedProps<MenubarSubProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuSub {...menuScope} {...props} />
}

MenubarSub.displayName = SUB_NAME

function MenubarSubTrigger(props: ScopedProps<MenubarSubTriggerProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuSubTrigger {...menuScope} {...props} />
}

MenubarSubTrigger.displayName = SUB_TRIGGER_NAME

function MenubarSubContent(props: ScopedProps<MenubarSubContentProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeMenubar)
  return <MenuSubContent {...menuScope} {...props} />
}

MenubarSubContent.displayName = SUB_CONTENT_NAME

const Root = Menubar
const Menu = MenubarMenu
const Trigger = MenubarTrigger
const Portal = MenubarPortal
const Content = MenubarContent
const Group = MenubarGroup
const Label = MenubarLabel
const Item = MenubarItem
const CheckboxItem = MenubarCheckboxItem
const RadioGroup = MenubarRadioGroup
const RadioItem = MenubarRadioItem
const ItemIndicator = MenubarItemIndicator
const Separator = MenubarSeparator
const Arrow = MenubarArrow
const Sub = MenubarSub
const SubTrigger = MenubarSubTrigger
const SubContent = MenubarSubContent

export {
  createMenubarScope,
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarPortal,
  MenubarContent,
  MenubarGroup,
  MenubarLabel,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarItemIndicator,
  MenubarSeparator,
  MenubarArrow,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  Root,
  Menu,
  Trigger,
  Portal,
  Content,
  Group,
  Label,
  Item,
  CheckboxItem,
  RadioGroup,
  RadioItem,
  ItemIndicator,
  Separator,
  Arrow,
  Sub,
  SubTrigger,
  SubContent,
}

export type {
  MenubarProps,
  MenubarMenuProps,
  MenubarTriggerProps,
  MenubarPortalProps,
  MenubarContentProps,
  MenubarGroupProps,
  MenubarLabelProps,
  MenubarItemProps,
  MenubarCheckboxItemProps,
  MenubarRadioGroupProps,
  MenubarRadioItemProps,
  MenubarItemIndicatorProps,
  MenubarSeparatorProps,
  MenubarArrowProps,
  MenubarSubProps,
  MenubarSubTriggerProps,
  MenubarSubContentProps,
}
