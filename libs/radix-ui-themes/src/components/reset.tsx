import * as React from '../helpers/element.js';
import classNames from 'classnames';
import { Slot } from '@fictjs/radix-ui';

import { requireReactElement } from '../helpers/require-react-element.js';

import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js';

interface ResetProps extends ComponentPropsWithout<typeof Slot.Root, RemovedProps> {}
const Reset = React.forwardRef<Element, ResetProps>(
  ({ className, children, ...props }, _forwardedRef) => {
    return (
      <Slot.Root {...props} class={classNames('rt-reset', className)}>
        {requireReactElement(children)}
      </Slot.Root>
    );
  },
);
Reset.displayName = 'Reset';

export { Reset };
export type { ResetProps };
