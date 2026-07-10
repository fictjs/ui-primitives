import * as React from '../helpers/element.js'
import { mergeProps, prop } from 'fict'
import { classNames } from '../helpers/reactive-class-names.js'
import { Dialog as DialogPrimitive } from '@fictjs/radix-ui'

import { dialogContentPropDefs } from './dialog.props.js'
import { Heading } from './heading.js'
import { Text } from './text.js'
import { Theme } from './theme.js'
import { extractProps } from '../helpers/extract-props.js'
import { requireReactElement } from '../helpers/require-react-element.js'

import type { DialogContentOwnProps } from './dialog.props.js'
import type {
  ComponentPropsWithout,
  RemovedProps,
  ComponentPropsAs,
} from '../helpers/component-props.js'

interface DialogRootProps extends ComponentPropsWithout<typeof DialogPrimitive.Root, 'modal'> {}
const DialogRoot: React.FC<DialogRootProps> = (props) => (
  <DialogPrimitive.Root
    {...mergeProps(
      prop(() => props as Record<string, unknown>),
      { modal: true },
    )}
  />
)
DialogRoot.displayName = 'Dialog.Root'

type DialogTriggerElement = React.ElementRef<typeof DialogPrimitive.Trigger>
interface DialogTriggerProps extends ComponentPropsWithout<
  typeof DialogPrimitive.Trigger,
  RemovedProps
> {}
const DialogTrigger = React.forwardRef<DialogTriggerElement, DialogTriggerProps>(
  (props, forwardedRef) => {
    const triggerProps = mergeProps(
      prop(() => props as Record<string, unknown>),
      { children: undefined },
    )
    return (
      <DialogPrimitive.Trigger {...triggerProps} ref={React.coerceRef(forwardedRef)} asChild>
        {requireReactElement(props.children)}
      </DialogPrimitive.Trigger>
    )
  },
)
DialogTrigger.displayName = 'Dialog.Trigger'

type DialogContentElement = React.ElementRef<typeof DialogPrimitive.Content>
interface DialogContentProps
  extends
    ComponentPropsWithout<typeof DialogPrimitive.Content, RemovedProps>,
    DialogContentOwnProps {
  container?: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>['container']
}
const DialogContent = React.forwardRef<DialogContentElement, DialogContentProps>(
  (props, forwardedRef) => {
    const { align: alignPropDef, ...propDefs } = dialogContentPropDefs
    const { className: alignClassName } = extractProps(
      { align: prop(() => props.align) },
      { align: alignPropDef },
    )
    const extractedProps = extractProps(
      mergeProps(
        prop(() => props as Record<string, unknown>),
        { align: undefined },
      ) as unknown as DialogContentProps,
      propDefs,
    )
    const contentProps = mergeProps(
      prop(() => extractedProps as unknown as Record<string, unknown>),
      { className: undefined, container: undefined, forceMount: undefined },
    )
    return (
      <DialogPrimitive.Portal
        container={extractedProps.container}
        forceMount={extractedProps.forceMount}
      >
        <Theme asChild>
          <DialogPrimitive.Overlay class="rt-BaseDialogOverlay rt-DialogOverlay">
            <div class="rt-BaseDialogScroll rt-DialogScroll">
              <div
                class={classNames(
                  'rt-BaseDialogScrollPadding',
                  'rt-DialogScrollPadding',
                  alignClassName,
                )}
              >
                <DialogPrimitive.Content
                  {...contentProps}
                  ref={React.coerceRef(forwardedRef)}
                  class={classNames(
                    'rt-BaseDialogContent',
                    'rt-DialogContent',
                    extractedProps.className,
                  )}
                />
              </div>
            </div>
          </DialogPrimitive.Overlay>
        </Theme>
      </DialogPrimitive.Portal>
    )
  },
)
DialogContent.displayName = 'Dialog.Content'

type DialogTitleElement = React.ElementRef<typeof Heading>
type DialogTitleProps = ComponentPropsWithout<typeof Heading, 'asChild'>
const DialogTitle = React.forwardRef<DialogTitleElement, DialogTitleProps>(
  (props, forwardedRef) => (
    <DialogPrimitive.Title asChild>
      <Heading
        size="5"
        mb="3"
        trim="start"
        {...mergeProps(prop(() => props as Record<string, unknown>))}
        ref={React.coerceRef(forwardedRef)}
      />
    </DialogPrimitive.Title>
  ),
)
DialogTitle.displayName = 'Dialog.Title'

type DialogDescriptionElement = HTMLParagraphElement
type DialogDescriptionProps = ComponentPropsAs<typeof Text, 'p'>
const DialogDescription = React.forwardRef<DialogDescriptionElement, DialogDescriptionProps>(
  (props, forwardedRef) => (
    <DialogPrimitive.Description asChild>
      <Text
        as="p"
        size="3"
        {...mergeProps(prop(() => props as Record<string, unknown>))}
        ref={React.coerceRef(forwardedRef)}
      />
    </DialogPrimitive.Description>
  ),
)
DialogDescription.displayName = 'Dialog.Description'

type DialogCloseElement = React.ElementRef<typeof DialogPrimitive.Close>
interface DialogCloseProps extends ComponentPropsWithout<
  typeof DialogPrimitive.Close,
  RemovedProps
> {}
const DialogClose = React.forwardRef<DialogCloseElement, DialogCloseProps>(
  (props, forwardedRef) => {
    const closeProps = mergeProps(
      prop(() => props as Record<string, unknown>),
      { children: undefined },
    )
    return (
      <DialogPrimitive.Close {...closeProps} ref={React.coerceRef(forwardedRef)} asChild>
        {requireReactElement(props.children)}
      </DialogPrimitive.Close>
    )
  },
)
DialogClose.displayName = 'Dialog.Close'

export {
  DialogRoot as Root,
  DialogTrigger as Trigger,
  DialogContent as Content,
  DialogTitle as Title,
  DialogDescription as Description,
  DialogClose as Close,
}

export type {
  DialogRootProps as RootProps,
  DialogTriggerProps as TriggerProps,
  DialogContentProps as ContentProps,
  DialogTitleProps as TitleProps,
  DialogDescriptionProps as DescriptionProps,
  DialogCloseProps as CloseProps,
}
