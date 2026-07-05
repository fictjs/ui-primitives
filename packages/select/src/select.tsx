import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useId } from '@fictjs/id'
import {
  createMenuScope,
  Menu,
  MenuPortal,
  MenuContent,
  MenuSeparator,
  MenuArrow,
  type MenuPortalProps,
  type MenuContentProps,
  type MenuSeparatorProps,
  type MenuArrowProps,
} from '@fictjs/menu'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeSelect?: Scope }
type PrimitiveButtonProps = JSX.IntrinsicElements['button'] & {
  asChild?: boolean
}
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type PrimitiveSpanProps = JSX.IntrinsicElements['span'] & {
  asChild?: boolean
}
type SelectContextValue = {
  value: () => string
  onValueChange(value: string): void
  open: () => boolean
  onOpenChange(open: boolean): void
  disabled: () => boolean
  triggerRef: { current: HTMLButtonElement | null }
  triggerId: () => string
  contentId: () => string
  selectedText: () => string
  setSelectedText(value: string): void
  registerItemText(value: string, text: string): void
}
type SelectItemContextValue = {
  value: () => string
  selected: () => boolean
  onSelect(): void
}

const SELECT_NAME = 'Select'
const TRIGGER_NAME = 'SelectTrigger'
const VALUE_NAME = 'SelectValue'
const ICON_NAME = 'SelectIcon'
const PORTAL_NAME = 'SelectPortal'
const CONTENT_NAME = 'SelectContent'
const VIEWPORT_NAME = 'SelectViewport'
const GROUP_NAME = 'SelectGroup'
const LABEL_NAME = 'SelectLabel'
const ITEM_NAME = 'SelectItem'
const ITEM_TEXT_NAME = 'SelectItemText'
const ITEM_INDICATOR_NAME = 'SelectItemIndicator'
const SCROLL_UP_BUTTON_NAME = 'SelectScrollUpButton'
const SCROLL_DOWN_BUTTON_NAME = 'SelectScrollDownButton'
const SEPARATOR_NAME = 'SelectSeparator'
const ARROW_NAME = 'SelectArrow'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')
const READ_VALUE_DEPTH_LIMIT = 10

const [createSelectContext, createSelectScope] = createContextScope(SELECT_NAME, [createMenuScope])
const [SelectProvider, useSelectContext] = createSelectContext<SelectContextValue>(SELECT_NAME)
const [SelectItemProvider, useSelectItemContext] =
  createSelectContext<SelectItemContextValue>(ITEM_NAME)
const useMenuScope = createMenuScope()

type SelectProps = {
  children?: FictNode | FictNode[]
  open?: MaybeAccessor<boolean | undefined>
  defaultOpen?: MaybeAccessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
  disabled?: MaybeAccessor<boolean | undefined>
  value?: MaybeAccessor<string | undefined>
  defaultValue?: MaybeAccessor<string | undefined>
  onValueChange?: (value: string) => void
}

type SelectTriggerProps = PrimitiveButtonProps
type SelectValueProps = PrimitiveSpanProps & {
  placeholder?: MaybeAccessor<string | undefined>
}
type SelectIconProps = PrimitiveSpanProps
type SelectPortalProps = MenuPortalProps
type SelectPosition = 'item-aligned' | 'popper'
type SelectContentProps = MenuContentProps & {
  position?: MaybeAccessor<SelectPosition | undefined>
}
type SelectViewportProps = PrimitiveDivProps
type SelectGroupProps = PrimitiveDivProps
type SelectLabelProps = PrimitiveDivProps
type SelectItemProps = PrimitiveDivProps & {
  value: string
  disabled?: MaybeAccessor<boolean | undefined>
}
type SelectItemTextProps = PrimitiveSpanProps
type SelectItemIndicatorProps = PrimitiveSpanProps
type SelectScrollUpButtonProps = PrimitiveButtonProps
type SelectScrollDownButtonProps = PrimitiveButtonProps
type SelectSeparatorProps = MenuSeparatorProps
type SelectArrowProps = MenuArrowProps

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

function readStyle(value: unknown): Record<string, string | number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, string | number>
}

