import * as React from '../helpers/element.js'
import { mergeProps, prop } from 'fict'
import { classNames } from '../helpers/reactive-class-names.js'
import { HoverCard as HoverCardPrimitive } from '@fictjs/radix-ui'

import { hoverCardContentPropDefs } from './hover-card.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { requireReactElement } from '../helpers/require-react-element.js'
import { Theme } from './theme.js'

import type { HoverCardContentOwnProps } from './hover-card.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'

interface HoverCardRootProps extends React.ComponentPropsWithoutRef<
  typeof HoverCardPrimitive.Root
> {}
const HoverCardRoot: React.FC<HoverCardRootProps> = (props) => (
  <HoverCardPrimitive.Root
    {...mergeProps(
      { closeDelay: 150, openDelay: 200 },
      prop(() => props as Record<string, unknown>),
    )}
  />
)
HoverCardRoot.displayName = 'HoverCard.Root'

type HoverCardTriggerElement = React.ElementRef<typeof HoverCardPrimitive.Trigger>
interface HoverCardTriggerProps extends ComponentPropsWithout<
  typeof HoverCardPrimitive.Trigger,
  RemovedProps
> {}
const HoverCardTrigger = React.forwardRef<HoverCardTriggerElement, HoverCardTriggerProps>(
  (props, forwardedRef) => {
    const triggerProps = mergeProps(
      prop(() => props as Record<string, unknown>),
      { children: undefined, className: undefined },
    )
    return (
      <HoverCardPrimitive.Trigger
        ref={React.coerceRef(forwardedRef)}
        class={prop(() => classNames('rt-HoverCardTrigger', props.className)) as unknown as string}
        {...triggerProps}
        asChild
      >
        {requireReactElement(props.children)}
      </HoverCardPrimitive.Trigger>
    )
  },
)
HoverCardTrigger.displayName = 'HoverCard.Trigger'

type HoverCardContentElement = React.ElementRef<typeof HoverCardPrimitive.Content>
interface HoverCardContentProps
  extends
    ComponentPropsWithout<typeof HoverCardPrimitive.Content, RemovedProps>,
    HoverCardContentOwnProps {
  container?: React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Portal>['container']
}
const HoverCardContent = React.forwardRef<HoverCardContentElement, HoverCardContentProps>(
  (props, forwardedRef) => {
    const { className, forceMount, container, ...contentProps } = extractProps(
      props,
      hoverCardContentPropDefs,
    )
    return (
      <HoverCardPrimitive.Portal container={container} forceMount={forceMount}>
        <Theme asChild>
          <HoverCardPrimitive.Content
            align="start"
            sideOffset={8}
            collisionPadding={10}
            {...contentProps}
            ref={React.coerceRef(forwardedRef)}
            class={classNames('rt-PopperContent', 'rt-HoverCardContent', className)}
          />
        </Theme>
      </HoverCardPrimitive.Portal>
    )
  },
)
HoverCardContent.displayName = 'HoverCard.Content'

export { HoverCardRoot as Root, HoverCardTrigger as Trigger, HoverCardContent as Content }
export type {
  HoverCardRootProps as RootProps,
  HoverCardTriggerProps as TriggerProps,
  HoverCardContentProps as ContentProps,
}
