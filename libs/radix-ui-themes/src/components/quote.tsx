import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { Slot } from '@fictjs/radix-ui'

import { quotePropDefs } from './quote.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { renderChildren } from '../helpers/render-children.js'
import { renderWithAsChild } from '../helpers/render-with-as-child.js'

import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type QuoteElement = React.ElementRef<'q'>
type QuoteOwnProps = GetPropDefTypes<typeof quotePropDefs>
interface QuoteProps extends ComponentPropsWithout<'q', RemovedProps>, QuoteOwnProps {}
const Quote = React.forwardRef<QuoteElement, QuoteProps>((props, forwardedRef) => {
  const {
    asChild: _asChild,
    children,
    className,
    ...quoteProps
  } = extractProps(props, quotePropDefs)
  return renderWithAsChild(props, (asChild) => {
    const Comp = asChild ? Slot.Root : 'q'
    return (
      <Comp
        {...quoteProps}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-Quote', className)}
      >
        {renderChildren(children)}
      </Comp>
    )
  })
})
Quote.displayName = 'Quote'

export { Quote }
export type { QuoteProps }
