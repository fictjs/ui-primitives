import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { mergeProps, prop } from 'fict'

import { textAreaPropDefs } from './text-area.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type TextAreaElement = React.ElementRef<'textarea'>
type TextAreaOwnProps = GetPropDefTypes<typeof textAreaPropDefs> & {
  defaultValue?: string
  readOnly?: boolean
  value?: string
}
interface TextAreaProps
  extends
    ComponentPropsWithout<'textarea', RemovedProps | 'size' | 'value'>,
    MarginProps,
    TextAreaOwnProps {}
const TextArea = React.forwardRef<TextAreaElement, TextAreaProps>((props, forwardedRef) => {
  const normalizedProps = mergeProps(
    prop(() => props as unknown as Record<string, unknown>),
    {
      readOnly: undefined,
      readonly: prop(
        () => props.readOnly ?? (props as TextAreaProps & { readonly?: boolean }).readonly,
      ),
    },
  ) as unknown as TextAreaProps & { readonly?: boolean }
  const extractedProps = extractProps(normalizedProps, textAreaPropDefs, marginPropDefs)
  const textAreaProps = mergeProps(
    prop(() => extractedProps as unknown as Record<string, unknown>),
    {
      className: undefined,
      color: undefined,
      radius: undefined,
      style: undefined,
    },
  )
  return (
    <div
      data-accent-color={extractedProps.color}
      data-radius={extractedProps.radius}
      class={classNames('rt-TextAreaRoot', extractedProps.className)}
      style={extractedProps.style}
    >
      <textarea
        {...textAreaProps}
        class="rt-reset rt-TextAreaInput"
        ref={React.coerceRef(forwardedRef)}
      />
    </div>
  )
})
TextArea.displayName = 'TextArea'

export { TextArea }
export type { TextAreaProps }
