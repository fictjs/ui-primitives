import { mergeProps, prop, untrack, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useDirection, type Direction } from '@fictjs/direction'
import { Primitive } from '@fictjs/primitive'
import { createRovingFocusGroupScope } from '@fictjs/roving-focus'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

import {
  createRadioScope,
  Radio,
  RadioIndicator,
  type RadioIndicatorProps,
  type RadioProps,
} from './radio.js'

type MaybeAccessor<T> = T | (() => T)
type Orientation = 'horizontal' | 'vertical' | undefined
type ScopedProps<P> = P & { __scopeRadioGroup?: Scope }
type RadioGroupItemElement = HTMLButtonElement
type RadioGroupItemRecord = {
  value: string
  ref: { current: RadioGroupItemElement | null }
  disabled: () => boolean
  checked: () => boolean
  form: () => HTMLFormElement | null
}

const RADIO_GROUP_NAME = 'RadioGroup'
const ITEM_NAME = 'RadioGroupItem'
const INDICATOR_NAME = 'RadioGroupIndicator'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createRadioGroupContext, createRadioGroupScope] = createContextScope(RADIO_GROUP_NAME, [
  createRovingFocusGroupScope,
  createRadioScope,
])
const useRadioScope = createRadioScope()

type RadioGroupContextValue = {
  name: () => string | undefined
  required: () => boolean
  disabled: () => boolean
  value: () => string
  defaultValue: () => string
  orientation: () => Orientation
  dir: () => Direction
  loop: () => boolean
  onValueChange(value: string): void
  currentTabStop: () => string | null
  setCurrentTabStop(value: string | null): void
  getEntryValue(): string | null
  getItems(): RadioGroupItemRecord[]
  registerItem(item: RadioGroupItemRecord): () => void
}

const [RadioGroupProvider, useRadioGroupContext] =
  createRadioGroupContext<RadioGroupContextValue>(RADIO_GROUP_NAME)

type RadioGroupProps = Omit<JSX.IntrinsicElements['div'], 'dir'> & {
  name?: MaybeAccessor<string | undefined>
  required?: MaybeAccessor<boolean | undefined>
  disabled?: MaybeAccessor<boolean | undefined>
  dir?: MaybeAccessor<Direction | undefined>
  orientation?: MaybeAccessor<Orientation>
  loop?: MaybeAccessor<boolean | undefined>
  defaultValue?: MaybeAccessor<string | undefined>
  value?: MaybeAccessor<string | undefined>
  onValueChange?: (value: string) => void
}

type RadioGroupItemProps = Omit<
  RadioProps,
  'checked' | 'defaultChecked' | 'name' | 'onCheck' | 'required'
> & {
  value: string
}

type RadioGroupIndicatorProps = RadioIndicatorProps

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

function focusItem(item: RadioGroupItemRecord | undefined): void {
  item?.ref.current?.focus()
}

