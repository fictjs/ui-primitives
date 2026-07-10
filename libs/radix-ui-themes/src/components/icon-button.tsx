import * as React from '../helpers/element.js'
import { mergeProps, prop } from 'fict'
import classNames from 'classnames'

import { BaseButton } from './_internal/base-button.js'
import { renderChildren } from '../helpers/render-children.js'

type IconButtonElement = React.ElementRef<typeof BaseButton>
interface IconButtonProps extends React.ComponentPropsWithoutRef<typeof BaseButton> {}
const IconButton = React.forwardRef<IconButtonElement, IconButtonProps>((props, forwardedRef) => (
  <BaseButton
    {...mergeProps(prop(() => props as Record<string, unknown>))}
    ref={React.coerceRef(forwardedRef)}
    className={classNames('rt-IconButton', (props as { className?: string }).className)}
  >
    {renderChildren((props as { children?: React.ReactNode }).children)}
  </BaseButton>
))
IconButton.displayName = 'IconButton'

export { IconButton }
export type { IconButtonProps }
