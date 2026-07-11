import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { Slot } from '@fictjs/radix-ui'

import { kbdPropDefs } from './kbd.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { renderChildren } from '../helpers/render-children.js'
import { renderWithAsChild } from '../helpers/render-with-as-child.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type KbdElement = React.ElementRef<'kbd'>
type KbdOwnProps = GetPropDefTypes<typeof kbdPropDefs>
interface KbdProps extends ComponentPropsWithout<'kbd', RemovedProps>, MarginProps, KbdOwnProps {}
const Kbd = React.forwardRef<KbdElement, KbdProps>((props, forwardedRef) => {
  const {
    asChild: _asChild,
    children,
    className,
    ...kbdProps
  } = extractProps(props, kbdPropDefs, marginPropDefs)
  return renderWithAsChild(props, (asChild) => {
    const Comp = asChild ? Slot.Root : 'kbd'
    return (
      <Comp
        {...kbdProps}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-reset', 'rt-Kbd', className)}
      >
        {renderChildren(children)}
      </Comp>
    )
  })
})
Kbd.displayName = 'Kbd'

export { Kbd }
export type { KbdProps }