function sortItemsByDomOrder(items: RadioGroupItemRecord[]): RadioGroupItemRecord[] {
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
  items: RadioGroupItemRecord[],
  currentValue: string,
  intent: 'prev' | 'next' | 'first' | 'last',
  loop: boolean,
): RadioGroupItemRecord | undefined {
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

function RadioGroup(props: ScopedProps<RadioGroupProps>): FictNode {
  const contextDirection = useDirection()
  const name = () =>
    props.name === undefined
      ? undefined
      : readValue(props.name as MaybeAccessor<string | undefined>)
  const required = () =>
    Boolean(readValue(props.required as MaybeAccessor<boolean | undefined>) ?? false)
  const disabled = () =>
    Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const orientation = () =>
    props.orientation === undefined
      ? undefined
      : (readValue(props.orientation as MaybeAccessor<Orientation>) ?? undefined)
  const loop = () =>
    props.loop === undefined
      ? true
      : Boolean(readValue(props.loop as MaybeAccessor<boolean | undefined>) ?? true)
  const dir = () =>
    props.dir === undefined
      ? contextDirection()
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? contextDirection())
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
    caller: RADIO_GROUP_NAME,
    onChange: (nextValue) => props.onValueChange?.(nextValue),
  })
  const initialValue = untrack(() => value())
  const root = createSignal<HTMLDivElement | null>(null)
  const composedRefs = useComposedRefs(props.ref as PossibleRef<HTMLDivElement>, (node) =>
    root(node),
  )
  const handleValueChange = (nextValue: string) => {
    setValue(nextValue)
  }
  const currentTabStop = createSignal<string | null>(null)
  const items: RadioGroupItemRecord[] = []
  let orderedItems: RadioGroupItemRecord[] = []
  let itemOrderDirty = true
  let itemOrderObserver: MutationObserver | undefined

  const syncItemOrder = () => {
    const nextItems = new Map<string, RadioGroupItemRecord>()

    for (const item of items) {
      if (item.ref.current) {
        nextItems.set(item.value, item)
      }
    }

    orderedItems = sortItemsByDomOrder(Array.from(nextItems.values()))
    itemOrderDirty = false
  }
  const getItems = () => {
    if (itemOrderObserver?.takeRecords().length) {
      itemOrderDirty = true
    }
    if (itemOrderDirty) {
      syncItemOrder()
    }
    return orderedItems
  }

  const getEnabledItems = () => getItems().filter((item) => !item.disabled())
  const getEntryValue = () => {
    const enabledItems = getEnabledItems()
    const currentValue = currentTabStop()

    if (currentValue && enabledItems.some((item) => item.value === currentValue)) {
      return currentValue
    }

    const checkedItem = enabledItems.find((item) => item.checked())
    return checkedItem?.value ?? enabledItems[0]?.value ?? null
  }

  const registerItem = (item: RadioGroupItemRecord) => {
    items.push(item)
    itemOrderDirty = true

    if (!item.disabled() && (item.checked() || currentTabStop() === null)) {
      currentTabStop(item.value)
    }

    return () => {
      const itemIndex = items.indexOf(item)
      if (itemIndex !== -1) {
        items.splice(itemIndex, 1)
        itemOrderDirty = true
      }

      if (currentTabStop() === item.value) {
        currentTabStop(getEntryValue())
      }
    }
  }

  useLayoutEffect(() => {
    const element = root()
    if (!element) return

    const document = element.ownerDocument
    const observer = new MutationObserver(() => {
      itemOrderDirty = true
    })
    observer.observe(element, { childList: true, subtree: true })
    itemOrderObserver = observer
    let disposed = false
    const handleReset = (event: Event) => {
      const form = event.target
      if (!(form instanceof HTMLFormElement)) return
      if (!getItems().some((item) => item.form() === form)) return

      queueMicrotask(() => {
        if (disposed || event.defaultPrevented || valueProp() !== undefined) return
        setValue(initialValue)
      })
    }

    document.addEventListener('reset', handleReset)
    return () => {
      disposed = true
      observer.disconnect()
      if (itemOrderObserver === observer) {
        itemOrderObserver = undefined
      }
      document.removeEventListener('reset', handleReset)
    }
  })

  const primitiveProps = mergeProps(
    {
      role: 'radiogroup',
      'aria-required': prop(() => (required() ? 'true' : undefined)),
      'aria-orientation': prop(orientation),
      'data-disabled': prop(() => (disabled() ? '' : undefined)),
      dir: prop(dir),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeRadioGroup: undefined,
      defaultValue: undefined,
      dir: prop(dir),
      disabled: undefined,
      loop: undefined,
      name: undefined,
      onValueChange: undefined,
      orientation: undefined,
      required: undefined,
      ref: undefined,
      value: undefined,
      onFocus: composeEventHandlers<FocusEvent>(
        (event) => (props.onFocus as ((event: FocusEvent) => void) | undefined)?.(event),
        (event) => {
          if (event.target !== event.currentTarget) return

          const entryValue = getEntryValue()
          if (!entryValue) return

          const entryItem = getEnabledItems().find((item) => item.value === entryValue)
          if (!entryItem) return

          currentTabStop(entryValue)
          focusItem(entryItem)
        },
      ),
    },
  )

  return (
    <RadioGroupProvider
      scope={props.__scopeRadioGroup as Scope<RadioGroupContextValue | undefined>}
      currentTabStop={currentTabStop}
      defaultValue={() => initialValue}
      dir={dir}
      disabled={disabled}
      getEntryValue={getEntryValue}
      getItems={getItems}
      loop={loop}
      name={name}
      onValueChange={handleValueChange}
      orientation={orientation}
      registerItem={registerItem}
      required={required}
      setCurrentTabStop={currentTabStop}
      value={value}
    >
      <Primitive.div {...primitiveProps} ref={composedRefs} />
    </RadioGroupProvider>
  )
}

