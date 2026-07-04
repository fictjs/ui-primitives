import { createContext, useContext } from 'fict'
import * as React from '../helpers/element.js'
import classNames from 'classnames'
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
    const { size = calloutRootPropDefs.size.default } = props
    const { asChild, children, className, color, ...rootProps } = extractProps(
      props,
      calloutRootPropDefs,
      marginPropDefs,
    )
    const Comp = asChild ? Slot.Root : 'div'
    return (
      <Comp
        data-accent-color={color}
        {...rootProps}
        class={classNames('rt-CalloutRoot', className)}
        ref={React.coerceRef(forwardedRef)}
      >
        <CalloutContext.Provider value={{ size }}>{children}</CalloutContext.Provider>
      </Comp>
    )
  },
)
CalloutRoot.displayName = 'Callout.Root'

type CalloutIconElement = React.ElementRef<'div'>
interface CalloutIconProps extends ComponentPropsWithout<'div', RemovedProps> {}
const CalloutIcon = React.forwardRef<CalloutIconElement, CalloutIconProps>(
  ({ className, ...props }, forwardedRef) => {
    return (
      <div
        {...props}
        class={classNames('rt-CalloutIcon', className)}
        ref={React.coerceRef(forwardedRef)}
      />
    )
  },
)
CalloutIcon.displayName = 'Callout.Icon'

type CalloutTextElement = React.ElementRef<'p'>
type CalloutTextProps = ComponentPropsAs<typeof Text, 'p'>
const CalloutText = React.forwardRef<CalloutTextElement, CalloutTextProps>(
  ({ className, ...props }, forwardedRef) => {
    const { size } = useContext(CalloutContext)
    return (
      <Text
        as="p"
        size={mapResponsiveProp(size, mapCalloutSizeToTextSize)}
        {...props}
        ref={React.coerceRef(forwardedRef)}
        className={classNames('rt-CalloutText', className)}
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
