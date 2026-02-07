import type { FictNode } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'

export interface SwitchProps {
  checked?: boolean | (() => boolean)
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  name?: string
  value?: string
  children?: FictNode
  [key: string]: unknown
}

export interface SwitchThumbProps {
  children?: FictNode
  [key: string]: unknown
}

export function Switch(props: SwitchProps): FictNode {
  const checkedState = createControllableState<boolean>({
    value: props.checked,
    defaultValue: props.defaultChecked ?? false,
    onChange: props.onCheckedChange,
  })

  return {
    type: 'button',
    props: {
      ...props,
      type: 'button',
      role: 'switch',
      disabled: props.disabled,
      'aria-checked': () => checkedState.get(),
      'data-state': () => (checkedState.get() ? 'checked' : 'unchecked'),
      'data-switch': '',
      onClick: (event: MouseEvent) => {
        ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
        if (event.defaultPrevented || props.disabled) return
        checkedState.set(!checkedState.get())
      },
      children: [
        props.children,
        props.name
          ? {
              type: 'input',
              props: {
                type: 'checkbox',
                hidden: true,
                tabIndex: -1,
                name: props.name,
                value: props.value,
                checked: () => checkedState.get(),
                readOnly: true,
              },
            }
          : null,
      ],
    },
  }
}

export function SwitchThumb(props: SwitchThumbProps): FictNode {
  return {
    type: 'span',
    props: {
      ...props,
      'data-switch-thumb': '',
      children: props.children,
    },
  }
}
