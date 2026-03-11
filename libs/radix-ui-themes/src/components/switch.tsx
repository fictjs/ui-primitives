import * as React from '../helpers/element.js';
import classNames from 'classnames';
import { Switch as SwitchPrimitive } from '@fictjs/radix-ui';

import { extractProps } from '../helpers/extract-props.js';
import { marginPropDefs } from '../props/margin.props.js';
import { switchPropDefs } from './switch.props.js';

import type { MarginProps } from '../props/margin.props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import type { ComponentPropsWithout } from '../helpers/component-props.js';

type SwitchElement = React.ElementRef<typeof SwitchPrimitive.Root>;
type SwitchOwnProps = GetPropDefTypes<typeof switchPropDefs>;
interface SwitchProps
  extends
    ComponentPropsWithout<
      typeof SwitchPrimitive.Root,
      'asChild' | 'color' | 'defaultValue' | 'children'
    >,
    MarginProps,
    SwitchOwnProps {}
const Switch = React.forwardRef<SwitchElement, SwitchProps>((props, forwardedRef) => {
  const { className, color, radius, ...switchProps } = extractProps(
    props,
    switchPropDefs,
    marginPropDefs,
  );
  return (
    <SwitchPrimitive.Root
      data-accent-color={color}
      data-radius={radius}
      {...switchProps}
     
      ref={React.coerceRef(forwardedRef)}
      class={classNames('rt-reset', 'rt-SwitchRoot', className)}
    >
      <SwitchPrimitive.Thumb
        class={classNames('rt-SwitchThumb', { 'rt-high-contrast': props.highContrast })}
      />
    </SwitchPrimitive.Root>
  );
});
Switch.displayName = 'Switch';

export { Switch };
export type { SwitchProps };
