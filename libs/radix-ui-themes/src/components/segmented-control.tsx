import * as React from '../helpers/element.js'
import { mergeProps, prop } from 'fict'
import { classNames } from '../helpers/reactive-class-names.js'
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
        data-disabled={prop(() => props.disabled || undefined) as unknown as boolean | undefined}
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
        disabled={prop(() => !!props.disabled) as unknown as boolean}
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
  (props, forwardedRef) => {
    const itemProps = mergeProps(
      prop(() => props as unknown as Record<string, unknown>),
      {
        children: undefined,
        className: undefined,
      },
    ) as unknown as SegmentedControlItemProps
    const itemLabel = () =>
      typeof props.children === 'string' || typeof props.children === 'number'
        ? String(props.children)
        : undefined

    return (
      <ToggleGroupPrimitive.Item
        {...itemProps}
        ref={React.coerceRef(forwardedRef)}
        class={
          prop(() =>
            classNames('rt-reset', 'rt-SegmentedControlItem', props.className),
          ) as unknown as string
        }
        aria-label={prop(() => props['aria-label'] ?? itemLabel()) as unknown as string | undefined}
        disabled={false}
      >
        <span class="rt-SegmentedControlItemSeparator" />
        <span class="rt-SegmentedControlItemLabel">
          <span class="rt-SegmentedControlItemLabelActive">{props.children}</span>
          <span class="rt-SegmentedControlItemLabelInactive" aria-hidden="true">
            {props.children}
          </span>
        </span>
      </ToggleGroupPrimitive.Item>
    )
  },
)

SegmentedControlItem.displayName = 'SegmentedControl.Item'

export { SegmentedControlRoot as Root, SegmentedControlItem as Item }
export type { SegmentedControlRootProps as RootProps, SegmentedControlItemProps as ItemProps }
