import * as React from '../helpers/element.js'
import classNames from 'classnames'
import { Checkbox as CheckboxPrimitive } from '@fictjs/radix-ui'

import { checkboxPropDefs } from './checkbox.props.js'
import { ThickCheckIcon, ThickDividerHorizontalIcon } from './icons.js'
import { extractProps } from '../helpers/extract-props.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type CheckboxElement = React.ElementRef<typeof CheckboxPrimitive.Root>
type CheckboxOwnProps = GetPropDefTypes<typeof checkboxPropDefs>
interface CheckboxProps
  extends
    ComponentPropsWithout<
      typeof CheckboxPrimitive.Root,
      'asChild' | 'color' | 'defaultValue' | 'children'
    >,
    MarginProps,
    CheckboxOwnProps {}
const Checkbox = React.forwardRef<CheckboxElement, CheckboxProps>((props, forwardedRef) => {
  const {
    className,
    color,
    defaultChecked: defaultCheckedProp,
    ...checkboxProps
  } = extractProps(props, checkboxPropDefs, marginPropDefs)

  return (
    <CheckboxPrimitive.Root
      data-accent-color={color}
      {...checkboxProps}
      defaultChecked={defaultCheckedProp}
      ref={React.coerceRef(forwardedRef)}
      class={classNames('rt-reset', 'rt-BaseCheckboxRoot', 'rt-CheckboxRoot', className)}
    >
      <CheckboxPrimitive.Indicator class="rt-BaseCheckboxIndicator rt-CheckboxIndicator">
        {props.checked === 'indeterminate' || props.defaultChecked === 'indeterminate' ? (
          <ThickDividerHorizontalIcon />
        ) : (
          <ThickCheckIcon />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = 'Checkbox'

export { Checkbox }
export type { CheckboxProps }
