import { createContext, useContext } from 'fict'

import * as React from '../helpers/element.js'
import classNames from 'classnames'

import { RadioGroup as RadioGroupPrimitive } from '@fictjs/radix-ui'

import { radioGroupRootPropDefs } from './radio-group.props.js'
import { Text } from './text.js'
import { extractProps } from '../helpers/extract-props.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type RadioGroupStyleContextValue = GetPropDefTypes<typeof radioGroupRootPropDefs>

const RadioGroupStyleContext = createContext<RadioGroupStyleContextValue>({})

type RadioGroupRootElement = React.ElementRef<typeof RadioGroupPrimitive.Root>
type RadioGroupRootOwnProps = GetPropDefTypes<typeof radioGroupRootPropDefs>

interface RadioGroupRootProps
  extends ComponentPropsWithout<typeof RadioGroupPrimitive.Root, 'color' | 'defaultChecked'>,
    MarginProps,
    RadioGroupRootOwnProps {}

const RadioGroupRoot = React.forwardRef<RadioGroupRootElement, RadioGroupRootProps>(
  ({
    color = radioGroupRootPropDefs.color.default,
    highContrast = radioGroupRootPropDefs.highContrast.default,
    size = radioGroupRootPropDefs.size.default,
    variant = radioGroupRootPropDefs.variant.default,
    ...props
  }, forwardedRef) => {
    const { className, ...rootProps } = extractProps(props, marginPropDefs)

    return (
      <RadioGroupStyleContext.Provider value={{ color, highContrast, size, variant }}>
        <RadioGroupPrimitive.Root
          {...rootProps}
          ref={React.coerceRef(forwardedRef)}
          class={classNames('rt-RadioGroupRoot', className)}
        />
      </RadioGroupStyleContext.Provider>
    )
  },
)

type RadioGroupItemElement = React.ElementRef<typeof RadioGroupPrimitive.Item>

interface RadioGroupItemProps
  extends ComponentPropsWithout<typeof RadioGroupPrimitive.Item, RemovedProps>,
    MarginProps {}

const RadioGroupItem = React.forwardRef<RadioGroupItemElement, RadioGroupItemProps>(
  ({ children, className, style, ...props }, forwardedRef) => {
    const { size } = useContext(RadioGroupStyleContext)

    if (children) {
      return (
        <Text as="label" size={size} class={classNames('rt-RadioGroupItem', className)} style={style}>
          <RadioGroupItemRadio {...props} ref={React.coerceRef(forwardedRef)} />
          <span class="rt-RadioGroupItemInner">{children}</span>
        </Text>
      )
    }

    return <RadioGroupItemRadio {...props} ref={React.coerceRef(forwardedRef)} class={className} style={style} />
  },
)

type RadioGroupItemRadioElement = React.ElementRef<typeof RadioGroupPrimitive.Item>

interface RadioGroupItemRadioProps extends ComponentPropsWithout<typeof RadioGroupPrimitive.Item, RemovedProps> {}

const RadioGroupItemRadio = React.forwardRef<RadioGroupItemRadioElement, RadioGroupItemRadioProps>(
  ({ className, ...props }, forwardedRef) => {
    const context = useContext(RadioGroupStyleContext)
    const { color } = extractProps({ ...props, ...context }, radioGroupRootPropDefs, marginPropDefs)

    return (
      <RadioGroupPrimitive.Item
        {...props}
        data-accent-color={color}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-reset', 'rt-BaseRadioRoot', className)}
      />
    )
  },
)

RadioGroupRoot.displayName = 'RadioGroup.Root'
RadioGroupItem.displayName = 'RadioGroup.Item'
RadioGroupItemRadio.displayName = 'RadioGroup.ItemRadio'

export { RadioGroupRoot as Root, RadioGroupItem as Item }
export type { RadioGroupRootProps as RootProps, RadioGroupItemProps as ItemProps }
