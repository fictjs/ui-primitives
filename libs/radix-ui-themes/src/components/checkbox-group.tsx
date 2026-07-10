import { createContext, mergeProps, prop, useContext } from 'fict'

import * as React from '../helpers/element.js'
import classNames from 'classnames'

import * as CheckboxGroupPrimitive from './checkbox-group.primitive.js'
import { checkboxGroupRootPropDefs } from './checkbox-group.props.js'
import { ThickCheckIcon } from './icons.js'
import { Text } from './text.js'
import { extractProps } from '../helpers/extract-props.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type CheckboxGroupStyleContextValue = GetPropDefTypes<typeof checkboxGroupRootPropDefs>

const CheckboxGroupStyleContext = createContext<CheckboxGroupStyleContextValue>({})

type CheckboxGroupRootOwnProps = GetPropDefTypes<typeof checkboxGroupRootPropDefs>
type CheckboxGroupRootElement = React.ElementRef<typeof CheckboxGroupPrimitive.Root>

interface CheckboxGroupRootProps
  extends
    ComponentPropsWithout<typeof CheckboxGroupPrimitive.Root, 'color' | 'defaultChecked'>,
    MarginProps,
    CheckboxGroupRootOwnProps {}

const CheckboxGroupRoot = React.forwardRef<CheckboxGroupRootElement, CheckboxGroupRootProps>(
  (props, forwardedRef) => {
    const {
      className,
      color: _color,
      highContrast: _highContrast,
      size: _size,
      variant: _variant,
      ...rootProps
    } = extractProps(props, marginPropDefs)
    const contextValue: CheckboxGroupStyleContextValue = {
      get color() {
        return props.color ?? checkboxGroupRootPropDefs.color.default
      },
      get highContrast() {
        return props.highContrast ?? checkboxGroupRootPropDefs.highContrast.default
      },
      get size() {
        return props.size ?? checkboxGroupRootPropDefs.size.default
      },
      get variant() {
        return props.variant ?? checkboxGroupRootPropDefs.variant.default
      },
    }

    return (
      <CheckboxGroupStyleContext.Provider value={contextValue}>
        <CheckboxGroupPrimitive.Root
          {...rootProps}
          ref={React.coerceRef(forwardedRef)}
          class={classNames('rt-CheckboxGroupRoot', className)}
        />
      </CheckboxGroupStyleContext.Provider>
    )
  },
)

type CheckboxGroupItemElement = React.ElementRef<typeof CheckboxGroupPrimitive.Item>

interface CheckboxGroupItemProps
  extends ComponentPropsWithout<typeof CheckboxGroupPrimitive.Item, RemovedProps>, MarginProps {}

const CheckboxGroupItem = React.forwardRef<CheckboxGroupItemElement, CheckboxGroupItemProps>(
  (props, forwardedRef) => {
    const context = useContext(CheckboxGroupStyleContext)
    const itemProps = mergeProps(
      prop(() => props as unknown as Record<string, unknown>),
      {
        children: undefined,
        className: undefined,
        style: undefined,
      },
    ) as unknown as CheckboxGroupItemCheckboxProps

    if (props.children) {
      return (
        <Text
          as="label"
          size={prop(() => context.size) as unknown as CheckboxGroupRootOwnProps['size']}
          className={
            prop(() => classNames('rt-CheckboxGroupItem', props.className)) as unknown as string
          }
          style={prop(() => props.style) as unknown as CheckboxGroupItemProps['style']}
        >
          <CheckboxGroupItemCheckbox {...itemProps} ref={React.coerceRef(forwardedRef)} />
          <span class="rt-CheckboxGroupItemInner">{props.children}</span>
        </Text>
      )
    }

    return (
      <CheckboxGroupItemCheckbox
        {...itemProps}
        ref={React.coerceRef(forwardedRef)}
        className={prop(() => props.className) as unknown as string}
        style={prop(() => props.style) as unknown as CheckboxGroupItemProps['style']}
      />
    )
  },
)

type CheckboxGroupItemCheckboxElement = React.ElementRef<typeof CheckboxGroupPrimitive.Item>

interface CheckboxGroupItemCheckboxProps extends ComponentPropsWithout<
  typeof CheckboxGroupPrimitive.Item,
  RemovedProps
> {}

const CheckboxGroupItemCheckbox = React.forwardRef<
  CheckboxGroupItemCheckboxElement,
  CheckboxGroupItemCheckboxProps
>((props, forwardedRef) => {
  const context = useContext(CheckboxGroupStyleContext)
  const { color, className: extractedClassName } = extractProps(
    mergeProps(
      prop(() => props as unknown as Record<string, unknown>),
      context,
    ) as unknown as CheckboxGroupItemCheckboxProps & CheckboxGroupStyleContextValue,
    checkboxGroupRootPropDefs,
    marginPropDefs,
  )

  return (
    <CheckboxGroupPrimitive.Item
      {...(mergeProps(
        prop(() => props as unknown as Record<string, unknown>),
        { className: undefined },
      ) as unknown as CheckboxGroupItemCheckboxProps)}
      data-accent-color={color}
      ref={React.coerceRef(forwardedRef)}
      class={
        prop(() =>
          classNames(
            'rt-reset',
            'rt-BaseCheckboxRoot',
            'rt-CheckboxGroupItemCheckbox',
            extractedClassName,
            props.className,
          ),
        ) as unknown as string
      }
    >
      <CheckboxGroupPrimitive.Indicator class="rt-BaseCheckboxIndicator">
        <ThickCheckIcon />
      </CheckboxGroupPrimitive.Indicator>
    </CheckboxGroupPrimitive.Item>
  )
})

CheckboxGroupRoot.displayName = 'CheckboxGroup.Root'
CheckboxGroupItem.displayName = 'CheckboxGroup.Item'
CheckboxGroupItemCheckbox.displayName = 'CheckboxGroup.ItemCheckbox'

export { CheckboxGroupRoot as Root, CheckboxGroupItem as Item }
export type { CheckboxGroupRootProps as RootProps, CheckboxGroupItemProps as ItemProps }
