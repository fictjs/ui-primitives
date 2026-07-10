import type { FictNode } from 'fict'

import { createContext, mergeProps, prop, useContext } from 'fict'
import { createSignal } from 'fict/advanced'

import { Checkbox as CheckboxPrimitive } from '@fictjs/radix-ui'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeCheckboxGroup?: unknown }

const CHECKBOX_GROUP_NAME = 'CheckboxGroup'

type CheckboxGroupContextValue = {
  disabled: () => boolean
  name: () => string | undefined
  required: () => boolean
  value: () => string[]
  setItemChecked: (value: string, checked: boolean) => void
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | undefined>(undefined)

function useCheckboxGroupContext(consumerName: string) {
  const context = useContext(CheckboxGroupContext)
  if (context === undefined) {
    throw new Error(`${consumerName} must be used within ${CHECKBOX_GROUP_NAME}`)
  }
  return context
}

type CheckboxRootProps = Parameters<typeof CheckboxPrimitive.Root>[0]
type CheckboxIndicatorProps = Parameters<typeof CheckboxPrimitive.Indicator>[0]

interface CheckboxGroupProps extends Omit<
  CheckboxRootProps,
  'checked' | 'defaultChecked' | 'onCheckedChange' | 'name' | 'value'
> {
  defaultValue?: string[]
  value?: MaybeAccessor<string[] | undefined>
  onValueChange?: (value: string[]) => void
  name?: string
  required?: boolean
  disabled?: boolean
}

interface CheckboxGroupItemProps extends Omit<
  CheckboxRootProps,
  'checked' | 'defaultChecked' | 'name' | 'value'
> {
  value: string
}

interface CheckboxGroupIndicatorProps extends CheckboxIndicatorProps {}

function readValue<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value
}

function createCheckboxGroupScope() {
  return () => ({ __scopeCheckboxGroup: undefined })
}

function CheckboxGroup(props: ScopedProps<CheckboxGroupProps>): FictNode {
  const internalValue = createSignal<string[]>(props.defaultValue ?? [])
  const currentValue = () =>
    props.value === undefined ? internalValue() : (readValue(props.value) ?? [])

  const contextValue: CheckboxGroupContextValue = {
    disabled: () => Boolean(props.disabled),
    name: () => props.name,
    required: () => Boolean(props.required),
    value: currentValue,
    setItemChecked: (itemValue, checked) => {
      const nextValue = (() => {
        const current = currentValue()
        if (checked) {
          return current.includes(itemValue) ? current : [...current, itemValue]
        }
        return current.filter((entry) => entry !== itemValue)
      })()

      if (props.value === undefined) {
        internalValue(nextValue)
      }

      props.onValueChange?.(nextValue)
    },
  }

  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeCheckboxGroup: undefined,
      defaultValue: undefined,
      disabled: undefined,
      name: undefined,
      onValueChange: undefined,
      required: undefined,
      value: undefined,
      role: 'group',
      'data-disabled': prop(() => (props.disabled ? '' : undefined)),
    },
  )

  return (
    <CheckboxGroupContext.Provider value={contextValue}>
      <div {...primitiveProps} />
    </CheckboxGroupContext.Provider>
  )
}

function CheckboxGroupItem(props: ScopedProps<CheckboxGroupItemProps>): FictNode {
  const context = useCheckboxGroupContext('CheckboxGroupItem')
  const isChecked = () => context.value().includes(props.value)
  const isDisabled = () => context.disabled() || Boolean(props.disabled)
  const itemProps = mergeProps(
    prop(() => props as unknown as Record<string, unknown>),
    {
      __scopeCheckboxGroup: undefined,
      disabled: undefined,
      onCheckedChange: undefined,
      value: undefined,
    },
  )

  return (
    <CheckboxPrimitive.Root
      {...itemProps}
      checked={isChecked}
      disabled={isDisabled()}
      name={context.name()}
      required={context.required()}
      onCheckedChange={(nextChecked) => {
        context.setItemChecked(props.value, nextChecked === true)
        props.onCheckedChange?.(nextChecked)
      }}
    />
  )
}

function CheckboxGroupIndicator(props: ScopedProps<CheckboxGroupIndicatorProps>): FictNode {
  const indicatorProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    { __scopeCheckboxGroup: undefined },
  )
  return <CheckboxPrimitive.Indicator {...indicatorProps} />
}

CheckboxGroup.displayName = CHECKBOX_GROUP_NAME
CheckboxGroupItem.displayName = 'CheckboxGroupItem'
CheckboxGroupIndicator.displayName = 'CheckboxGroupIndicator'

const Root = CheckboxGroup
const Item = CheckboxGroupItem
const Indicator = CheckboxGroupIndicator

export {
  createCheckboxGroupScope,
  CheckboxGroup,
  CheckboxGroupItem,
  CheckboxGroupIndicator,
  Root,
  Item,
  Indicator,
}
export type { CheckboxGroupProps, CheckboxGroupItemProps, CheckboxGroupIndicatorProps }
