import { createContext, useContext, type FictNode } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'
import { Primitive } from '../core/primitive'

export interface ToggleProps {
  pressed?: boolean | (() => boolean)
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  disabled?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface ToggleGroupProps {
  type?: 'single' | 'multiple'
  value?: string | string[] | (() => string | string[])
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
  children?: FictNode
  [key: string]: unknown
}

export interface ToggleGroupItemProps {
  value: string
  as?: string
  asChild?: boolean
  disabled?: boolean
  children?: FictNode
  [key: string]: unknown
}

interface ToggleGroupContextValue {
  type: () => 'single' | 'multiple'
  values: () => string[]
  toggle: (value: string) => void
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null)

function normalize(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export function Toggle(props: ToggleProps): FictNode {
  const pressedState = createControllableState<boolean>({
    value: props.pressed,
    defaultValue: props.defaultPressed ?? false,
    onChange: props.onPressedChange,
  })

  return {
    type: 'button',
    props: {
      ...props,
      type: 'button',
      disabled: props.disabled,
      'aria-pressed': () => pressedState.get(),
      'data-state': () => (pressedState.get() ? 'on' : 'off'),
      'data-toggle': '',
      onClick: (event: MouseEvent) => {
        ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
        if (event.defaultPrevented || props.disabled) return
        pressedState.set(!pressedState.get())
      },
      children: props.children,
    },
  }
}

export function ToggleGroup(props: ToggleGroupProps): FictNode {
  const type = props.type ?? 'single'
  const valuesState = createControllableState<string[]>({
    value:
      props.value === undefined
        ? undefined
        : typeof props.value === 'function'
          ? (() => normalize((props.value as () => string | string[])()))
          : normalize(props.value as string | string[]),
    defaultValue: normalize(props.defaultValue),
    onChange: next => {
      props.onValueChange?.(type === 'single' ? (next[0] ?? '') : next)
    },
  })

  const context: ToggleGroupContextValue = {
    type: () => type,
    values: () => valuesState.get(),
    toggle: value => {
      const current = valuesState.get()
      const exists = current.includes(value)

      if (type === 'single') {
        valuesState.set(exists ? [] : [value])
        return
      }

      if (exists) {
        valuesState.set(current.filter(item => item !== value))
      } else {
        valuesState.set([...current, value])
      }
    },
  }

  return {
    type: ToggleGroupContext.Provider,
    props: {
      value: context,
      children: {
        type: 'div',
        props: {
          ...props,
          role: 'group',
          'data-toggle-group': '',
          children: props.children,
        },
      },
    },
  } as unknown as FictNode
}

export function ToggleGroupItem(props: ToggleGroupItemProps): FictNode {
  const group = useContext(ToggleGroupContext)
  if (!group) {
    throw new Error('ToggleGroupItem must be used inside ToggleGroup')
  }

  const pressed = () => group.values().includes(props.value)
  const tag = props.as ?? 'button'

  return Primitive({
    ...props,
    as: tag,
    type: !props.asChild && tag === 'button' ? 'button' : props.type,
    disabled: props.disabled,
    'aria-pressed': pressed,
    'data-state': () => (pressed() ? 'on' : 'off'),
    'data-toggle-group-item': '',
    onClick: (event: MouseEvent) => {
      ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
      if (event.defaultPrevented || props.disabled) return
      group.toggle(props.value)
    },
    children: props.children,
  })
}
