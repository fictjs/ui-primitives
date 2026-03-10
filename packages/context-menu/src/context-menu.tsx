import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import {
  createMenuScope,
  Menu,
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
type ScopedProps<P> = P & { __scopeContextMenu?: Scope }
type StyleRecord = Record<string, string | number>
type TriggerProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
  disabled?: MaybeAccessor<boolean | undefined>
}
type ContextMenuContextValue = {
  open: () => boolean
  onOpenChange(open: boolean): void
  modal: () => boolean
  anchorPoint: () => { x: number; y: number } | null
  onAnchorPointChange(value: { x: number; y: number } | null): void
}

const CONTEXT_MENU_NAME = 'ContextMenu'
const TRIGGER_NAME = 'ContextMenuTrigger'
const PORTAL_NAME = 'ContextMenuPortal'
const CONTENT_NAME = 'ContextMenuContent'
const GROUP_NAME = 'ContextMenuGroup'
const LABEL_NAME = 'ContextMenuLabel'
const ITEM_NAME = 'ContextMenuItem'
const CHECKBOX_ITEM_NAME = 'ContextMenuCheckboxItem'
const RADIO_GROUP_NAME = 'ContextMenuRadioGroup'
const RADIO_ITEM_NAME = 'ContextMenuRadioItem'
const ITEM_INDICATOR_NAME = 'ContextMenuItemIndicator'
const SEPARATOR_NAME = 'ContextMenuSeparator'
const ARROW_NAME = 'ContextMenuArrow'
const SUB_NAME = 'ContextMenuSub'
const SUB_TRIGGER_NAME = 'ContextMenuSubTrigger'
const SUB_CONTENT_NAME = 'ContextMenuSubContent'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createContextMenuContext, createContextMenuScope] = createContextScope(
  CONTEXT_MENU_NAME,
  [createMenuScope],
)
const [ContextMenuProvider, useContextMenuContext] =
  createContextMenuContext<ContextMenuContextValue>(CONTEXT_MENU_NAME)
const useMenuScope = createMenuScope()

type ContextMenuProps = {
  children?: FictNode | FictNode[]
  open?: MaybeAccessor<boolean | undefined>
  defaultOpen?: MaybeAccessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
  modal?: MaybeAccessor<boolean | undefined>
}

type ContextMenuTriggerProps = TriggerProps
type ContextMenuPortalProps = MenuPortalProps
type ContextMenuContentProps = MenuContentProps
type ContextMenuGroupProps = MenuGroupProps
type ContextMenuLabelProps = MenuLabelProps
type ContextMenuItemProps = MenuItemProps
type ContextMenuCheckboxItemProps = MenuCheckboxItemProps
type ContextMenuRadioGroupProps = MenuRadioGroupProps
type ContextMenuRadioItemProps = MenuRadioItemProps
type ContextMenuItemIndicatorProps = MenuItemIndicatorProps
type ContextMenuSeparatorProps = MenuSeparatorProps
type ContextMenuArrowProps = MenuArrowProps
type ContextMenuSubProps = MenuSubProps
type ContextMenuSubTriggerProps = MenuSubTriggerProps
type ContextMenuSubContentProps = MenuSubContentProps

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

function readStyle(value: unknown): StyleRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as StyleRecord
}

function ContextMenu(props: ScopedProps<ContextMenuProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  const openProp = () =>
    props.open === undefined ? undefined : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? false
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? false)
  const modal = () =>
    props.modal === undefined ? true : Boolean(readValue(props.modal as MaybeAccessor<boolean | undefined>) ?? true)
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: CONTEXT_MENU_NAME,
    ...(props.onOpenChange ? { onChange: props.onOpenChange } : {}),
  })
  const anchorPoint = createSignal<{ x: number; y: number } | null>(null)

  return (
    <ContextMenuProvider
      scope={props.__scopeContextMenu as Scope<ContextMenuContextValue | undefined>}
      open={open}
      onOpenChange={setOpen}
      modal={modal}
      anchorPoint={anchorPoint}
      onAnchorPointChange={anchorPoint}
    >
      <Menu {...menuScope} open={open} onOpenChange={setOpen} modal={modal}>
        {props.children}
      </Menu>
    </ContextMenuProvider>
  )
}

ContextMenu.displayName = CONTEXT_MENU_NAME

function ContextMenuTrigger(props: ScopedProps<ContextMenuTriggerProps>): FictNode {
  const { __scopeContextMenu, ...triggerProps } = props
  const context = useContextMenuContext(
    TRIGGER_NAME,
    __scopeContextMenu as Scope<ContextMenuContextValue | undefined>,
  )
  const disabled = () =>
    props.disabled === undefined
      ? false
      : Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const primitiveProps = mergeProps(
    {
      'data-state': prop(() => (context.open() ? 'open' : 'closed')),
      'data-disabled': prop(() => (disabled() ? '' : undefined)),
    },
    () => triggerProps as Record<string, unknown>,
    {
      __scopeContextMenu: undefined,
      disabled: undefined,
      onContextMenu: composeEventHandlers<MouseEvent>(
        props.onContextMenu as ((event: MouseEvent) => void) | undefined,
        (event) => {
          if (disabled()) {
            event.preventDefault()
            return
          }

          event.preventDefault()
          context.onAnchorPointChange({
            x: event.clientX,
            y: event.clientY,
          })
          context.onOpenChange(true)
        },
      ),
    },
  )

  return <Primitive.div {...primitiveProps} />
}

