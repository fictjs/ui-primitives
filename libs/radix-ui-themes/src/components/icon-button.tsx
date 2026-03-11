import * as React from '../helpers/element.js';
import classNames from 'classnames';

import { BaseButton } from './_internal/base-button.js';

type IconButtonElement = React.ElementRef<typeof BaseButton>;
interface IconButtonProps extends React.ComponentPropsWithoutRef<typeof BaseButton> {}
const IconButton = React.forwardRef<IconButtonElement, IconButtonProps>(
  ({ className, ...props }, forwardedRef) => (
    <BaseButton {...props} ref={React.coerceRef(forwardedRef)} class={classNames('rt-IconButton', className)} />
  ),
);
IconButton.displayName = 'IconButton';

export { IconButton };
export type { IconButtonProps };
