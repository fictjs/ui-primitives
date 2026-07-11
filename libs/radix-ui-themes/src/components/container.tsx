import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { mergeProps, prop } from 'fict'
import { Slot } from '@fictjs/radix-ui'

import { containerPropDefs } from './container.props.js'
import { extractProps, readPropValue } from '../helpers/extract-props.js'
import { getSubtree } from '../helpers/get-subtree.js'
import { renderWithAsChild } from '../helpers/render-with-as-child.js'
import { heightPropDefs } from '../props/height.props.js'
import { layoutPropDefs } from '../props/layout.props.js'
import { marginPropDefs } from '../props/margin.props.js'
import { widthPropDefs } from '../props/width.props.js'

import type { LayoutProps } from '../props/layout.props.js'
import type { MarginProps } from '../props/margin.props.js'
import type { ContainerOwnProps } from './container.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'

type ContainerElement = React.ElementRef<'div'>
interface ContainerProps
  extends ComponentPropsWithout<'div', RemovedProps>, MarginProps, LayoutProps, ContainerOwnProps {}
const Container = React.forwardRef<ContainerElement, ContainerProps>((props, forwardedRef) => {
  const {
    asChild: _asChild,
    children,
    className,
    ...containerProps
  } = extractProps(
    mergeProps(
      prop(() => props as unknown as Record<string, unknown>),
      {
        height: undefined,
        maxHeight: undefined,
        maxWidth: undefined,
        minHeight: undefined,
        minWidth: undefined,
        width: undefined,
      },
    ) as unknown as ContainerProps,
    containerPropDefs,
    layoutPropDefs,
    marginPropDefs,
  )

  const { className: innerClassName, style: innerStyle } = extractProps(
    {
      width: prop(() => props.width),
      minWidth: prop(() => props.minWidth),
      maxWidth: prop(() => props.maxWidth),
      height: prop(() => props.height),
      minHeight: prop(() => props.minHeight),
      maxHeight: prop(() => props.maxHeight),
    },
    widthPropDefs,
    heightPropDefs,
  )

  const renderInner = (innerChildren: React.ReactNode) => (
    <div class={classNames('rt-ContainerInner', innerClassName)} style={innerStyle}>
      {innerChildren}
    </div>
  )

  return renderWithAsChild(props, (asChild) => {
    const Comp = asChild ? Slot.Root : 'div'
    return (
      <Comp
        {...containerProps}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-Container', className)}
      >
        {asChild
          ? getSubtree({ asChild, children: readPropValue(children) }, (innerChildren) =>
              renderInner(innerChildren),
            )
          : renderInner(children as unknown as React.ReactNode)}
      </Comp>
    )
  })
})
Container.displayName = 'Container'

export { Container }
export type { ContainerProps }
