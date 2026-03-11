import * as React from '../helpers/element.js';
import classNames from 'classnames';
import { Slot } from '@fictjs/radix-ui';

import { containerPropDefs } from './container.props.js';
import { extractProps } from '../helpers/extract-props.js';
import { getSubtree } from '../helpers/get-subtree.js';
import { heightPropDefs } from '../props/height.props.js';
import { layoutPropDefs } from '../props/layout.props.js';
import { marginPropDefs } from '../props/margin.props.js';
import { widthPropDefs } from '../props/width.props.js';

import type { LayoutProps } from '../props/layout.props.js';
import type { MarginProps } from '../props/margin.props.js';
import type { ContainerOwnProps } from './container.props.js';
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js';

type ContainerElement = React.ElementRef<'div'>;
interface ContainerProps
  extends ComponentPropsWithout<'div', RemovedProps>, MarginProps, LayoutProps, ContainerOwnProps {}
const Container = React.forwardRef<ContainerElement, ContainerProps>(
  ({ width, minWidth, maxWidth, height, minHeight, maxHeight, ...props }, forwardedRef) => {
    const { asChild, children, className, ...containerProps } = extractProps(
      props,
      containerPropDefs,
      layoutPropDefs,
      marginPropDefs,
    );

    const { className: innerClassName, style: innerStyle } = extractProps(
      { width, minWidth, maxWidth, height, minHeight, maxHeight },
      widthPropDefs,
      heightPropDefs,
    );

    const Comp = asChild ? Slot.Root : 'div';

    return (
      <Comp
        {...containerProps}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-Container', className)}
      >
        {getSubtree({ asChild, children }, (children) => (
          <div class={classNames('rt-ContainerInner', innerClassName)} style={innerStyle}>
            {children}
          </div>
        ))}
      </Comp>
    );
  },
);
Container.displayName = 'Container';

export { Container };
export type { ContainerProps };
