import * as React from '../helpers/element.js'
import classNames from 'classnames'
import { composeEventHandlers } from '@fictjs/radix-ui/internal'

import { radioPropDefs } from './radio.props.js'
import { marginPropDefs } from '../props/margin.props.js'
import { extractProps } from '../helpers/extract-props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout } from '../helpers/component-props.js'
import type { NotInputRadioAttributes } from '../helpers/input-attributes.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type RadioElement = React.ElementRef<'input'>
type RadioOwnProps = GetPropDefTypes<typeof radioPropDefs> & {
  value: string
  onValueChange?: (value: string) => void
}
type RadioInputProps = ComponentPropsWithout<
  'input',
  NotInputRadioAttributes | 'color' | 'defaultValue' | 'value'
>
interface RadioProps extends RadioInputProps, MarginProps, RadioOwnProps {}

const Radio = React.forwardRef<RadioElement, RadioProps>((props, forwardedRef) => {
  const {
    className,
    color,
    onChange: _onChange,
    onValueChange: _onValueChange,
    ...radioProps
  } = extractProps(props, radioPropDefs, marginPropDefs)
  return (
    <input
      type="radio"
      data-accent-color={color}
      {...radioProps}
      onChange={composeEventHandlers(
        (event) => props.onChange?.(event),
        (event) => {
          const target = event.currentTarget as HTMLInputElement | null
          if (!target) return
          props.onValueChange?.(target.value)
        },
      )}
      ref={React.coerceRef(forwardedRef)}
      class={classNames('rt-reset', 'rt-BaseRadioRoot', 'rt-RadioRoot', className)}
    />
  )
})
Radio.displayName = 'Radio'

export { Radio }
export type { RadioProps }