function getSelectWrapperStyle(
  trigger: HTMLElement | null,
  side: 'top' | 'right' | 'bottom' | 'left',
  align: 'start' | 'center' | 'end',
  sideOffset: number,
  alignOffset: number,
): Record<string, string> {
  if (!trigger) {
    return {
      position: 'fixed',
      left: '0px',
      top: '0px',
      transform: 'translate(0px, 0px)',
      minWidth: 'max-content',
      zIndex: 'auto',
      '--radix-popper-transform-origin': '0% 0px',
      '--radix-popper-available-width': `${window.innerWidth}px`,
      '--radix-popper-available-height': `${window.innerHeight}px`,
      '--radix-popper-anchor-width': '0px',
      '--radix-popper-anchor-height': '0px',
    }
  }

  const rect = trigger.getBoundingClientRect()
  const availableWidth =
    side === 'left'
      ? rect.left
      : side === 'right'
        ? window.innerWidth - rect.right
        : window.innerWidth
  const availableHeight =
    side === 'top'
      ? rect.top
      : side === 'bottom'
        ? window.innerHeight - rect.bottom
        : window.innerHeight

  let left = rect.left
  let top = rect.top
  let translateSuffix = ''

  if (side === 'top') {
    top = rect.top - sideOffset
  } else if (side === 'bottom') {
    top = rect.bottom + sideOffset
  } else if (side === 'left') {
    left = rect.left - sideOffset
  } else {
    left = rect.right + sideOffset
  }

  if (side === 'top' || side === 'bottom') {
    if (align === 'center') {
      left = rect.left + rect.width / 2
    } else if (align === 'end') {
      left = rect.right
    }

    left += alignOffset

    if (align === 'center') {
      translateSuffix = side === 'top' ? ' translate(-50%, -100%)' : ' translate(-50%, 0)'
    } else if (align === 'end') {
      translateSuffix = side === 'top' ? ' translate(-100%, -100%)' : ' translate(-100%, 0)'
    } else if (side === 'top') {
      translateSuffix = ' translate(0, -100%)'
    }
  } else {
    if (align === 'center') {
      top = rect.top + rect.height / 2
    } else if (align === 'end') {
      top = rect.bottom
    }

    top += alignOffset

    if (align === 'center') {
      translateSuffix = side === 'left' ? ' translate(-100%, -50%)' : ' translate(0, -50%)'
    } else if (align === 'end') {
      translateSuffix = side === 'left' ? ' translate(-100%, -100%)' : ' translate(0, -100%)'
    } else if (side === 'left') {
      translateSuffix = ' translate(-100%, 0)'
    }
  }

  const roundedLeft = Math.round(left)
  const roundedTop = Math.round(top)
  const originX =
    side === 'top' || side === 'bottom'
      ? align === 'center'
        ? '50%'
        : align === 'end'
          ? '100%'
          : '0%'
      : side === 'left'
        ? '100%'
        : '0%'
  const originY =
    side === 'left' || side === 'right'
      ? align === 'center'
        ? '50%'
        : align === 'end'
          ? '100%'
          : '0%'
      : side === 'top'
        ? '100%'
        : '0px'

  return {
    position: 'fixed',
    left: '0px',
    top: '0px',
    transform: `translate(${roundedLeft}px, ${roundedTop}px)${translateSuffix}`,
    minWidth: 'max-content',
    zIndex: 'auto',
    '--radix-popper-transform-origin': `${originX} ${originY}`,
    '--radix-popper-available-width': `${Math.max(availableWidth, 0)}px`,
    '--radix-popper-available-height': `${Math.max(availableHeight, 0)}px`,
    '--radix-popper-anchor-width': `${Math.max(rect.width, 0)}px`,
    '--radix-popper-anchor-height': `${Math.max(rect.height, 0)}px`,
  }
}

