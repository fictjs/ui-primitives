import { createContext, useContext, type FictNode } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'

export interface SelectRootProps {
  value?: string | (() => string)
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  children?: FictNode
}

export interface SelectTriggerProps {
  as?: string
  children?: FictNode
  [key: string]: unknown
}

export interface SelectContentProps {
  forceMount?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface SelectItemProps {
  value: string
  children?: FictNode
  [key: string]: unknown
}

interface SelectContextValue {
  value: () => string
  setValue: (value: string) => void
  open: () => boolean
  setOpen: (open: boolean) => void
  disabled: () => boolean
}

const SelectContext = createContext<SelectContextValue | null>(null)

function useSelectContext(component: string): SelectContextValue {
  const context = useContext(SelectContext)
  if (!context) {
    throw new Error(`${component} must be used inside SelectRoot`)
  }
  return context
}

export function SelectRoot(props: SelectRootProps): FictNode {
  const valueState = createControllableState<string>({
    value: props.value,
    defaultValue: props.defaultValue ?? '',
    onChange: props.onValueChange,
  })

  const openState = createControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  })

  const context: SelectContextValue = {
    value: () => valueState.get(),
    setValue: value => valueState.set(value),
    open: () => openState.get(),
    setOpen: open => openState.set(open),
    disabled: () => props.disabled ?? false,
  }

  return {
    type: SelectContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}

export function SelectTrigger(props: SelectTriggerProps): FictNode {
  const context = useSelectContext('SelectTrigger')
  const tag = props.as ?? 'button'

  return {
    type: tag,
    props: {
      ...props,
      as: undefined,
      type: tag === 'button' ? (props.type ?? 'button') : props.type,
      disabled: () => context.disabled(),
      'aria-haspopup': 'listbox',
      'aria-expanded': () => context.open(),
      'data-state': () => (context.open() ? 'open' : 'closed'),
      'data-select-trigger': '',
      onClick: (event: MouseEvent) => {
        ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
        if (event.defaultPrevented || context.disabled()) return
        context.setOpen(!context.open())
      },
      children: props.children,
    },
  }
}

export function SelectValue(props: Record<string, unknown> & { placeholder?: string }): FictNode {
  const context = useSelectContext('SelectValue')

  return {
    type: 'span',
    props: {
      ...props,
      'data-select-value': '',
      children: () => context.value() || props.placeholder || '',
    },
  }
}

export function SelectContent(props: SelectContentProps): FictNode {
  const context = useSelectContext('SelectContent')

  return {
    type: 'div',
    props: {
      'data-select-content-wrapper': '',
      children: () =>
        context.open() || props.forceMount
          ? {
              type: 'div',
              props: {
                ...props,
                forceMount: undefined,
                role: 'listbox',
                'data-select-content': '',
                children: props.children,
              },
            }
          : null,
    },
  }
}

export function SelectItem(props: SelectItemProps): FictNode {
  const context = useSelectContext('SelectItem')
  const selected = () => context.value() === props.value

  return {
    type: 'button',
    props: {
      ...props,
      type: 'button',
      role: 'option',
      'aria-selected': selected,
      'data-state': () => (selected() ? 'checked' : 'unchecked'),
      'data-select-item': props.value,
      onClick: (event: MouseEvent) => {
        ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
        if (event.defaultPrevented) return
        context.setValue(props.value)
        context.setOpen(false)
      },
      children: props.children,
    },
  }
}
