import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'

import { Text } from './text.js'
import { extractProps, readPropValue } from '../helpers/extract-props.js'
import { renderWithAsChild } from '../helpers/render-with-as-child.js'
import { linkPropDefs } from './link.props.js'

import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { MarginProps } from '../props/margin.props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type LinkElement = React.ElementRef<'a'>
type LinkOwnProps = GetPropDefTypes<typeof linkPropDefs>
interface LinkProps extends ComponentPropsWithout<'a', RemovedProps>, MarginProps, LinkOwnProps {}
const Link = React.forwardRef<LinkElement, LinkProps>((props, forwardedRef) => {
  const {
    children,
    className,
    color,
    asChild: _asChild,
    ...linkProps
  } = extractProps(props, linkPropDefs)
  return renderWithAsChild(props, (asChild) => (
    <Text
      {...linkProps}
      data-accent-color={color}
      ref={React.coerceRef(forwardedRef)}
      asChild
      className={classNames('rt-reset', 'rt-Link', className)}
    >
      {asChild ? readPropValue(children) : <a>{children as unknown as React.ReactNode}</a>}
    </Text>
  ))
})
Link.displayName = 'Link'

export { Link }
export type { LinkProps }
