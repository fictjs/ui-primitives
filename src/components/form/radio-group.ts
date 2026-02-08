import { createContext, useContext, type FictNode } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'
import { Primitive } from '../core/primitive'

export interface RadioGroupProps {
  value?: string | (() => string)
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  children?: FictNode
  [key: string]: unknown
}

export interface RadioItemProps {
  value: string
  as?: string
  asChild?: boolean
  disabled?: boolean
  children?: FictNode
  [key: string]: unknown
}

interface RadioGroupContextValue {
  value: () => string
  setValue: (value: string) => void
  name?: string
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

function useRadioGroupContext(component: string): RadioGroupContextValue {
  const context = useContext(RadioGroupContext)
  if (!context) {
    throw new Error(`${component} must be used inside RadioGroup`)
  }
  return context
}

export function RadioGroup(props: RadioGroupProps): FictNode {
  const valueState = createControllableState<string>({
    value: props.value,
    defaultValue: props.defaultValue ?? '',
    onChange: props.onValueChange,
  })

  const context: RadioGroupContextValue = {
    value: () => valueState.get(),
    setValue: value => valueState.set(value),
    name: props.name,
  }

  return {
    type: RadioGroupContext.Provider,
    props: {
      value: context,
      children: {
        type: 'div',
        props: {
          ...props,
          role: 'radiogroup',
          'data-radio-group': '',
          children: props.children,
        },
      },
    },
  } as unknown as FictNode
}

export function RadioItem(props: RadioItemProps): FictNode {
  const group = useRadioGroupContext('RadioItem')
  const checked = () => group.value() === props.value
  const tag = props.as ?? 'button'
  const hiddenInput = group.name
    ? {
        type: 'input',
        props: {
          type: 'radio',
          hidden: true,
          tabIndex: -1,
          name: group.name,
          checked,
          value: props.value,
          readOnly: true,
        },
      }
    : null

  if (props.asChild) {
    return [
      Primitive({
        ...props,
        as: tag,
        type: props.type,
        role: 'radio',
        disabled: props.disabled,
        'aria-checked': checked,
        'data-state': () => (checked() ? 'checked' : 'unchecked'),
        'data-radio-item': '',
        onClick: (event: MouseEvent) => {
          ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
          if (event.defaultPrevented || props.disabled) return
          group.setValue(props.value)
        },
        children: props.children,
      }),
      hiddenInput,
    ]
  }

  return Primitive({
    ...props,
    as: tag,
    type: tag === 'button' ? 'button' : props.type,
    role: 'radio',
    disabled: props.disabled,
    'aria-checked': checked,
    'data-state': () => (checked() ? 'checked' : 'unchecked'),
    'data-radio-item': '',
    onClick: (event: MouseEvent) => {
      ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
      if (event.defaultPrevented || props.disabled) return
      group.setValue(props.value)
    },
    children: [props.children, hiddenInput],
  })
}
