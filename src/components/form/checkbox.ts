import type { FictNode } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'

export interface CheckboxProps {
  checked?: boolean | (() => boolean)
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  name?: string
  value?: string
  required?: boolean
  children?: FictNode
  [key: string]: unknown
}

export function Checkbox(props: CheckboxProps): FictNode {
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
      role: 'checkbox',
      disabled: props.disabled,
      'aria-checked': () => checkedState.get(),
      'data-state': () => (checkedState.get() ? 'checked' : 'unchecked'),
      'data-checkbox': '',
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
                required: props.required,
                readOnly: true,
              },
            }
          : null,
      ],
    },
  }
}
