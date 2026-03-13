import { mergeProps } from 'fict'
import * as React from '../helpers/element.js';
import classNames from 'classnames';

import { BaseButton } from './_internal/base-button.js';
import { renderChildren } from '../helpers/render-children.js';

type ButtonElement = React.ElementRef<typeof BaseButton>;
interface ButtonProps extends React.ComponentPropsWithoutRef<typeof BaseButton> {}
const Button = React.forwardRef<ButtonElement, ButtonProps>(
  (props, forwardedRef) => (
    <BaseButton
      {...mergeProps(
        () => props as Record<string, unknown>,
        {
          className: classNames('rt-Button', (props as { className?: string }).className),
        },
      )}
      ref={React.coerceRef(forwardedRef)}
    >
      {renderChildren((props as { children?: React.ReactNode }).children)}
    </BaseButton>
  ),
);
Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