function Select(props: ScopedProps<SelectProps>): FictNode {
  const triggerRef = { current: null as HTMLButtonElement | null }
  const menuScope = useMenuScope(props.__scopeSelect)
  const triggerId = useId()
  const contentId = useId()
  const selectedText = createSignal('')
  const textByValue = new Map<string, string>()
  const valueProp = () =>
    props.value === undefined
      ? undefined
      : readValue(props.value as MaybeAccessor<string | undefined>)
  const defaultValue = () =>
    props.defaultValue === undefined
      ? ''
      : (readValue(props.defaultValue as MaybeAccessor<string | undefined>) ?? '')
  const openProp = () =>
    props.open === undefined
      ? undefined
      : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const disabled = () =>
    props.disabled === undefined
      ? false
      : Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? false
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? false)
  const [value, setValue] = useControllableState<string>({
    prop: valueProp,
    defaultProp: defaultValue,
    caller: SELECT_NAME,
    ...(props.onValueChange ? { onChange: props.onValueChange } : {}),
  })
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: SELECT_NAME,
    ...(props.onOpenChange ? { onChange: props.onOpenChange } : {}),
  })

  const onValueChange = (nextValue: string) => {
    setValue(nextValue)
    selectedText(textByValue.get(nextValue) ?? '')
  }

  return (
    <SelectProvider
      scope={props.__scopeSelect as Scope<SelectContextValue | undefined>}
      value={value}
      onValueChange={onValueChange}
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      triggerRef={triggerRef}
      triggerId={triggerId}
      contentId={contentId}
      selectedText={selectedText}
      setSelectedText={selectedText}
      registerItemText={(itemValue, text) => {
        textByValue.set(itemValue, text)
        if (itemValue === value()) {
          selectedText(text)
        }
      }}
    >
      <Menu {...menuScope} open={open} onOpenChange={setOpen} modal={false}>
        {props.children}
      </Menu>
    </SelectProvider>
  )
}

Select.displayName = SELECT_NAME

