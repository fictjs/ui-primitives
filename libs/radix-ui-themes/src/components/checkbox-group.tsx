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
  extends ComponentPropsWithout<typeof CheckboxGroupPrimitive.Root, 'color' | 'defaultChecked'>,
    MarginProps,
    CheckboxGroupRootOwnProps {}

const CheckboxGroupRoot = React.forwardRef<CheckboxGroupRootElement, CheckboxGroupRootProps>(
  ({
    color = checkboxGroupRootPropDefs.color.default,
    highContrast = checkboxGroupRootPropDefs.highContrast.default,
    size = checkboxGroupRootPropDefs.size.default,
    variant = checkboxGroupRootPropDefs.variant.default,
    ...props
  }, forwardedRef) => {
    const { className, ...rootProps } = extractProps(props, marginPropDefs)

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
  extends ComponentPropsWithout<typeof CheckboxGroupPrimitive.Item, RemovedProps>,
    MarginProps {}

const CheckboxGroupItem = React.forwardRef<CheckboxGroupItemElement, CheckboxGroupItemProps>(
  ({ children, className, style, ...props }, forwardedRef) => {
    const { size } = useContext(CheckboxGroupStyleContext)

    if (children) {
      return (
        <Text as="label" size={size} class={classNames('rt-CheckboxGroupItem', className)} style={style}>
          <CheckboxGroupItemCheckbox {...props} ref={React.coerceRef(forwardedRef)} />
          <span class="rt-CheckboxGroupItemInner">{children}</span>
        </Text>
      )
    }

    return <CheckboxGroupItemCheckbox {...props} ref={React.coerceRef(forwardedRef)} class={className} style={style} />
  },
)

type CheckboxGroupItemCheckboxElement = React.ElementRef<typeof CheckboxGroupPrimitive.Item>

interface CheckboxGroupItemCheckboxProps
  extends ComponentPropsWithout<typeof CheckboxGroupPrimitive.Item, RemovedProps> {}

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
