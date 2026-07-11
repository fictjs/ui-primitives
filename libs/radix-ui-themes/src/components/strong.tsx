import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { Slot } from '@fictjs/radix-ui'

import { extractProps } from '../helpers/extract-props.js'
import { renderChildren } from '../helpers/render-children.js'
import { renderWithAsChild } from '../helpers/render-with-as-child.js'
import { strongPropDefs } from './strong.props.js'

import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type StrongElement = React.ElementRef<'strong'>
type StrongOwnProps = GetPropDefTypes<typeof strongPropDefs>
interface StrongProps extends ComponentPropsWithout<'strong', RemovedProps>, StrongOwnProps {}
const Strong = React.forwardRef<StrongElement, StrongProps>((props, forwardedRef) => {
  const {
    asChild: _asChild,
    children,
    className,
    ...strongProps
  } = extractProps(props, strongPropDefs)
  return renderWithAsChild(props, (asChild) => {
    const Comp = asChild ? Slot.Root : 'strong'
    return (
      <Comp
        {...strongProps}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-Strong', className)}
      >
        {renderChildren(children)}
      </Comp>
    )
  })
})
Strong.displayName = 'Strong'

export { Strong }
export type { StrongProps }
