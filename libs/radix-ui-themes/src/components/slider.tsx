import * as React from '../helpers/element.js'
import { prop } from 'fict'
import { classNames } from '../helpers/reactive-class-names.js'
import { Slider as SliderPrimitive } from '@fictjs/radix-ui'

import { sliderPropDefs } from './slider.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type SliderElement = React.ElementRef<typeof SliderPrimitive.Root>
type SliderOwnProps = GetPropDefTypes<typeof sliderPropDefs>
interface SliderProps
  extends
    ComponentPropsWithout<
      typeof SliderPrimitive.Root,
      'asChild' | 'color' | 'children' | 'defaultChecked'
    >,
    MarginProps,
    SliderOwnProps {}

type MaybeAccessor<T> = T | (() => T)

function readMaybeAccessor<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value
}

const Slider = React.forwardRef<SliderElement, SliderProps>((props, forwardedRef) => {
  const { className, color, radius, tabIndex, ...sliderProps } = extractProps(
    props,
    sliderPropDefs,
    marginPropDefs,
  )
  return (
    <SliderPrimitive.Root
      data-accent-color={color}
      data-radius={radius}
      ref={React.coerceRef(forwardedRef)}
      {...sliderProps}
      class={classNames('rt-SliderRoot', className)}
    >
      <SliderPrimitive.Track class="rt-SliderTrack">
        <SliderPrimitive.Range
          class={classNames('rt-SliderRange', {
            'rt-high-contrast': prop(() => props.highContrast),
          })}
          data-inverted={sliderProps.inverted ? '' : undefined}
        />
      </SliderPrimitive.Track>
      {(
        (sliderProps.value !== undefined
          ? readMaybeAccessor(sliderProps.value as MaybeAccessor<number[] | undefined>)
          : undefined) ??
        (sliderProps.defaultValue !== undefined
          ? readMaybeAccessor(sliderProps.defaultValue as MaybeAccessor<number[] | undefined>)
          : undefined) ??
        []
      ).map((value: number, index: number) => (
        <SliderPrimitive.Thumb
          key={index}
          class="rt-SliderThumb"
          {...(tabIndex !== undefined ? { tabIndex } : undefined)}
        />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = 'Slider'

export { Slider }
export type { SliderProps }
