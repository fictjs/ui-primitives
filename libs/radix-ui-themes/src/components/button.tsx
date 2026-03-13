import { mergeProps } from 'fict'
import * as React from '../helpers/element.js';
import classNames from 'classnames';

import { BaseButton } from './_internal/base-button.js';

type ButtonElement = React.ElementRef<typeof BaseButton>;
interface ButtonProps extends React.ComponentPropsWithoutRef<typeof BaseButton> {}
const Button = React.forwardRef<ButtonElement, ButtonProps>(
  (props, forwardedRef) => (
    <BaseButton
      {...mergeProps(
        () => props as Record<string, unknown>,
        {
          class: classNames('rt-Button', (props as { className?: string }).className),
        },
      )}
      ref={React.coerceRef(forwardedRef)}
    />
  ),
);
Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
