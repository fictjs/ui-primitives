import { mergeProps, prop, untrack, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { createContextScope, type Scope } from '@fictjs/context'
import { useDirection, type Direction } from '@fictjs/direction'
import { Primitive } from '@fictjs/primitive'
import { createRovingFocusGroupScope } from '@fictjs/roving-focus'
import { Toggle, type ToggleProps } from '@fictjs/toggle'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

const TOGGLE_GROUP_NAME = 'ToggleGroup'
const ITEM_NAME = 'ToggleGroupItem'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

type MaybeAccessor<T> = T | (() => T)
type Orientation = 'horizontal' | 'vertical' | undefined
type PossibleRef<T> = ((node: T | null) => void) | { current: T | null } | null | undefined
type ScopedProps<P> = P & { __scopeToggleGroup?: Scope }
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type ToggleGroupItemElement = HTMLButtonElement
type ToggleGroupItemRecord = {
  value: string
  ref: { current: ToggleGroupItemElement | null }
  disabled: () => boolean
  pressed: () => boolean
}

const [createToggleGroupContext, createToggleGroupScope] = createContextScope(TOGGLE_GROUP_NAME, [
  createRovingFocusGroupScope,
])

type ToggleGroupValueContextValue = {
  type: 'single' | 'multiple'
  value: () => string[]
  onItemActivate(value: string): void
  onItemDeactivate(value: string): void
}

type ToggleGroupContextValue = {
  rovingFocus: () => boolean
  disabled: () => boolean
  orientation: () => Orientation
  dir: () => Direction
  loop: () => boolean
  currentTabStop: () => string | null
  setCurrentTabStop(value: string | null): void
  getEntryValue(): string | null
  getItems(): ToggleGroupItemRecord[]
  registerItem(item: ToggleGroupItemRecord): () => void
}

const [ToggleGroupValueProvider, useToggleGroupValueContext] =
  createToggleGroupContext<ToggleGroupValueContextValue>(TOGGLE_GROUP_NAME)
const [ToggleGroupProvider, useToggleGroupContext] =
  createToggleGroupContext<ToggleGroupContextValue>(TOGGLE_GROUP_NAME)

interface ToggleGroupSingleProps extends ToggleGroupImplSingleProps {
  type: 'single'
}

interface ToggleGroupMultipleProps extends ToggleGroupImplMultipleProps {
  type: 'multiple'
}

type ToggleGroupImplProps = Omit<PrimitiveDivProps, 'dir'> & {
  disabled?: MaybeAccessor<boolean | undefined>
  rovingFocus?: MaybeAccessor<boolean | undefined>
  loop?: MaybeAccessor<boolean | undefined>
  orientation?: MaybeAccessor<Orientation>
  dir?: MaybeAccessor<Direction | undefined>
}

type ToggleGroupImplSingleProps = ToggleGroupImplProps & {
  value?: MaybeAccessor<string | undefined>
  defaultValue?: MaybeAccessor<string | undefined>
  onValueChange?: (value: string) => void
}

type ToggleGroupImplMultipleProps = ToggleGroupImplProps & {
  value?: MaybeAccessor<string[] | undefined>
  defaultValue?: MaybeAccessor<string[] | undefined>
  onValueChange?: (value: string[]) => void
}

type ToggleGroupItemImplProps = Omit<
  ToggleProps,
  'defaultPressed' | 'disabled' | 'onPressedChange'
> & {
  value: string
  disabled?: MaybeAccessor<boolean | undefined>
}

type ToggleGroupItemProps = Omit<ToggleGroupItemImplProps, 'pressed'>

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

function setRef<T>(ref: PossibleRef<T>, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value)
    return
  }

  if (ref) {
    ref.current = value
  }
}

function composeEventHandlers<E extends { defaultPrevented: boolean }>(
  original?: ((event: E) => void) | undefined,
  next?: ((event: E) => void) | undefined,
) {
  return (event: E) => {
    original?.(event)
    if (!event.defaultPrevented) {
      next?.(event)
    }
  }
}

function getDirectionAwareKey(key: string, dir: Direction) {
  if (dir !== 'rtl') return key
  return key === 'ArrowLeft' ? 'ArrowRight' : key === 'ArrowRight' ? 'ArrowLeft' : key
}

