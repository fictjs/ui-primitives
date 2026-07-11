import { mergeProps, prop } from 'fict'
import * as React from '../helpers/element.js'

import { BaseButton } from './_internal/base-button.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { renderChildren } from '../helpers/render-children.js'

type ButtonElement = React.ElementRef<typeof BaseButton>
interface ButtonProps extends React.ComponentPropsWithoutRef<typeof BaseButton> {}
const Button = React.forwardRef<ButtonElement, ButtonProps>((props, forwardedRef) => (
  <BaseButton
    {...mergeProps(
      prop(() => props as Record<string, unknown>),
      {
        className: classNames(
          'rt-Button',
          prop(() => (props as { className?: string }).className),
        ),
      },
    )}
    ref={React.coerceRef(forwardedRef)}
  >
    {
      prop(() =>
        renderChildren((props as { children?: React.ReactNode }).children),
      ) as unknown as React.ReactNode
    }
  </BaseButton>
))
Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
