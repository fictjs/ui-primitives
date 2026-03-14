import { createContext, useContext } from 'fict'

import * as React from '../helpers/element.js'
import classNames from 'classnames'

import { RadioGroup as RadioGroupPrimitive } from '@fictjs/radix-ui'

import { radioGroupRootPropDefs } from './radio-group.props.js'
import { Text } from './text.js'
import { extractProps } from '../helpers/extract-props.js'
import { marginPropDefs } from '../props/margin.props.js'
import { baseRadioPropDefs } from './_internal/base-radio.props.js'

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
    const setForwardedRef = React.coerceRef(forwardedRef)
    const itemLabel =
      typeof children === 'string' || typeof children === 'number' ? String(children) : undefined
    let itemNode: HTMLButtonElement | null = null
    const handleItemRef = (node: RadioGroupItemElement | null) => {
      itemNode = node as HTMLButtonElement | null
      setForwardedRef?.(node)
    }

    if (children) {
      return (
        <Text
          as="label"
          size={size}
          className={classNames('rt-RadioGroupItem', className)}
          style={style}
          onClick={(event) => {
            const target = event.target
            if (!itemNode || target === itemNode || itemNode.contains(target as Node)) {
              return
            }

            event.preventDefault()
            itemNode.focus()
            itemNode.click()
          }}
        >
          <RadioGroupItemRadio
            {...props}
            aria-label={props['aria-label'] ?? itemLabel}
            ref={handleItemRef}
          />
          <span class="rt-RadioGroupItemInner">{children}</span>
        </Text>
      )
    }

    return <RadioGroupItemRadio {...props} ref={handleItemRef} className={className} style={style} />
  },
)

type RadioGroupItemRadioElement = React.ElementRef<typeof RadioGroupPrimitive.Item>

interface RadioGroupItemRadioProps extends ComponentPropsWithout<typeof RadioGroupPrimitive.Item, RemovedProps> {}

const RadioGroupItemRadio = React.forwardRef<RadioGroupItemRadioElement, RadioGroupItemRadioProps>(
  ({ className, ...props }, forwardedRef) => {
    const context = useContext(RadioGroupStyleContext)
    const { className: radioClassName, color, ...radioProps } = extractProps(
      { ...context, ...props, className },
      baseRadioPropDefs,
      marginPropDefs,
    )

    return (
      <RadioGroupPrimitive.Item
        {...radioProps}
        data-accent-color={color}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-reset', 'rt-BaseRadioRoot', radioClassName)}
      />
    )
  },
)

RadioGroupRoot.displayName = 'RadioGroup.Root'
RadioGroupItem.displayName = 'RadioGroup.Item'
RadioGroupItemRadio.displayName = 'RadioGroup.ItemRadio'

export { RadioGroupRoot as Root, RadioGroupItem as Item }
export type { RadioGroupRootProps as RootProps, RadioGroupItemProps as ItemProps }