function getFocusIntent(key: string, orientation: Orientation, dir: Direction) {
  const nextKey = getDirectionAwareKey(key, dir)
  if (orientation === 'vertical' && ['ArrowLeft', 'ArrowRight'].includes(nextKey)) return undefined
  if (orientation === 'horizontal' && ['ArrowUp', 'ArrowDown'].includes(nextKey)) return undefined

  if (nextKey === 'ArrowLeft' || nextKey === 'ArrowUp') return 'prev'
  if (nextKey === 'ArrowRight' || nextKey === 'ArrowDown') return 'next'
  if (nextKey === 'Home' || nextKey === 'PageUp') return 'first'
  if (nextKey === 'End' || nextKey === 'PageDown') return 'last'

  return undefined
}

function focusItem(item: ToggleGroupItemRecord | undefined): void {
  item?.ref.current?.focus()
}

function sortItemsByDomOrder(items: ToggleGroupItemRecord[]): ToggleGroupItemRecord[] {
  return [...items].sort((first, second) => {
    const firstNode = first.ref.current
    const secondNode = second.ref.current
    if (!firstNode || !secondNode || firstNode === secondNode) return 0

    const position = firstNode.compareDocumentPosition(secondNode)
    if (position & 4) return -1
    if (position & 2) return 1
    return 0
  })
}

function getNextItem(
  items: ToggleGroupItemRecord[],
  currentValue: string,
  intent: 'prev' | 'next' | 'first' | 'last',
  loop: boolean,
): ToggleGroupItemRecord | undefined {
  if (items.length === 0) return undefined

  if (intent === 'first') return items[0]
  if (intent === 'last') return items[items.length - 1]

  const currentIndex = items.findIndex((item) => item.value === currentValue)
  if (currentIndex === -1) {
    return intent === 'prev' ? items[items.length - 1] : items[0]
  }

  const step = intent === 'prev' ? -1 : 1
  const nextIndex = currentIndex + step

  if (loop) {
    return items[(nextIndex + items.length) % items.length]
  }

  return items[nextIndex]
}

function ToggleGroup(
  props: ScopedProps<ToggleGroupSingleProps | ToggleGroupMultipleProps>,
): FictNode {
  const toggleGroupProps = mergeProps(
    prop(() => props as unknown as Record<string, unknown>),
    {
      type: undefined,
      onValueChange: prop(() => props.onValueChange),
    },
  )

  if (props.type === 'single') {
    return <ToggleGroupImplSingle {...(toggleGroupProps as Record<string, unknown>)} />
  }

  if (props.type === 'multiple') {
    return <ToggleGroupImplMultiple {...(toggleGroupProps as Record<string, unknown>)} />
  }

  throw new Error(`Missing prop \`type\` expected on \`${TOGGLE_GROUP_NAME}\``)
}

ToggleGroup.displayName = TOGGLE_GROUP_NAME

function ToggleGroupImplSingle(props: ScopedProps<ToggleGroupImplSingleProps>): FictNode {
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
    caller: TOGGLE_GROUP_NAME,
    onChange: (nextValue) => props.onValueChange?.(nextValue),
  })

  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeToggleGroup: undefined,
      defaultValue: undefined,
      onValueChange: undefined,
      type: undefined,
      value: undefined,
    },
  )

  return (
    <ToggleGroupValueProvider
      scope={props.__scopeToggleGroup as Scope<ToggleGroupValueContextValue | undefined>}
      type="single"
      value={() => {
        const currentValue = value()
        return currentValue ? [currentValue] : []
      }}
      onItemActivate={setValue}
      onItemDeactivate={() => setValue('')}
    >
      <ToggleGroupImpl {...primitiveProps} />
    </ToggleGroupValueProvider>
  )
}

