import * as React from '../helpers/element.js'
import { mergeProps, prop } from 'fict'
import classNames from 'classnames'
import { Slot } from '@fictjs/radix-ui'

import { requireReactElement } from '../helpers/require-react-element.js'

import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'

interface ResetProps extends ComponentPropsWithout<typeof Slot.Root, RemovedProps> {}
const Reset = React.forwardRef<Element, ResetProps>((props, _forwardedRef) => {
  const slotProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      className: undefined,
      children: undefined,
    },
  )
  return (
    <Slot.Root
      {...slotProps}
      class={prop(() => classNames('rt-reset', props.className)) as unknown as string}
    >
      {requireReactElement(props.children)}
    </Slot.Root>
  )
})
Reset.displayName = 'Reset'

export { Reset }
export type { ResetProps }
