import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useId } from '@fictjs/id'
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
type Direction = 'ltr' | 'rtl'
type ScopedProps<P> = P & { __scopeDropdownMenu?: Scope }
type PrimitiveButtonProps = JSX.IntrinsicElements['button'] & {
  asChild?: boolean
}
type DropdownMenuContextValue = {
  triggerId: () => string
  contentId: () => string
  triggerRef: { current: HTMLButtonElement | null }
  open: () => boolean
  onOpenChange(open: boolean): void
  onOpenToggle(): void
  modal: () => boolean
}

const DROPDOWN_MENU_NAME = 'DropdownMenu'
const TRIGGER_NAME = 'DropdownMenuTrigger'
const PORTAL_NAME = 'DropdownMenuPortal'
const CONTENT_NAME = 'DropdownMenuContent'
const GROUP_NAME = 'DropdownMenuGroup'
const LABEL_NAME = 'DropdownMenuLabel'
const ITEM_NAME = 'DropdownMenuItem'
const CHECKBOX_ITEM_NAME = 'DropdownMenuCheckboxItem'
const RADIO_GROUP_NAME = 'DropdownMenuRadioGroup'
const RADIO_ITEM_NAME = 'DropdownMenuRadioItem'
const ITEM_INDICATOR_NAME = 'DropdownMenuItemIndicator'
const SEPARATOR_NAME = 'DropdownMenuSeparator'
const ARROW_NAME = 'DropdownMenuArrow'
const SUB_NAME = 'DropdownMenuSub'
const SUB_TRIGGER_NAME = 'DropdownMenuSubTrigger'
const SUB_CONTENT_NAME = 'DropdownMenuSubContent'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')
const READ_VALUE_DEPTH_LIMIT = 10

const [createDropdownMenuContext, createDropdownMenuScope] = createContextScope(
  DROPDOWN_MENU_NAME,
  [createMenuScope],
)
const [DropdownMenuProvider, useDropdownMenuContext] =
  createDropdownMenuContext<DropdownMenuContextValue>(DROPDOWN_MENU_NAME)
const useMenuScope = createMenuScope()

type DropdownMenuProps = {
  children?: FictNode | FictNode[]
  dir?: MaybeAccessor<Direction | undefined>
  open?: MaybeAccessor<boolean | undefined>
  defaultOpen?: MaybeAccessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
  modal?: MaybeAccessor<boolean | undefined>
}

type DropdownMenuTriggerProps = PrimitiveButtonProps & {
  disabled?: MaybeAccessor<boolean | undefined>
}
type DropdownMenuPortalProps = MenuPortalProps
type DropdownMenuContentProps = MenuContentProps
type DropdownMenuGroupProps = MenuGroupProps
type DropdownMenuLabelProps = MenuLabelProps
type DropdownMenuItemProps = MenuItemProps
type DropdownMenuCheckboxItemProps = MenuCheckboxItemProps
type DropdownMenuRadioGroupProps = MenuRadioGroupProps
type DropdownMenuRadioItemProps = MenuRadioItemProps
type DropdownMenuItemIndicatorProps = MenuItemIndicatorProps
type DropdownMenuSeparatorProps = MenuSeparatorProps
type DropdownMenuArrowProps = MenuArrowProps
type DropdownMenuSubProps = MenuSubProps
type DropdownMenuSubTriggerProps = MenuSubTriggerProps
type DropdownMenuSubContentProps = MenuSubContentProps

function isReadableAccessor(value: unknown): value is () => unknown {
  const taggedValue = value as unknown as Record<symbol, unknown>

  return (
    typeof value === 'function' &&
    (value.length === 0 ||
      taggedValue[SIGNAL_MARKER] === true ||
      taggedValue[COMPUTED_MARKER] === true ||
      taggedValue[PROP_GETTER_MARKER] === true)
  )
}

function readValue<T>(value: MaybeAccessor<T>, depth = 0): T {
  if (!isReadableAccessor(value) || depth >= READ_VALUE_DEPTH_LIMIT) {
    return value as T
  }

  return readValue(value(), depth + 1)
}

