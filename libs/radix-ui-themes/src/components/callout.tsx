import { createContext, mergeProps, prop, useContext } from 'fict'
import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { Slot } from '@fictjs/radix-ui'

import { Text } from './text.js'
import { calloutRootPropDefs } from './callout.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { mapResponsiveProp, mapCalloutSizeToTextSize } from '../helpers/map-prop-values.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type {
  ComponentPropsWithout,
  RemovedProps,
  ComponentPropsAs,
} from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type CalloutRootOwnProps = GetPropDefTypes<typeof calloutRootPropDefs>

type CalloutContextValue = { size?: CalloutRootOwnProps['size'] }
const CalloutContext = createContext<CalloutContextValue>({})

type CalloutRootElement = React.ElementRef<'div'>
interface CalloutRootProps
  extends ComponentPropsWithout<'div', RemovedProps>, MarginProps, CalloutRootOwnProps {}
const CalloutRoot = React.forwardRef<CalloutRootElement, CalloutRootProps>(
  (props, forwardedRef) => {
    const { asChild, children, className, color, ...rootProps } = extractProps(
      props,
      calloutRootPropDefs,
      marginPropDefs,
    )
    const contextValue: CalloutContextValue = {
      get size() {
        return props.size ?? calloutRootPropDefs.size.default
      },
    }
    const Comp = asChild ? Slot.Root : 'div'
    return (
      <Comp
        data-accent-color={color}
        {...rootProps}
        class={classNames('rt-CalloutRoot', className)}
        ref={React.coerceRef(forwardedRef)}
      >
        <CalloutContext.Provider value={contextValue}>{children}</CalloutContext.Provider>
      </Comp>
    )
  },
)
CalloutRoot.displayName = 'Callout.Root'

type CalloutIconElement = React.ElementRef<'div'>
interface CalloutIconProps extends ComponentPropsWithout<'div', RemovedProps> {}
const CalloutIcon = React.forwardRef<CalloutIconElement, CalloutIconProps>(
  (props, forwardedRef) => {
    const iconProps = mergeProps(
      prop(() => props as Record<string, unknown>),
      {
        className: undefined,
      },
    )
    return (
      <div
        {...iconProps}
        class={prop(() => classNames('rt-CalloutIcon', props.className)) as unknown as string}
        ref={React.coerceRef(forwardedRef)}
      />
    )
  },
)
CalloutIcon.displayName = 'Callout.Icon'

type CalloutTextElement = React.ElementRef<'p'>
type CalloutTextProps = ComponentPropsAs<typeof Text, 'p'>
const CalloutText = React.forwardRef<CalloutTextElement, CalloutTextProps>(
  (props, forwardedRef) => {
    const context = useContext(CalloutContext)
    const textProps = mergeProps(
      prop(() => props as Record<string, unknown>),
      {
        className: undefined,
      },
    )
    return (
      <Text
        as="p"
        size={
          prop(() =>
            mapResponsiveProp(context.size, mapCalloutSizeToTextSize),
          ) as unknown as CalloutTextProps['size']
        }
        {...textProps}
        ref={React.coerceRef(forwardedRef)}
        className={prop(() => classNames('rt-CalloutText', props.className)) as unknown as string}
      />
    )
  },
)
CalloutText.displayName = 'Callout.Text'

export { CalloutRoot as Root, CalloutIcon as Icon, CalloutText as Text }
export type {
  CalloutRootProps as RootProps,
  CalloutIconProps as IconProps,
  CalloutTextProps as TextProps,
}