function ToggleGroupImplMultiple(props: ScopedProps<ToggleGroupImplMultipleProps>): FictNode {
  const valueProp = () =>
    props.value === undefined
      ? undefined
      : readValue(props.value as MaybeAccessor<string[] | undefined>)
  const defaultValue = () =>
    props.defaultValue === undefined
      ? []
      : (readValue(props.defaultValue as MaybeAccessor<string[] | undefined>) ?? [])

  const [value, setValue] = useControllableState<string[]>({
    prop: valueProp,
    defaultProp: defaultValue,
    caller: TOGGLE_GROUP_NAME,
    onChange: (nextValue) => props.onValueChange?.(nextValue),
  })

  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeToggleGroup: undefined,
      defaultValue: undefined,
      onValueChange: undefined,
      type: undefined,
      value: undefined,
    },
  )

  return (
    <ToggleGroupValueProvider
      scope={props.__scopeToggleGroup as Scope<ToggleGroupValueContextValue | undefined>}
      type="multiple"
      value={value}
      onItemActivate={(itemValue) => {
        setValue((previousValue) =>
          previousValue.includes(itemValue) ? previousValue : [...previousValue, itemValue],
        )
      }}
      onItemDeactivate={(itemValue) => {
        setValue((previousValue) => previousValue.filter((value) => value !== itemValue))
      }}
    >
      <ToggleGroupImpl {...primitiveProps} />
    </ToggleGroupValueProvider>
  )
}

function ToggleGroupImpl(props: ScopedProps<ToggleGroupImplProps>): FictNode {
  const contextDirection = useDirection()
  const disabled = () =>
    Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const rovingFocus = () =>
    props.rovingFocus === undefined
      ? true
      : Boolean(readValue(props.rovingFocus as MaybeAccessor<boolean | undefined>) ?? true)
  const orientation = () => readValue(props.orientation as MaybeAccessor<Orientation>) ?? undefined
  const loop = () =>
    props.loop === undefined
      ? true
      : Boolean(readValue(props.loop as MaybeAccessor<boolean | undefined>) ?? true)
  const dir = () =>
    props.dir === undefined
      ? contextDirection()
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? contextDirection())
  const currentTabStop = createSignal<string | null>(null)
  const items: ToggleGroupItemRecord[] = []

  const getItems = () => {
    const nextItems = new Map<string, ToggleGroupItemRecord>()

    for (const item of items) {
      if (item.ref.current) {
        nextItems.set(item.value, item)
      }
    }

    return sortItemsByDomOrder(Array.from(nextItems.values()))
  }
  const getEnabledItems = () => getItems().filter((item) => !item.disabled())
  const getEntryValue = () => {
    const enabledItems = getEnabledItems()
    const currentValue = currentTabStop()

    if (currentValue && enabledItems.some((item) => item.value === currentValue)) {
      return currentValue
    }

    const activeItem = enabledItems.find((item) => item.pressed())
    return activeItem?.value ?? enabledItems[0]?.value ?? null
  }

  const registerItem = (item: ToggleGroupItemRecord) => {
    items.push(item)

    if (!item.disabled() && (item.pressed() || currentTabStop() === null)) {
      currentTabStop(item.value)
    }

    return () => {
      const itemIndex = items.indexOf(item)
      if (itemIndex !== -1) {
        items.splice(itemIndex, 1)
      }

      if (currentTabStop() === item.value) {
        currentTabStop(getEntryValue())
      }
    }
  }

  const commonProps = mergeProps(
    {
      role: 'group',
      dir: prop(dir),
      tabIndex: prop(() => (rovingFocus() ? 0 : props.tabIndex)),
      onFocus: (event: FocusEvent) => {
        if (!rovingFocus()) return
        if (event.target !== event.currentTarget) return

        const entryValue = getEntryValue()
        if (!entryValue) return

        const entryItem = getEnabledItems().find((item) => item.value === entryValue)
        if (!entryItem) return

        currentTabStop(entryValue)
        focusItem(entryItem)
      },
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeToggleGroup: undefined,
      dir: undefined,
      disabled: undefined,
      loop: undefined,
      orientation: undefined,
      rovingFocus: undefined,
    },
  )

  return (
    <ToggleGroupProvider
      scope={props.__scopeToggleGroup as Scope<ToggleGroupContextValue | undefined>}
      rovingFocus={rovingFocus}
      disabled={disabled}
      orientation={orientation}
      dir={dir}
      loop={loop}
      currentTabStop={currentTabStop}
      setCurrentTabStop={currentTabStop}
      getEntryValue={getEntryValue}
      getItems={getItems}
      registerItem={registerItem}
    >
      <Primitive.div {...(commonProps as Record<string, unknown>)} />
    </ToggleGroupProvider>
  )
}

