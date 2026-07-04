import * as React from '../helpers/element.js'
import classNames from 'classnames'
import { Slot } from '@fictjs/radix-ui'

import { sectionPropDefs } from './section.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { renderChildren } from '../helpers/render-children.js'
import { layoutPropDefs } from '../props/layout.props.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { LayoutProps } from '../props/layout.props.js'
import type { MarginProps } from '../props/margin.props.js'
import type { SectionOwnProps } from './section.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'

type SectionElement = React.ElementRef<'div'>
interface SectionProps
  extends ComponentPropsWithout<'div', RemovedProps>, MarginProps, LayoutProps, SectionOwnProps {}
const Section = React.forwardRef<SectionElement, SectionProps>((props, forwardedRef) => {
  const {
    asChild,
    children: _children,
    className,
    ...sectionProps
  } = extractProps(props, sectionPropDefs, layoutPropDefs, marginPropDefs)
  const Comp = asChild ? Slot.Root : 'section'
  return (
    <Comp
      {...sectionProps}
      ref={React.coerceRef(forwardedRef)}
      class={classNames('rt-Section', className)}
    >
      {renderChildren(props.children)}
    </Comp>
  )
})
Section.displayName = 'Section'

export { Section }
export type { SectionProps }
