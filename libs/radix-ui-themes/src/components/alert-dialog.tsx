import * as React from '../helpers/element.js'
import { mergeProps, prop } from 'fict'
import { classNames } from '../helpers/reactive-class-names.js'
import { AlertDialog as AlertDialogPrimitive } from '@fictjs/radix-ui'

import { alertDialogContentPropDefs } from './alert-dialog.props.js'
import { Heading } from './heading.js'
import { Text } from './text.js'
import { Theme } from './theme.js'
import { extractProps } from '../helpers/extract-props.js'
import { requireReactElement } from '../helpers/require-react-element.js'

import type { AlertDialogContentOwnProps } from './alert-dialog.props.js'
import type {
  ComponentPropsWithout,
  RemovedProps,
  ComponentPropsAs,
} from '../helpers/component-props.js'

interface AlertDialogRootProps extends React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Root
> {}
const AlertDialogRoot: React.FC<AlertDialogRootProps> = (props) => (
  <AlertDialogPrimitive.Root {...mergeProps(prop(() => props as Record<string, unknown>))} />
)
AlertDialogRoot.displayName = 'AlertDialog.Root'

type AlertDialogTriggerElement = React.ElementRef<typeof AlertDialogPrimitive.Trigger>
interface AlertDialogTriggerProps extends ComponentPropsWithout<
  typeof AlertDialogPrimitive.Trigger,
  RemovedProps
> {}
const AlertDialogTrigger = React.forwardRef<AlertDialogTriggerElement, AlertDialogTriggerProps>(
  (props, forwardedRef) => {
    const triggerProps = mergeProps(
      prop(() => props as Record<string, unknown>),
      { children: undefined },
    )
    return (
      <AlertDialogPrimitive.Trigger {...triggerProps} ref={React.coerceRef(forwardedRef)} asChild>
        {requireReactElement(props.children)}
      </AlertDialogPrimitive.Trigger>
    )
  },
)
AlertDialogTrigger.displayName = 'AlertDialog.Trigger'

type AlertDialogContentElement = React.ElementRef<typeof AlertDialogPrimitive.Content>
interface AlertDialogContentProps
  extends
    ComponentPropsWithout<typeof AlertDialogPrimitive.Content, RemovedProps>,
    AlertDialogContentOwnProps {
  container?: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Portal>['container']
}
const AlertDialogContent = React.forwardRef<AlertDialogContentElement, AlertDialogContentProps>(
  (props, forwardedRef) => {
    const { align: alignPropDef, ...propDefs } = alertDialogContentPropDefs
    const { className: alignClassName } = extractProps(
      { align: prop(() => props.align) },
      { align: alignPropDef },
    )
    const extractedProps = extractProps(
      mergeProps(
        prop(() => props as Record<string, unknown>),
        { align: undefined },
      ) as unknown as AlertDialogContentProps,
      propDefs,
    )
    const contentProps = mergeProps(
      prop(() => extractedProps as unknown as Record<string, unknown>),
      { className: undefined, container: undefined, forceMount: undefined },
    )
    return (
      <AlertDialogPrimitive.Portal
        container={extractedProps.container}
        forceMount={extractedProps.forceMount}
      >
        <Theme asChild>
          <AlertDialogPrimitive.Overlay class="rt-BaseDialogOverlay rt-AlertDialogOverlay">
            <div class="rt-BaseDialogScroll rt-AlertDialogScroll">
              <div
                class={classNames(
                  'rt-BaseDialogScrollPadding',
                  'rt-AlertDialogScrollPadding',
                  alignClassName,
                )}
              >
                <AlertDialogPrimitive.Content
                  {...contentProps}
                  ref={React.coerceRef(forwardedRef)}
                  class={classNames(
                    'rt-BaseDialogContent',
                    'rt-AlertDialogContent',
                    extractedProps.className,
                  )}
                />
              </div>
            </div>
          </AlertDialogPrimitive.Overlay>
        </Theme>
      </AlertDialogPrimitive.Portal>
    )
  },
)
AlertDialogContent.displayName = 'AlertDialog.Content'

type AlertDialogTitleElement = React.ElementRef<typeof Heading>
type AlertDialogTitleProps = ComponentPropsWithout<typeof Heading, 'asChild'>
const AlertDialogTitle = React.forwardRef<AlertDialogTitleElement, AlertDialogTitleProps>(
  (props, forwardedRef) => (
    <AlertDialogPrimitive.Title asChild>
      <Heading
        size="5"
        mb="3"
        trim="start"
        {...mergeProps(prop(() => props as Record<string, unknown>))}
        ref={React.coerceRef(forwardedRef)}
      />
    </AlertDialogPrimitive.Title>
  ),
)
AlertDialogTitle.displayName = 'AlertDialog.Title'

type AlertDialogDescriptionElement = HTMLParagraphElement
type AlertDialogDescriptionProps = ComponentPropsAs<typeof Text, 'p'>
const AlertDialogDescription = React.forwardRef<
  AlertDialogDescriptionElement,
  AlertDialogDescriptionProps
>((props, forwardedRef) => (
  <AlertDialogPrimitive.Description asChild>
    <Text
      as="p"
      size="3"
      {...mergeProps(prop(() => props as Record<string, unknown>))}
      ref={React.coerceRef(forwardedRef)}
    />
  </AlertDialogPrimitive.Description>
))
AlertDialogDescription.displayName = 'AlertDialog.Description'

type AlertDialogActionElement = React.ElementRef<typeof AlertDialogPrimitive.Action>
interface AlertDialogActionProps extends ComponentPropsWithout<
  typeof AlertDialogPrimitive.Action,
  RemovedProps
> {}
const AlertDialogAction = React.forwardRef<AlertDialogActionElement, AlertDialogActionProps>(
  (props, forwardedRef) => {
    const actionProps = mergeProps(
      prop(() => props as Record<string, unknown>),
      { children: undefined },
    )
    return (
      <AlertDialogPrimitive.Action {...actionProps} ref={React.coerceRef(forwardedRef)} asChild>
        {requireReactElement(props.children)}
      </AlertDialogPrimitive.Action>
    )
  },
)
AlertDialogAction.displayName = 'AlertDialog.Action'

type AlertDialogCancelElement = React.ElementRef<typeof AlertDialogPrimitive.Cancel>
interface AlertDialogCancelProps extends ComponentPropsWithout<
  typeof AlertDialogPrimitive.Cancel,
  RemovedProps
> {}
const AlertDialogCancel = React.forwardRef<AlertDialogCancelElement, AlertDialogCancelProps>(
  (props, forwardedRef) => {
    const cancelProps = mergeProps(
      prop(() => props as Record<string, unknown>),
      { children: undefined },
    )
    return (
      <AlertDialogPrimitive.Cancel {...cancelProps} ref={React.coerceRef(forwardedRef)} asChild>
        {requireReactElement(props.children)}
      </AlertDialogPrimitive.Cancel>
    )
  },
)
AlertDialogCancel.displayName = 'AlertDialog.Cancel'

export {
  AlertDialogRoot as Root,
  AlertDialogTrigger as Trigger,
  AlertDialogContent as Content,
  AlertDialogTitle as Title,
  AlertDialogDescription as Description,
  AlertDialogAction as Action,
  AlertDialogCancel as Cancel,
}

export type {
  AlertDialogRootProps as RootProps,
  AlertDialogTriggerProps as TriggerProps,
  AlertDialogContentProps as ContentProps,
  AlertDialogTitleProps as TitleProps,
  AlertDialogDescriptionProps as DescriptionProps,
  AlertDialogActionProps as ActionProps,
  AlertDialogCancelProps as CancelProps,
}
