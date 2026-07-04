import * as React from '../helpers/element.js'
import classNames from 'classnames'
import { Slot } from '@fictjs/radix-ui'

import { emPropDefs } from './em.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { renderChildren } from '../helpers/render-children.js'

import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type EmElement = React.ElementRef<'em'>
type EmOwnProps = GetPropDefTypes<typeof emPropDefs>
interface EmProps extends ComponentPropsWithout<'em', RemovedProps>, EmOwnProps {}
const Em = React.forwardRef<EmElement, EmProps>((props, forwardedRef) => {
  const { asChild, children: _children, className, ...emProps } = extractProps(props, emPropDefs)
  const Comp = asChild ? Slot.Root : 'em'
  return (
    <Comp {...emProps} ref={React.coerceRef(forwardedRef)} class={classNames('rt-Em', className)}>
      {renderChildren(props.children)}
    </Comp>
  )
})
Em.displayName = 'Em'

export { Em }
export type { EmProps }