function SelectTrigger(props: ScopedProps<SelectTriggerProps>): FictNode {
  const context = useSelectContext(
    TRIGGER_NAME,
    props.__scopeSelect as Scope<SelectContextValue | undefined>,
  )
  const primitiveProps = mergeProps(
    {
      type: 'button',
      id: prop(context.triggerId),
      'aria-haspopup': 'listbox',
      'aria-expanded': prop(() => String(context.open())),
      'aria-controls': prop(() => (context.open() ? context.contentId() : undefined)),
      'aria-disabled': prop(() => (context.disabled() ? 'true' : undefined)),
      'data-disabled': prop(() => (context.disabled() ? '' : undefined)),
      'data-state': prop(() => (context.open() ? 'open' : 'closed')),
      disabled: prop(() => (context.disabled() ? true : undefined)),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeSelect: undefined,
      onClick: composeEventHandlers<MouseEvent>(
        props.onClick as ((event: MouseEvent) => void) | undefined,
        () => {
          if (context.disabled()) return
          context.onOpenChange(!context.open())
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event) => {
          if (context.disabled()) return
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            context.onOpenChange(true)
          }
        },
      ),
    },
  )

  return (
    <Primitive.button
      {...primitiveProps}
      ref={(node: HTMLButtonElement | null) => {
        context.triggerRef.current = node
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

SelectTrigger.displayName = TRIGGER_NAME

function SelectValue(props: ScopedProps<SelectValueProps>): FictNode {
  const context = useSelectContext(
    VALUE_NAME,
    props.__scopeSelect as Scope<SelectContextValue | undefined>,
  )
  const placeholder = () =>
    props.placeholder === undefined
      ? ''
      : (readValue(props.placeholder as MaybeAccessor<string | undefined>) ?? '')
  const ref = { current: null as HTMLSpanElement | null }

  useLayoutEffect(() => {
    if (!ref.current) return
    ref.current.textContent = context.value() ? context.selectedText() : placeholder()
  })

  return (
    <Primitive.span
      {...(props as Record<string, unknown>)}
      ref={(node: HTMLSpanElement | null) => {
        ref.current = node
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

SelectValue.displayName = VALUE_NAME

function SelectIcon(props: ScopedProps<SelectIconProps>): FictNode {
  return <Primitive.span {...(props as Record<string, unknown>)} />
}

SelectIcon.displayName = ICON_NAME

function SelectPortal(props: ScopedProps<SelectPortalProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeSelect)
  return <MenuPortal {...menuScope} {...props} />
}

SelectPortal.displayName = PORTAL_NAME

function SelectContent(props: ScopedProps<SelectContentProps>): FictNode {
  const { position: _position, ...contentProps } = props
  const menuScope = useMenuScope(props.__scopeSelect)
  const context = useSelectContext(
    CONTENT_NAME,
    props.__scopeSelect as Scope<SelectContextValue | undefined>,
  )
  const position = () =>
    props.position === undefined
      ? 'item-aligned'
      : (readValue(props.position as MaybeAccessor<SelectPosition | undefined>) ?? 'item-aligned')
  const side = () =>
    props.side === undefined
      ? 'bottom'
      : (readValue(props.side as MaybeAccessor<'top' | 'right' | 'bottom' | 'left' | undefined>) ??
        'bottom')
  const align = () =>
    props.align === undefined
      ? 'start'
      : (readValue(props.align as MaybeAccessor<'start' | 'center' | 'end' | undefined>) ?? 'start')
  const sideOffset = () =>
    props.sideOffset === undefined
      ? 4
      : (readValue(props.sideOffset as MaybeAccessor<number | undefined>) ?? 4)
  const alignOffset = () =>
    props.alignOffset === undefined
      ? 0
      : (readValue(props.alignOffset as MaybeAccessor<number | undefined>) ?? 0)
  const wrapperStyle = () =>
    getSelectWrapperStyle(context.triggerRef.current, side(), align(), sideOffset(), alignOffset())
  const wrapperProps = mergeProps({
    style: prop(wrapperStyle),
  })

  const contentNode = (
    <MenuContent
      {...menuScope}
      {...contentProps}
      id={context.contentId()}
      role="listbox"
      aria-labelledby={context.triggerId()}
      data-side={prop(() => (position() === 'popper' ? side() : undefined))}
      data-align={prop(() => (position() === 'popper' ? align() : undefined))}
      {...(position() === 'popper'
        ? {
            style: {
              outline: 'none',
              width: '100%',
              '--radix-select-content-transform-origin': 'var(--radix-popper-transform-origin)',
              '--radix-select-content-available-width': 'var(--radix-popper-available-width)',
              '--radix-select-content-available-height': 'var(--radix-popper-available-height)',
              '--radix-select-trigger-width': 'var(--radix-popper-anchor-width)',
              '--radix-select-trigger-height': 'var(--radix-popper-anchor-height)',
              ...readStyle(contentProps.style),
            },
          }
        : contentProps.style === undefined
          ? {}
          : { style: contentProps.style })}
      onCloseAutoFocus={(event) => {
        props.onCloseAutoFocus?.(event)
        event.preventDefault()
      }}
    />
  )

  return (
    <div data-radix-popper-content-wrapper="" {...(wrapperProps as Record<string, unknown>)}>
      {contentNode}
    </div>
  )
}

SelectContent.displayName = CONTENT_NAME

function SelectViewport(props: ScopedProps<SelectViewportProps>): FictNode {
  return <Primitive.div {...(props as Record<string, unknown>)} />
}

SelectViewport.displayName = VIEWPORT_NAME

function SelectGroup(props: ScopedProps<SelectGroupProps>): FictNode {
  return <Primitive.div role="group" {...(props as Record<string, unknown>)} />
}

SelectGroup.displayName = GROUP_NAME

function SelectLabel(props: ScopedProps<SelectLabelProps>): FictNode {
  return <Primitive.div {...(props as Record<string, unknown>)} />
}

SelectLabel.displayName = LABEL_NAME

function SelectItem(props: ScopedProps<SelectItemProps>): FictNode {
  const context = useSelectContext(
    ITEM_NAME,
    props.__scopeSelect as Scope<SelectContextValue | undefined>,
  )
  const selected = () => context.value() === props.value
  const disabled = () =>
    props.disabled === undefined
      ? false
      : Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)

  return (
    <SelectItemProvider
      scope={props.__scopeSelect as Scope<SelectItemContextValue | undefined>}
      value={() => props.value}
      selected={selected}
      onSelect={() => {
        if (disabled()) return
        context.onValueChange(props.value)
        context.onOpenChange(false)
      }}
    >
      <Primitive.div
        {...(props as unknown as Record<string, unknown>)}
        role="option"
        aria-selected={selected() ? 'true' : 'false'}
        data-state={selected() ? 'checked' : 'unchecked'}
        data-disabled={disabled() ? '' : undefined}
        onClick={composeEventHandlers<MouseEvent>(
          props.onClick as ((event: MouseEvent) => void) | undefined,
          (event) => {
            if (disabled()) {
              event.preventDefault()
              return
            }
            context.onValueChange(props.value)
            context.onOpenChange(false)
          },
        )}
        onKeyDown={composeEventHandlers<KeyboardEvent>(
          props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
          (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              context.onValueChange(props.value)
              context.onOpenChange(false)
            }
          },
        )}
      />
    </SelectItemProvider>
  )
}

SelectItem.displayName = ITEM_NAME

function SelectItemText(props: ScopedProps<SelectItemTextProps>): FictNode {
  const rootContext = useSelectContext(
    ITEM_TEXT_NAME,
    props.__scopeSelect as Scope<SelectContextValue | undefined>,
  )
  const itemContext = useSelectItemContext(
    ITEM_TEXT_NAME,
    props.__scopeSelect as Scope<SelectItemContextValue | undefined>,
  )
  const ref = { current: null as HTMLSpanElement | null }

  useLayoutEffect(() => {
    const text = ref.current?.textContent ?? ''
    rootContext.registerItemText(itemContext.value(), text)
    if (itemContext.selected()) {
      rootContext.setSelectedText(text)
    }
  })

  return (
    <Primitive.span
      {...(props as Record<string, unknown>)}
      ref={(node: HTMLSpanElement | null) => {
        ref.current = node
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

SelectItemText.displayName = ITEM_TEXT_NAME

function SelectItemIndicator(props: ScopedProps<SelectItemIndicatorProps>): FictNode {
  const itemContext = useSelectItemContext(
    ITEM_INDICATOR_NAME,
    props.__scopeSelect as Scope<SelectItemContextValue | undefined>,
  )

  return (
    <Presence present={itemContext.selected}>
      <Primitive.span {...(props as Record<string, unknown>)} />
    </Presence>
  )
}

SelectItemIndicator.displayName = ITEM_INDICATOR_NAME

function SelectScrollUpButton(props: ScopedProps<SelectScrollUpButtonProps>): FictNode {
  return <Primitive.button type="button" {...(props as Record<string, unknown>)} />
}

SelectScrollUpButton.displayName = SCROLL_UP_BUTTON_NAME

function SelectScrollDownButton(props: ScopedProps<SelectScrollDownButtonProps>): FictNode {
  return <Primitive.button type="button" {...(props as Record<string, unknown>)} />
}

SelectScrollDownButton.displayName = SCROLL_DOWN_BUTTON_NAME

function SelectSeparator(props: ScopedProps<SelectSeparatorProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeSelect)
  return <MenuSeparator {...menuScope} {...props} />
}

SelectSeparator.displayName = SEPARATOR_NAME

function SelectArrow(props: ScopedProps<SelectArrowProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeSelect)
  return <MenuArrow {...menuScope} {...props} />
}

SelectArrow.displayName = ARROW_NAME

const Root = Select
const Trigger = SelectTrigger
const Value = SelectValue
const Icon = SelectIcon
const Portal = SelectPortal
const Content = SelectContent
const Viewport = SelectViewport
const Group = SelectGroup
const Label = SelectLabel
const Item = SelectItem
const ItemText = SelectItemText
const ItemIndicator = SelectItemIndicator
const ScrollUpButton = SelectScrollUpButton
const ScrollDownButton = SelectScrollDownButton
const Separator = SelectSeparator
const Arrow = SelectArrow

export {
  createSelectScope,
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectSeparator,
  SelectArrow,
  Root,
  Trigger,
  Value,
  Icon,
  Portal,
  Content,
  Viewport,
  Group,
  Label,
  Item,
  ItemText,
  ItemIndicator,
  ScrollUpButton,
  ScrollDownButton,
  Separator,
  Arrow,
}

export type {
  SelectProps,
  SelectTriggerProps,
  SelectValueProps,
  SelectIconProps,
  SelectPortalProps,
  SelectContentProps,
  SelectViewportProps,
  SelectGroupProps,
  SelectLabelProps,
  SelectItemProps,
  SelectItemTextProps,
  SelectItemIndicatorProps,
  SelectScrollUpButtonProps,
  SelectScrollDownButtonProps,
  SelectSeparatorProps,
  SelectArrowProps,
}
