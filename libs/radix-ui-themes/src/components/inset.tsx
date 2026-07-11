import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { Slot } from '@fictjs/radix-ui'

import { insetPropDefs } from './inset.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { renderChildren } from '../helpers/render-children.js'
import { renderWithAsChild } from '../helpers/render-with-as-child.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type InsetElement = React.ElementRef<'div'>
type InsetOwnProps = GetPropDefTypes<typeof insetPropDefs>
interface InsetProps
  extends ComponentPropsWithout<'div', RemovedProps>, MarginProps, InsetOwnProps {}

const Inset = React.forwardRef<InsetElement, InsetProps>((props, forwardedRef) => {
  const {
    asChild: _asChild,
    children,
    className,
    ...insetProps
  } = extractProps(props, insetPropDefs, marginPropDefs)
  return renderWithAsChild(props, (asChild) => {
    const Comp = asChild ? Slot.Root : 'div'
    return (
      <Comp
        {...insetProps}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-Inset', className)}
      >
        {renderChildren(children)}
      </Comp>
    )
  })
})
Inset.displayName = 'Inset'

export { Inset }
export type { InsetProps }