RadioGroup.displayName = RADIO_GROUP_NAME

function RadioGroupItem(props: ScopedProps<RadioGroupItemProps>): FictNode {
  const { __scopeRadioGroup } = props
  const context = useRadioGroupContext(
    ITEM_NAME,
    __scopeRadioGroup as Scope<RadioGroupContextValue | undefined>,
  )
  const radioScope = useRadioScope(__scopeRadioGroup)
  const itemRef = { current: null as RadioGroupItemElement | null }
  const composedRefs = useComposedRefs(props.ref as PossibleRef<RadioGroupItemElement>, (node) => {
    itemRef.current = node
  })
  const value = () => props.value
  const checked = () => context.value() === value()
  const disabled = () =>
    context.disabled() ||
    Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const form = () => {
    const item = itemRef.current
    if (!item) return null

    const formId =
      props.form === undefined
        ? undefined
        : readValue(props.form as MaybeAccessor<string | undefined>)
    if (!formId) return item.closest('form')

    const formElement = item.ownerDocument.getElementById(formId)
    return formElement?.tagName === 'FORM' ? (formElement as HTMLFormElement) : null
  }
  const isCurrentTabStop = () => {
    if (disabled()) return false
    return context.currentTabStop() === value() || context.getEntryValue() === value()
  }

  useLayoutEffect(() => {
    const currentValue = value()
    return untrack(() =>
      context.registerItem({
        value: currentValue,
        ref: itemRef,
        checked,
        disabled,
        form,
      }),
    )
  })

  useLayoutEffect(() => {
    const item = itemRef.current
    if (item) {
      item.tabIndex = isCurrentTabStop() ? 0 : -1
    }
  })

  const nextProps = mergeProps(
    prop(() => radioScope as Record<string, unknown>),
    prop(() => props as Record<string, unknown>),
    {
      __scopeRadioGroup: undefined,
      checked,
      defaultChecked: () => context.defaultValue() === value(),
      disabled: prop(() => (disabled() ? true : undefined)),
      name: context.name,
      onCheck: () => {
        context.onValueChange(value())
        context.setCurrentTabStop(value())
      },
      ref: composedRefs,
      required: context.required,
      tabIndex: prop(() => (isCurrentTabStop() ? 0 : -1)),
      onFocus: composeEventHandlers<FocusEvent>(
        (event) => (props.onFocus as ((event: FocusEvent) => void) | undefined)?.(event),
        () => {
          if (!disabled()) {
            setTimeout(() => {
              if (!disabled()) {
                context.setCurrentTabStop(value())
              }
            })
          }
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        (event) => (props.onKeyDown as ((event: KeyboardEvent) => void) | undefined)?.(event),
        (event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            return
          }

          if (event.target !== event.currentTarget) return
          if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return

          const intent = getFocusIntent(event.key, context.orientation(), context.dir())
          if (!intent) return

          const enabledItems = context.getItems().filter((item) => !item.disabled())
          const nextItem = getNextItem(enabledItems, value(), intent, context.loop())
          if (!nextItem) return

          event.preventDefault()
          context.setCurrentTabStop(nextItem.value)
          context.onValueChange(nextItem.value)
          setTimeout(() => {
            focusItem(context.getItems().find((item) => item.value === nextItem.value))
          })
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
      value: prop(value),
    },
  ) as unknown as ScopedProps<RadioProps>

  return <Radio {...nextProps} />
}

RadioGroupItem.displayName = ITEM_NAME

function RadioGroupIndicator(props: ScopedProps<RadioGroupIndicatorProps>): FictNode {
  const { __scopeRadioGroup } = props
  const radioScope = useRadioScope(__scopeRadioGroup)
  const indicatorProps = mergeProps(
    radioScope,
    prop(() => props as Record<string, unknown>),
    { __scopeRadioGroup: undefined },
  )

  return <RadioIndicator {...indicatorProps} />
}

RadioGroupIndicator.displayName = INDICATOR_NAME

const Root = RadioGroup
const Item = RadioGroupItem
const Indicator = RadioGroupIndicator

export {
  createRadioGroupScope,
  RadioGroup,
  RadioGroupItem,
  RadioGroupIndicator,
  Root,
  Item,
  Indicator,
}

export type { RadioGroupProps, RadioGroupItemProps, RadioGroupIndicatorProps }
