import * as React from '../helpers/element.js';
import { mergeProps, prop } from 'fict';
import classNames from 'classnames';
import { Popover as PopoverPrimitive } from '@fictjs/radix-ui';

import { extractProps } from '../helpers/extract-props.js';
import { requireReactElement } from '../helpers/require-react-element.js';
import { popoverContentPropDefs } from './popover.props.js';
import { ThemeContext, useThemeContext } from './theme.js';

import type { PopoverContentOwnProps } from './popover.props.js';
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js';

interface PopoverRootProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> {}
const PopoverRoot: React.FC<PopoverRootProps> = (props: PopoverRootProps) => (
  <PopoverPrimitive.Root {...mergeProps(prop(() => props as Record<string, unknown>))} />
);
PopoverRoot.displayName = 'Popover.Root';

type PopoverTriggerElement = React.ElementRef<typeof PopoverPrimitive.Trigger>;
interface PopoverTriggerProps extends ComponentPropsWithout<
  typeof PopoverPrimitive.Trigger,
  RemovedProps
> {}
const PopoverTrigger = React.forwardRef<PopoverTriggerElement, PopoverTriggerProps>(
  (props, forwardedRef) => (
    <PopoverPrimitive.Trigger
      {...mergeProps(prop(() => props as Record<string, unknown>), {
        asChild: true,
        children: undefined,
        ref: undefined,
      })}
      ref={React.coerceRef(forwardedRef)}
    >
      {requireReactElement((props as { children?: React.ReactNode }).children)}
    </PopoverPrimitive.Trigger>
  ),
);
PopoverTrigger.displayName = 'Popover.Trigger';

type PopoverContentElement = React.ElementRef<typeof PopoverPrimitive.Content>;
interface PopoverContentProps
  extends
    ComponentPropsWithout<typeof PopoverPrimitive.Content, RemovedProps>,
    PopoverContentOwnProps {
  container?: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Portal>['container'];
}
const PopoverContent = React.forwardRef<PopoverContentElement, PopoverContentProps>(
  (props, forwardedRef) => {
    const themeContext = useThemeContext();
    const { className, forceMount, container, children, ...contentProps } = extractProps(
      props,
      popoverContentPropDefs,
    );
    return (
      <PopoverPrimitive.Portal container={container} forceMount={forceMount}>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          collisionPadding={10}
          {...contentProps}
          ref={React.coerceRef(forwardedRef)}
          data-is-root-theme="false"
          data-accent-color={prop(() => themeContext.accentColor)}
          data-gray-color={prop(() => themeContext.resolvedGrayColor)}
          data-has-background="false"
          data-panel-background={prop(() => themeContext.panelBackground)}
          data-radius={prop(() => themeContext.radius)}
          data-scaling={prop(() => themeContext.scaling)}
          class={
            prop(() =>
              classNames(
                'radix-themes',
                {
                  light: themeContext.appearance === 'light',
                  dark: themeContext.appearance === 'dark',
                },
                'rt-PopperContent',
                'rt-PopoverContent',
                className,
              ),
            ) as unknown as string
          }
        >
          <ThemeContext.Provider value={themeContext}>{children}</ThemeContext.Provider>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    );
  },
);
PopoverContent.displayName = 'Popover.Content';

type PopoverCloseElement = React.ElementRef<typeof PopoverPrimitive.Close>;
interface PopoverCloseProps extends ComponentPropsWithout<
  typeof PopoverPrimitive.Close,
  RemovedProps
> {}
const PopoverClose = React.forwardRef<PopoverCloseElement, PopoverCloseProps>(
  (props, forwardedRef) => (
    <PopoverPrimitive.Close
      {...mergeProps(prop(() => props as Record<string, unknown>), {
        asChild: true,
        children: undefined,
        ref: undefined,
      })}
      ref={React.coerceRef(forwardedRef)}
    >
      {requireReactElement((props as { children?: React.ReactNode }).children)}
    </PopoverPrimitive.Close>
  ),
);
PopoverClose.displayName = 'Popover.Close';

type PopoverAnchorElement = React.ElementRef<typeof PopoverPrimitive.Anchor>;
interface PopoverAnchorProps extends React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Anchor
> {}
const PopoverAnchor = React.forwardRef<PopoverAnchorElement, PopoverAnchorProps>(
  (props, forwardedRef) => (
    <PopoverPrimitive.Anchor
      {...mergeProps(prop(() => props as Record<string, unknown>), {
        ref: undefined,
      })}
      ref={React.coerceRef(forwardedRef)}
    />
  ),
);

PopoverAnchor.displayName = 'Popover.Anchor';

export {
  PopoverRoot as Root,
  PopoverContent as Content,
  PopoverTrigger as Trigger,
  PopoverClose as Close,
  PopoverAnchor as Anchor,
};
export type {
  PopoverRootProps as RootProps,
  PopoverContentProps as ContentProps,
  PopoverTriggerProps as TriggerProps,
  PopoverCloseProps as CloseProps,
  PopoverAnchorProps as AnchorProps,
};