function DropdownMenu(props: ScopedProps<DropdownMenuProps>): FictNode {
  const triggerId = useId()
  const contentId = useId()
  const triggerRef = { current: null as HTMLButtonElement | null }
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  const openProp = () =>
    props.open === undefined
      ? undefined
      : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? false
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? false)
  const modal = () =>
    props.modal === undefined
      ? true
      : Boolean(readValue(props.modal as MaybeAccessor<boolean | undefined>) ?? true)
  const dir = () =>
    props.dir === undefined
      ? undefined
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? undefined)
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: DROPDOWN_MENU_NAME,
    ...(props.onOpenChange ? { onChange: props.onOpenChange } : {}),
  })

  return (
    <DropdownMenuProvider
      scope={props.__scopeDropdownMenu as Scope<DropdownMenuContextValue | undefined>}
      triggerId={triggerId}
      contentId={contentId}
      triggerRef={triggerRef}
      open={open}
      onOpenChange={setOpen}
      onOpenToggle={() => {
        setOpen((previousOpen) => !previousOpen)
      }}
      modal={modal}
    >
      <Menu
        {...menuScope}
        open={open}
        onOpenChange={setOpen}
        dir={dir}
        modal={modal}
      >
        {props.children}
      </Menu>
    </DropdownMenuProvider>
  )
}

DropdownMenu.displayName = DROPDOWN_MENU_NAME

function DropdownMenuTrigger(props: ScopedProps<DropdownMenuTriggerProps>): FictNode {
  const { __scopeDropdownMenu, ...triggerProps } = props
  const context = useDropdownMenuContext(
    TRIGGER_NAME,
    __scopeDropdownMenu as Scope<DropdownMenuContextValue | undefined>,
  )
  const disabled = () =>
    props.disabled === undefined
      ? false
      : Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLButtonElement>,
    context.triggerRef,
  )
  const primitiveProps = mergeProps(
    {
      type: 'button',
      id: prop(context.triggerId),
      'aria-haspopup': 'menu',
      'aria-expanded': prop(() => String(context.open())),
      'aria-controls': prop(() => (context.open() ? context.contentId() : undefined)),
      'data-state': prop(() => (context.open() ? 'open' : 'closed')),
      'data-disabled': prop(() => (disabled() ? '' : undefined)),
      disabled: prop(() => (disabled() ? true : undefined)),
    },
    () => triggerProps as Record<string, unknown>,
    {
      __scopeDropdownMenu: undefined,
      disabled: undefined,
      ref: undefined,
      onClick: composeEventHandlers<MouseEvent>(
        props.onClick as ((event: MouseEvent) => void) | undefined,
        (event) => {
          if (disabled()) {
            event.preventDefault()
            return
          }

          context.onOpenToggle()
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event) => {
          if (disabled()) return

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            context.onOpenChange(true)
            return
          }

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            context.onOpenToggle()
          }
        },
      ),
    },
  )

  return <Primitive.button {...primitiveProps} ref={composedRefs} />
}

DropdownMenuTrigger.displayName = TRIGGER_NAME

function DropdownMenuPortal(props: ScopedProps<DropdownMenuPortalProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuPortal {...menuScope} {...props} />
}

DropdownMenuPortal.displayName = PORTAL_NAME

function DropdownMenuContent(props: ScopedProps<DropdownMenuContentProps>): FictNode {
  const { __scopeDropdownMenu, ...contentProps } = props
  const context = useDropdownMenuContext(
    CONTENT_NAME,
    __scopeDropdownMenu as Scope<DropdownMenuContextValue | undefined>,
  )
  const menuScope = useMenuScope(__scopeDropdownMenu)

  return (
    <MenuContent
      {...menuScope}
      {...contentProps}
      id={context.contentId()}
      aria-labelledby={context.triggerId()}
      onCloseAutoFocus={(event) => {
        props.onCloseAutoFocus?.(event)
        if (!event.defaultPrevented) {
          context.triggerRef.current?.focus()
        }
        event.preventDefault()
      }}
    />
  )
}