function ToggleGroupItem(props: ScopedProps<ToggleGroupItemProps>): FictNode {
  const valueContext = useToggleGroupValueContext(
    ITEM_NAME,
    props.__scopeToggleGroup as Scope<ToggleGroupValueContextValue | undefined>,
  )
  const context = useToggleGroupContext(
    ITEM_NAME,
    props.__scopeToggleGroup as Scope<ToggleGroupContextValue | undefined>,
  )
  const itemRef = { current: null as ToggleGroupItemElement | null }
  const value = () => props.value
  const pressed = () => valueContext.value().includes(value())
  const disabled = () =>
    context.disabled() ||
    Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const isCurrentTabStop = () => {
    if (!context.rovingFocus() || disabled()) return false

    return context.currentTabStop() === value() || context.getEntryValue() === value()
  }

  useLayoutEffect(() => {
    const currentValue = value()
    return untrack(() =>
      context.registerItem({
        value: currentValue,
        ref: itemRef,
        disabled,
        pressed,
      }),
    )
  })

  useLayoutEffect(() => {
    const item = itemRef.current
    if (item && context.rovingFocus()) {
      item.tabIndex = isCurrentTabStop() ? 0 : -1
    }
  })

  const itemImplProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeToggleGroup: props.__scopeToggleGroup,
      disabled: prop(() => (disabled() ? true : undefined)),
      pressed,
      ref: (node: ToggleGroupItemElement | null) => {
        itemRef.current = node
        setRef(props.ref as PossibleRef<ToggleGroupItemElement>, node)
      },
      tabIndex: prop(() =>
        context.rovingFocus() ? (isCurrentTabStop() ? 0 : -1) : props.tabIndex,
      ),
      onFocus: composeEventHandlers<FocusEvent>(
        (event) => (props.onFocus as ((event: FocusEvent) => void) | undefined)?.(event),
        () => {
          if (context.rovingFocus() && !disabled()) {
            setTimeout(() => {
              if (context.rovingFocus() && !disabled()) {
                context.setCurrentTabStop(value())
              }
            })
          }
        },
      ),
      onMouseDown: composeEventHandlers<MouseEvent>(
        (event) => (props.onMouseDown as ((event: MouseEvent) => void) | undefined)?.(event),
        (event) => {
          if (disabled()) {
            event.preventDefault()
          }
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        (event) => (props.onKeyDown as ((event: KeyboardEvent) => void) | undefined)?.(event),
        (event) => {
          if (!context.rovingFocus()) return
          if (event.target !== event.currentTarget) return
          if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return

          const intent = getFocusIntent(event.key, context.orientation(), context.dir())
          if (!intent) return

          const enabledItems = context.getItems().filter((item) => !item.disabled())
          const nextItem = getNextItem(enabledItems, value(), intent, context.loop())
          if (!nextItem) return

          event.preventDefault()
          context.setCurrentTabStop(nextItem.value)
          setTimeout(() => focusItem(nextItem))
        },
      ),
    },
  ) as unknown as ScopedProps<ToggleGroupItemImplProps>

  return <ToggleGroupItemImpl {...itemImplProps} />
}

ToggleGroupItem.displayName = ITEM_NAME

function ToggleGroupItemImpl(props: ScopedProps<ToggleGroupItemImplProps>): FictNode {
  const { __scopeToggleGroup } = props
  const valueContext = useToggleGroupValueContext(
    ITEM_NAME,
    __scopeToggleGroup as Scope<ToggleGroupValueContextValue | undefined>,
  )
  const pressed = () =>
    Boolean(readValue(props.pressed as MaybeAccessor<boolean | undefined>) ?? false)

  const primitiveProps = mergeProps(
    {
      'data-toggle-group-item': '',
      'data-toggle-group-value': prop(() => props.value),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeToggleGroup: undefined,
      value: undefined,
    },
    valueContext.type === 'single'
      ? {
          role: 'radio',
          'aria-checked': prop(() => (pressed() ? 'true' : 'false')),
          'aria-pressed': undefined,
        }
      : {},
    {
      onPressedChange: (nextPressed: boolean) => {
        if (nextPressed) {
          valueContext.onItemActivate(props.value)
          return
        }

        valueContext.onItemDeactivate(props.value)
      },
    },
  )

  return <Toggle {...(primitiveProps as Record<string, unknown>)} />
}

const Root = ToggleGroup
const Item = ToggleGroupItem

export { createToggleGroupScope, ToggleGroup, ToggleGroupItem, Root, Item }
export type { ToggleGroupSingleProps, ToggleGroupMultipleProps, ToggleGroupItemProps }
