import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { Slot } from '@fictjs/radix-ui'

import { emPropDefs } from './em.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { renderChildren } from '../helpers/render-children.js'
import { renderWithAsChild } from '../helpers/render-with-as-child.js'

import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type EmElement = React.ElementRef<'em'>
type EmOwnProps = GetPropDefTypes<typeof emPropDefs>
interface EmProps extends ComponentPropsWithout<'em', RemovedProps>, EmOwnProps {}
const Em = React.forwardRef<EmElement, EmProps>((props, forwardedRef) => {
  const { asChild: _asChild, children, className, ...emProps } = extractProps(props, emPropDefs)
  return renderWithAsChild(props, (asChild) => {
    const Comp = asChild ? Slot.Root : 'em'
    return (
      <Comp {...emProps} ref={React.coerceRef(forwardedRef)} class={classNames('rt-Em', className)}>
        {renderChildren(children)}
      </Comp>
    )
  })
})
Em.displayName = 'Em'

export { Em }
export type { EmProps }
