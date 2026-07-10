import { createContext, mergeProps, prop, useContext } from 'fict'

import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'

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
  extends
    ComponentPropsWithout<typeof RadioGroupPrimitive.Root, 'color' | 'defaultChecked'>,
    MarginProps,
    RadioGroupRootOwnProps {}

const RadioGroupRoot = React.forwardRef<RadioGroupRootElement, RadioGroupRootProps>(
  (props, forwardedRef) => {
    const {
      className,
      color: _color,
      highContrast: _highContrast,
      size: _size,
      variant: _variant,
      ...rootProps
    } = extractProps(props, marginPropDefs)
    const contextValue: RadioGroupStyleContextValue = {
      get color() {
        return props.color ?? radioGroupRootPropDefs.color.default
      },
      get highContrast() {
        return props.highContrast ?? radioGroupRootPropDefs.highContrast.default
      },
      get size() {
        return props.size ?? radioGroupRootPropDefs.size.default
      },
      get variant() {
        return props.variant ?? radioGroupRootPropDefs.variant.default
      },
    }

    return (
      <RadioGroupStyleContext.Provider value={contextValue}>
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
  extends ComponentPropsWithout<typeof RadioGroupPrimitive.Item, RemovedProps>, MarginProps {}

const RadioGroupItem = React.forwardRef<RadioGroupItemElement, RadioGroupItemProps>(
  (props, forwardedRef) => {
    const context = useContext(RadioGroupStyleContext)
    const itemProps = mergeProps(
      prop(() => props as unknown as Record<string, unknown>),
      {
        children: undefined,
        className: undefined,
        style: undefined,
      },
    ) as unknown as RadioGroupItemRadioProps
    const setForwardedRef = React.coerceRef(forwardedRef)
    const itemLabel = () =>
      typeof props.children === 'string' || typeof props.children === 'number'
        ? String(props.children)
        : undefined
    let itemNode: HTMLButtonElement | null = null
    const handleItemRef = (node: RadioGroupItemElement | null) => {
      itemNode = node as HTMLButtonElement | null
      setForwardedRef?.(node)
    }

    if (props.children) {
      return (
        <Text
          as="label"
          size={prop(() => context.size) as unknown as RadioGroupRootOwnProps['size']}
          className={
            prop(() => classNames('rt-RadioGroupItem', props.className)) as unknown as string
          }
          style={prop(() => props.style) as unknown as RadioGroupItemProps['style']}
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
            {...itemProps}
            aria-label={
              prop(() => props['aria-label'] ?? itemLabel()) as unknown as string | undefined
            }
            ref={handleItemRef}
          />
          <span class="rt-RadioGroupItemInner">{props.children}</span>
        </Text>
      )
    }

    return (
      <RadioGroupItemRadio
        {...itemProps}
        ref={handleItemRef}
        className={prop(() => props.className) as unknown as string}
        style={prop(() => props.style) as unknown as RadioGroupItemProps['style']}
      />
    )
  },
)

type RadioGroupItemRadioElement = React.ElementRef<typeof RadioGroupPrimitive.Item>

interface RadioGroupItemRadioProps extends ComponentPropsWithout<
  typeof RadioGroupPrimitive.Item,
  RemovedProps
> {}

const RadioGroupItemRadio = React.forwardRef<RadioGroupItemRadioElement, RadioGroupItemRadioProps>(
  (props, forwardedRef) => {
    const context = useContext(RadioGroupStyleContext)
    const extractedProps = extractProps(
      mergeProps(
        context,
        prop(() => props as unknown as Record<string, unknown>),
      ) as unknown as RadioGroupItemRadioProps & RadioGroupStyleContextValue,
      baseRadioPropDefs,
      marginPropDefs,
    )
    const radioProps = mergeProps(
      prop(() => extractedProps as unknown as Record<string, unknown>),
      { className: undefined, color: undefined },
    ) as unknown as RadioGroupItemRadioProps

    return (
      <RadioGroupPrimitive.Item
        {...radioProps}
        data-accent-color={extractedProps.color}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-reset', 'rt-BaseRadioRoot', extractedProps.className)}
      />
    )
  },
)

RadioGroupRoot.displayName = 'RadioGroup.Root'
RadioGroupItem.displayName = 'RadioGroup.Item'
RadioGroupItemRadio.displayName = 'RadioGroup.ItemRadio'

export { RadioGroupRoot as Root, RadioGroupItem as Item }
export type { RadioGroupRootProps as RootProps, RadioGroupItemProps as ItemProps }