DropdownMenuContent.displayName = CONTENT_NAME

function DropdownMenuGroup(props: ScopedProps<DropdownMenuGroupProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuGroup {...menuScope} {...props} />
}

DropdownMenuGroup.displayName = GROUP_NAME

function DropdownMenuLabel(props: ScopedProps<DropdownMenuLabelProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuLabel {...menuScope} {...props} />
}

DropdownMenuLabel.displayName = LABEL_NAME

function DropdownMenuItem(props: ScopedProps<DropdownMenuItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuItem {...menuScope} {...props} />
}

DropdownMenuItem.displayName = ITEM_NAME

function DropdownMenuCheckboxItem(props: ScopedProps<DropdownMenuCheckboxItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuCheckboxItem {...menuScope} {...props} />
}

DropdownMenuCheckboxItem.displayName = CHECKBOX_ITEM_NAME

function DropdownMenuRadioGroup(props: ScopedProps<DropdownMenuRadioGroupProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuRadioGroup {...menuScope} {...props} />
}

DropdownMenuRadioGroup.displayName = RADIO_GROUP_NAME

function DropdownMenuRadioItem(props: ScopedProps<DropdownMenuRadioItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuRadioItem {...menuScope} {...props} />
}

DropdownMenuRadioItem.displayName = RADIO_ITEM_NAME

function DropdownMenuItemIndicator(props: ScopedProps<DropdownMenuItemIndicatorProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuItemIndicator {...menuScope} {...props} />
}

DropdownMenuItemIndicator.displayName = ITEM_INDICATOR_NAME

function DropdownMenuSeparator(props: ScopedProps<DropdownMenuSeparatorProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuSeparator {...menuScope} {...props} />
}

DropdownMenuSeparator.displayName = SEPARATOR_NAME

function DropdownMenuArrow(props: ScopedProps<DropdownMenuArrowProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuArrow {...menuScope} {...props} />
}

DropdownMenuArrow.displayName = ARROW_NAME

function DropdownMenuSub(props: ScopedProps<DropdownMenuSubProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuSub {...menuScope} {...props} />
}

DropdownMenuSub.displayName = SUB_NAME

function DropdownMenuSubTrigger(props: ScopedProps<DropdownMenuSubTriggerProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuSubTrigger {...menuScope} {...props} />
}

DropdownMenuSubTrigger.displayName = SUB_TRIGGER_NAME

function DropdownMenuSubContent(props: ScopedProps<DropdownMenuSubContentProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeDropdownMenu)
  return <MenuSubContent {...menuScope} {...props} />
}

DropdownMenuSubContent.displayName = SUB_CONTENT_NAME

const Root = DropdownMenu
const Trigger = DropdownMenuTrigger
const Portal = DropdownMenuPortal
const Content = DropdownMenuContent
const Group = DropdownMenuGroup
const Label = DropdownMenuLabel
const Item = DropdownMenuItem
const CheckboxItem = DropdownMenuCheckboxItem
const RadioGroup = DropdownMenuRadioGroup
const RadioItem = DropdownMenuRadioItem
const ItemIndicator = DropdownMenuItemIndicator
const Separator = DropdownMenuSeparator
const Arrow = DropdownMenuArrow
const Sub = DropdownMenuSub
const SubTrigger = DropdownMenuSubTrigger
const SubContent = DropdownMenuSubContent

export {
  createDropdownMenuScope,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItemIndicator,
  DropdownMenuSeparator,
  DropdownMenuArrow,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuPortalProps,
  DropdownMenuContentProps,
  DropdownMenuGroupProps,
  DropdownMenuLabelProps,
  DropdownMenuItemProps,
  DropdownMenuCheckboxItemProps,
  DropdownMenuRadioGroupProps,
  DropdownMenuRadioItemProps,
  DropdownMenuItemIndicatorProps,
  DropdownMenuSeparatorProps,
  DropdownMenuArrowProps,
  DropdownMenuSubProps,
  DropdownMenuSubTriggerProps,
  DropdownMenuSubContentProps,
}
