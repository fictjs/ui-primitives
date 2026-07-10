import * as React from '../helpers/element.js'
import classNames from 'classnames'
import { ToggleGroup as ToggleGroupPrimitive } from '@fictjs/radix-ui'
import { useControllableState } from '@fictjs/radix-ui/internal'

import { segmentedControlRootPropDefs } from './segmented-control.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type SegmentedControlRootOwnProps = GetPropDefTypes<typeof segmentedControlRootPropDefs>

interface SegmentedControlRootProps
  extends
    ComponentPropsWithout<'div', RemovedProps | 'dir'>,
    SegmentedControlRootOwnProps,
    MarginProps {
  value?: string
  defaultValue?: string
  onValueChange?(value: string): void
}

const SegmentedControlRoot = React.forwardRef<HTMLDivElement, SegmentedControlRootProps>(
  (props, forwardedRef) => {
    const {
      className,
      children,
      radius,
      value: valueProp,
      defaultValue: defaultValueProp,
      onValueChange: _onValueChangeProp,
      ...rootProps
    } = extractProps(props, segmentedControlRootPropDefs, marginPropDefs)

    const [value, setValue] = useControllableState({
      prop: valueProp,
      onChange: (nextValue) => props.onValueChange?.(nextValue),
      defaultProp: defaultValueProp ?? '',
    })

    return (
      <ToggleGroupPrimitive.Root
        data-disabled={props.disabled || undefined}
        data-radius={radius}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-SegmentedControlRoot', className)}
        onValueChange={(value) => {
          if (value) {
            setValue(value)
          }
        }}
        {...rootProps}
        type="single"
        value={value}
        disabled={!!props.disabled}
      >
        {children}
        <div class="rt-SegmentedControlIndicator" />
      </ToggleGroupPrimitive.Root>
    )
  },
)

SegmentedControlRoot.displayName = 'SegmentedControl.Root'

interface SegmentedControlItemOwnProps {
  value: string
}

interface SegmentedControlItemProps
  extends
    ComponentPropsWithout<
      typeof ToggleGroupPrimitive.Item,
      RemovedProps | 'disabled' | 'type' | 'value'
    >,
    SegmentedControlItemOwnProps {}

const SegmentedControlItem = React.forwardRef<HTMLButtonElement, SegmentedControlItemProps>(
  ({ children, className, ...props }, forwardedRef) => {
    const itemLabel =
      typeof children === 'string' || typeof children === 'number' ? String(children) : undefined

    return (
      <ToggleGroupPrimitive.Item
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-reset', 'rt-SegmentedControlItem', className)}
        aria-label={props['aria-label'] ?? itemLabel}
        {...props}
        disabled={false}
      >
        <span class="rt-SegmentedControlItemSeparator" />
        <span class="rt-SegmentedControlItemLabel">
          <span class="rt-SegmentedControlItemLabelActive">{children}</span>
          <span class="rt-SegmentedControlItemLabelInactive" aria-hidden="true">
            {children}
          </span>
        </span>
      </ToggleGroupPrimitive.Item>
    )
  },
)

SegmentedControlItem.displayName = 'SegmentedControl.Item'

export { SegmentedControlRoot as Root, SegmentedControlItem as Item }
export type { SegmentedControlRootProps as RootProps, SegmentedControlItemProps as ItemProps }
