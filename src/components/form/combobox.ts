import { createContext, useContext, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { createControllableState } from '../../internal/state'

export interface ComboboxRootProps {
  value?: string | (() => string)
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: FictNode
}

export interface ComboboxInputProps {
  placeholder?: string
  [key: string]: unknown
}

export interface ComboboxListProps {
  forceMount?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface ComboboxItemProps {
  value: string
  children?: FictNode
  [key: string]: unknown
}

interface ComboboxContextValue {
  value: () => string
  setValue: (value: string) => void
  open: () => boolean
  setOpen: (open: boolean) => void
  query: () => string
  setQuery: (value: string) => void
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null)

function useComboboxContext(component: string): ComboboxContextValue {
  const context = useContext(ComboboxContext)
  if (!context) {
    throw new Error(`${component} must be used inside ComboboxRoot`)
  }
  return context
}

export function ComboboxRoot(props: ComboboxRootProps): FictNode {
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

  const querySignal = createSignal('')

  const context: ComboboxContextValue = {
    value: () => valueState.get(),
    setValue: value => valueState.set(value),
    open: () => openState.get(),
    setOpen: open => openState.set(open),
    query: () => querySignal(),
    setQuery: query => querySignal(query),
  }

  return {
    type: ComboboxContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}

export function ComboboxInput(props: ComboboxInputProps): FictNode {
  const context = useComboboxContext('ComboboxInput')

  return {
    type: 'input',
    props: {
      ...props,
      type: 'text',
      role: 'combobox',
      'aria-expanded': () => context.open(),
      'aria-autocomplete': 'list',
      value: () => context.query() || context.value(),
      'data-combobox-input': '',
      onFocus: (event: FocusEvent) => {
        ;(props.onFocus as ((event: FocusEvent) => void) | undefined)?.(event)
        context.setOpen(true)
      },
      onInput: (event: Event) => {
        ;(props.onInput as ((event: Event) => void) | undefined)?.(event)
        const target = event.target as HTMLInputElement | null
        if (!target) return
        context.setQuery(target.value)
        context.setOpen(true)
      },
    },
  }
}

export function ComboboxList(props: ComboboxListProps): FictNode {
  const context = useComboboxContext('ComboboxList')

  return {
    type: 'div',
    props: {
      'data-combobox-list-wrapper': '',
      children: () =>
        context.open() || props.forceMount
          ? {
              type: 'div',
              props: {
                ...props,
                forceMount: undefined,
                role: 'listbox',
                'data-combobox-list': '',
                children: props.children,
              },
            }
          : null,
    },
  }
}

export function ComboboxItem(props: ComboboxItemProps): FictNode {
  const context = useComboboxContext('ComboboxItem')

  const matches = () => {
    const query = context.query().trim().toLowerCase()
    if (!query) return true

    const text =
      typeof props.children === 'string'
        ? props.children
        : Array.isArray(props.children)
          ? props.children.join(' ')
          : props.value

    return String(text).toLowerCase().includes(query)
  }

  return {
    type: 'div',
    props: {
      'data-combobox-item-wrapper': props.value,
      children: () =>
        matches()
          ? {
              type: 'button',
              props: {
                ...props,
                type: 'button',
                role: 'option',
                'data-combobox-item': props.value,
                onClick: (event: MouseEvent) => {
                  ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
                  if (event.defaultPrevented) return
                  context.setValue(props.value)
                  context.setQuery(props.value)
                  context.setOpen(false)
                },
                children: props.children,
              },
            }
          : null,
    },
  }
}
