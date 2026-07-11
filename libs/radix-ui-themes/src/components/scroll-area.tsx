import { prop } from 'fict'
import { reactive } from 'fict/advanced'
import * as React from '../helpers/element.js'
import { ScrollArea as ScrollAreaPrimitive } from '@fictjs/radix-ui'

import { scrollAreaPropDefs } from './scroll-area.props.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { extractProps, readPropValue } from '../helpers/extract-props.js'
import { getResponsiveClassNames } from '../helpers/get-responsive-styles.js'
import { getSubtree } from '../helpers/get-subtree.js'
import { renderWithAsChild } from '../helpers/render-with-as-child.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { MarginProps } from '../props/margin.props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type ScrollAreaElement = React.ElementRef<typeof ScrollAreaPrimitive.Viewport>
type ScrollAreaOwnProps = GetPropDefTypes<typeof scrollAreaPropDefs>
interface ScrollAreaProps
  extends
    ComponentPropsWithout<typeof ScrollAreaPrimitive.Root, RemovedProps>,
    ComponentPropsWithout<typeof ScrollAreaPrimitive.Viewport, RemovedProps | 'dir'>,
    MarginProps,
    ScrollAreaOwnProps {}
const ScrollArea = React.forwardRef<ScrollAreaElement, ScrollAreaProps>((props, forwardedRef) => {
  const {
    asChild: _asChild,
    children,
    className,
    style,
    dir,
    type,
    scrollHideDelay,
    size,
    radius,
    scrollbars,
    ...viewportProps
  } = extractProps(props, marginPropDefs)

  const currentSize = prop(() => readPropValue(size) ?? scrollAreaPropDefs.size.default)
  const sizeClassName = prop(() =>
    getResponsiveClassNames({
      className: 'rt-r-size',
      value: currentSize(),
      propValues: scrollAreaPropDefs.size.values,
    }),
  )
  const currentRadius = prop(() => readPropValue(radius) ?? scrollAreaPropDefs.radius.default)
  const currentScrollbars = prop(
    () => readPropValue(scrollbars) ?? scrollAreaPropDefs.scrollbars.default,
  )
  const currentScrollHideDelay = prop(() => {
    const explicitDelay = readPropValue(scrollHideDelay) as number | undefined
    if (explicitDelay !== undefined) return explicitDelay
    return (readPropValue(type) as string | undefined) !== 'scroll' ? 0 : undefined
  })

  const renderContent = (innerChildren: React.ReactNode) => [
    <ScrollAreaPrimitive.Viewport
      {...viewportProps}
      ref={React.coerceRef(forwardedRef)}
      class="rt-ScrollAreaViewport"
    >
      {innerChildren}
    </ScrollAreaPrimitive.Viewport>,
    <div class="rt-ScrollAreaViewportFocusRing" />,
    reactive(() =>
      currentScrollbars() !== 'vertical' ? (
        <ScrollAreaPrimitive.Scrollbar
          data-radius={currentRadius}
          orientation="horizontal"
          class={classNames('rt-ScrollAreaScrollbar', sizeClassName)}
        >
          <ScrollAreaPrimitive.Thumb class="rt-ScrollAreaThumb" />
        </ScrollAreaPrimitive.Scrollbar>
      ) : null,
    ) as unknown as React.ReactNode,
    reactive(() =>
      currentScrollbars() !== 'horizontal' ? (
        <ScrollAreaPrimitive.Scrollbar
          data-radius={currentRadius}
          orientation="vertical"
          class={classNames('rt-ScrollAreaScrollbar', sizeClassName)}
        >
          <ScrollAreaPrimitive.Thumb class="rt-ScrollAreaThumb" />
        </ScrollAreaPrimitive.Scrollbar>
      ) : null,
    ) as unknown as React.ReactNode,
    reactive(() =>
      currentScrollbars() === 'both' ? (
        <ScrollAreaPrimitive.Corner class="rt-ScrollAreaCorner" />
      ) : null,
    ) as unknown as React.ReactNode,
  ]

  return renderWithAsChild(props, (asChild) => (
    <ScrollAreaPrimitive.Root
      class={classNames('rt-ScrollAreaRoot', className)}
      style={style}
      asChild={asChild}
      dir={dir}
      type={type}
      scrollHideDelay={currentScrollHideDelay}
    >
      {asChild
        ? getSubtree({ asChild, children: readPropValue(children) }, (innerChildren) =>
            renderContent(innerChildren),
          )
        : renderContent(children as unknown as React.ReactNode)}
    </ScrollAreaPrimitive.Root>
  ))
})
ScrollArea.displayName = 'ScrollArea'

export { ScrollArea }
export type { ScrollAreaProps }