ContextMenuTrigger.displayName = TRIGGER_NAME

function ContextMenuPortal(props: ScopedProps<ContextMenuPortalProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuPortal {...menuScope} {...props} />
}

ContextMenuPortal.displayName = PORTAL_NAME

function ContextMenuContent(props: ScopedProps<ContextMenuContentProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  const context = useContextMenuContext(
    CONTENT_NAME,
    props.__scopeContextMenu as Scope<ContextMenuContextValue | undefined>,
  )

  return (
    <MenuContent
      {...menuScope}
      {...props}
      style={{
        position: 'fixed',
        ...(context.anchorPoint() ? { left: context.anchorPoint()!.x, top: context.anchorPoint()!.y } : {}),
        ...readStyle(props.style),
      }}
      onCloseAutoFocus={(event) => {
        props.onCloseAutoFocus?.(event)
        context.onAnchorPointChange(null)
      }}
    />
  )
}

ContextMenuContent.displayName = CONTENT_NAME

function ContextMenuGroup(props: ScopedProps<ContextMenuGroupProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuGroup {...menuScope} {...props} />
}

ContextMenuGroup.displayName = GROUP_NAME

function ContextMenuLabel(props: ScopedProps<ContextMenuLabelProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuLabel {...menuScope} {...props} />
}

ContextMenuLabel.displayName = LABEL_NAME

function ContextMenuItem(props: ScopedProps<ContextMenuItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuItem {...menuScope} {...props} />
}

ContextMenuItem.displayName = ITEM_NAME

function ContextMenuCheckboxItem(props: ScopedProps<ContextMenuCheckboxItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuCheckboxItem {...menuScope} {...props} />
}

ContextMenuCheckboxItem.displayName = CHECKBOX_ITEM_NAME

function ContextMenuRadioGroup(props: ScopedProps<ContextMenuRadioGroupProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuRadioGroup {...menuScope} {...props} />
}

ContextMenuRadioGroup.displayName = RADIO_GROUP_NAME

function ContextMenuRadioItem(props: ScopedProps<ContextMenuRadioItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuRadioItem {...menuScope} {...props} />
}

ContextMenuRadioItem.displayName = RADIO_ITEM_NAME

function ContextMenuItemIndicator(props: ScopedProps<ContextMenuItemIndicatorProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuItemIndicator {...menuScope} {...props} />
}

ContextMenuItemIndicator.displayName = ITEM_INDICATOR_NAME

function ContextMenuSeparator(props: ScopedProps<ContextMenuSeparatorProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuSeparator {...menuScope} {...props} />
}

ContextMenuSeparator.displayName = SEPARATOR_NAME

function ContextMenuArrow(props: ScopedProps<ContextMenuArrowProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuArrow {...menuScope} {...props} />
}

ContextMenuArrow.displayName = ARROW_NAME

function ContextMenuSub(props: ScopedProps<ContextMenuSubProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuSub {...menuScope} {...props} />
}

ContextMenuSub.displayName = SUB_NAME

function ContextMenuSubTrigger(props: ScopedProps<ContextMenuSubTriggerProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuSubTrigger {...menuScope} {...props} />
}

ContextMenuSubTrigger.displayName = SUB_TRIGGER_NAME

function ContextMenuSubContent(props: ScopedProps<ContextMenuSubContentProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuSubContent {...menuScope} {...props} />
}

ContextMenuSubContent.displayName = SUB_CONTENT_NAME

const Root = ContextMenu
const Trigger = ContextMenuTrigger
const Portal = ContextMenuPortal
const Content = ContextMenuContent
const Group = ContextMenuGroup
const Label = ContextMenuLabel
const Item = ContextMenuItem
const CheckboxItem = ContextMenuCheckboxItem
const RadioGroup = ContextMenuRadioGroup
const RadioItem = ContextMenuRadioItem
const ItemIndicator = ContextMenuItemIndicator
const Separator = ContextMenuSeparator
const Arrow = ContextMenuArrow
const Sub = ContextMenuSub
const SubTrigger = ContextMenuSubTrigger
const SubContent = ContextMenuSubContent

export {
  createContextMenuScope,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuItemIndicator,
  ContextMenuSeparator,
  ContextMenuArrow,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  Root,
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
  ContextMenuProps,
  ContextMenuTriggerProps,
  ContextMenuPortalProps,
  ContextMenuContentProps,
  ContextMenuGroupProps,
  ContextMenuLabelProps,
  ContextMenuItemProps,
  ContextMenuCheckboxItemProps,
  ContextMenuRadioGroupProps,
  ContextMenuRadioItemProps,
  ContextMenuItemIndicatorProps,
  ContextMenuSeparatorProps,
  ContextMenuArrowProps,
  ContextMenuSubProps,
  ContextMenuSubTriggerProps,
  ContextMenuSubContentProps,
}
