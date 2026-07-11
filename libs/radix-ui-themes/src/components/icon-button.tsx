import * as React from '../helpers/element.js'
import { mergeProps, prop } from 'fict'

import { BaseButton } from './_internal/base-button.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { renderChildren } from '../helpers/render-children.js'

type IconButtonElement = React.ElementRef<typeof BaseButton>
interface IconButtonProps extends React.ComponentPropsWithoutRef<typeof BaseButton> {}
const IconButton = React.forwardRef<IconButtonElement, IconButtonProps>((props, forwardedRef) => (
  <BaseButton
    {...mergeProps(prop(() => props as Record<string, unknown>))}
    ref={React.coerceRef(forwardedRef)}
    className={classNames(
      'rt-IconButton',
      prop(() => (props as { className?: string }).className),
    )}
  >
    {
      prop(() =>
        renderChildren((props as { children?: React.ReactNode }).children),
      ) as unknown as React.ReactNode
    }
  </BaseButton>
))
IconButton.displayName = 'IconButton'

export { IconButton }
export type { IconButtonProps }
