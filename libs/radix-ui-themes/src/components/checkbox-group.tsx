import { createContext, useContext } from 'fict'

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
    const color = props.color ?? checkboxGroupRootPropDefs.color.default
    const highContrast = props.highContrast ?? checkboxGroupRootPropDefs.highContrast.default
    const size = props.size ?? checkboxGroupRootPropDefs.size.default
    const variant = props.variant ?? checkboxGroupRootPropDefs.variant.default

    return (
      <CheckboxGroupStyleContext.Provider value={{ color, highContrast, size, variant }}>
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
  ({ children, className, style, ...props }, forwardedRef) => {
    const { size } = useContext(CheckboxGroupStyleContext)

    if (children) {
      return (
        <Text
          as="label"
          size={size}
          className={classNames('rt-CheckboxGroupItem', className)}
          style={style}
        >
          <CheckboxGroupItemCheckbox {...props} ref={React.coerceRef(forwardedRef)} />
          <span class="rt-CheckboxGroupItemInner">{children}</span>
        </Text>
      )
    }

    return (
      <CheckboxGroupItemCheckbox
        {...props}
        ref={React.coerceRef(forwardedRef)}
        className={className}
        style={style}
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
>(({ className, ...props }, forwardedRef) => {
  const context = useContext(CheckboxGroupStyleContext)
  const { color, className: extractedClassName } = extractProps(
    { ...props, ...context },
    checkboxGroupRootPropDefs,
    marginPropDefs,
  )

  return (
    <CheckboxGroupPrimitive.Item
      {...props}
      data-accent-color={color}
      ref={React.coerceRef(forwardedRef)}
      class={classNames(
        'rt-reset',
        'rt-BaseCheckboxRoot',
        'rt-CheckboxGroupItemCheckbox',
        extractedClassName,
        className,
      )}
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
