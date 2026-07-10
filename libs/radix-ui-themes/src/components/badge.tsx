import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { Slot } from '@fictjs/radix-ui'

import { badgePropDefs } from './badge.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { renderChildren } from '../helpers/render-children.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type BadgeElement = React.ElementRef<'span'>
type BadgeOwnProps = GetPropDefTypes<typeof badgePropDefs>
interface BadgeProps
  extends ComponentPropsWithout<'span', RemovedProps>, MarginProps, BadgeOwnProps {}
const Badge = React.forwardRef<BadgeElement, BadgeProps>((props, forwardedRef) => {
  const {
    asChild,
    children: _children,
    className,
    color,
    radius,
    ...badgeProps
  } = extractProps(props, badgePropDefs, marginPropDefs)
  const Comp = asChild ? Slot.Root : 'span'
  return (
    <Comp
      data-accent-color={color}
      data-radius={radius}
      {...badgeProps}
      ref={React.coerceRef(forwardedRef)}
      class={classNames('rt-reset', 'rt-Badge', className)}
    >
      {renderChildren(props.children)}
    </Comp>
  )
})
Badge.displayName = 'Badge'

export { Badge }
export type { BadgeProps }
