import * as React from '../helpers/element.js'
import { prop } from 'fict'
import { classNames } from '../helpers/reactive-class-names.js'
import { Slot } from '@fictjs/radix-ui'

import { codePropDefs } from './code.props.js'
import { extractProps, readPropValue } from '../helpers/extract-props.js'
import { renderChildren } from '../helpers/render-children.js'
import { renderWithAsChild } from '../helpers/render-with-as-child.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type CodeElement = React.ElementRef<'code'>
type CodeOwnProps = GetPropDefTypes<typeof codePropDefs>
interface CodeProps
  extends ComponentPropsWithout<'code', RemovedProps>, MarginProps, CodeOwnProps {}
const Code = React.forwardRef<CodeElement, CodeProps>((props, forwardedRef) => {
  const {
    asChild: _asChild,
    children,
    className,
    color,
    ...codeProps
  } = extractProps(props, codePropDefs, marginPropDefs)
  // Code ghost color prop should work as text color by default
  const resolvedColor = prop(() => {
    const currentColor = readPropValue(color)
    return props.variant === 'ghost' ? currentColor || undefined : currentColor
  })
  return renderWithAsChild(props, (asChild) => {
    const Comp = asChild ? Slot.Root : 'code'
    return (
      <Comp
        data-accent-color={resolvedColor}
        {...codeProps}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-reset', 'rt-Code', className)}
      >
        {renderChildren(children)}
      </Comp>
    )
  })
})
Code.displayName = 'Code'

export { Code }
export type { CodeProps }
