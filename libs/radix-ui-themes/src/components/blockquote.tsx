import * as React from '../helpers/element.js'
import classNames from 'classnames'
import { Slot } from '@fictjs/radix-ui'
import { mergeProps, prop } from 'fict'

import { Text } from './text.js'

import type { blockquotePropDefs } from './blockquote.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { MarginProps } from '../props/margin.props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type BlockquoteElement = React.ElementRef<'blockquote'>
type BlockQuoteOwnProps = GetPropDefTypes<typeof blockquotePropDefs>
interface BlockquoteProps
  extends ComponentPropsWithout<'blockquote', RemovedProps>, MarginProps, BlockQuoteOwnProps {}
const Blockquote = React.forwardRef<BlockquoteElement, BlockquoteProps>((props, forwardedRef) => {
  const blockquoteProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      asChild: undefined,
      children: undefined,
      className: undefined,
    },
  )
  const Comp = props.asChild ? Slot.Root : 'blockquote'
  return (
    <Text
      asChild
      {...blockquoteProps}
      ref={React.coerceRef(forwardedRef)}
      className={prop(() => classNames('rt-Blockquote', props.className)) as unknown as string}
    >
      <Comp>{props.children}</Comp>
    </Text>
  )
})
Blockquote.displayName = 'Blockquote'

export { Blockquote }
export type { BlockquoteProps }
