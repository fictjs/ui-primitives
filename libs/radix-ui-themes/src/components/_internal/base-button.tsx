import { prop } from 'fict'
import { reactive } from 'fict/advanced'
import * as React from '../../helpers/element.js'
import { classNames } from '../../helpers/reactive-class-names.js'
import { Slot } from '@fictjs/radix-ui'

import { baseButtonPropDefs } from './base-button.props.js'
import { Flex } from '../flex.js'
import { Spinner } from '../spinner.js'
import { VisuallyHidden } from '../visually-hidden.js'
import { extractProps, readPropValue } from '../../helpers/extract-props.js'
import { mapResponsiveProp, mapButtonSizeToSpinnerSize } from '../../helpers/map-prop-values.js'
import { renderChildren } from '../../helpers/render-children.js'
import { renderWithAsChild } from '../../helpers/render-with-as-child.js'
import { marginPropDefs } from '../../props/margin.props.js'

import type { MarginProps } from '../../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../../helpers/component-props.js'
import type { GetPropDefTypes } from '../../props/prop-def.js'
import type { JSX } from 'fict'

type BaseButtonElement = React.ElementRef<'button'>
type BaseButtonOwnProps = GetPropDefTypes<typeof baseButtonPropDefs>
type PropGetter<T> = (() => T) & { __fictProp: true }
type GetterBacked<T> = T | PropGetter<T>
interface BaseButtonProps
  extends
    ComponentPropsWithout<'button', RemovedProps | 'aria-expanded'>,
    MarginProps,
    BaseButtonOwnProps {
  'aria-expanded'?: GetterBacked<JSX.IntrinsicElements['button']['aria-expanded']>
}
const BaseButton = React.forwardRef<BaseButtonElement, BaseButtonProps>((props, forwardedRef) => {
  const extractedProps = extractProps(
    props,
    baseButtonPropDefs,
    marginPropDefs,
  ) as BaseButtonProps & {
    className?: string
  }
  const className = extractedProps.className
  const children = extractedProps.children
  const color = extractedProps.color
  const radius = extractedProps.radius
  const disabled = prop(
    () => readPropValue(extractedProps.disabled) ?? readPropValue(props.loading),
  ) as unknown as boolean | undefined
  const baseButtonProps = omitPropsPreservingDescriptors(
    extractedProps as Record<string, unknown>,
    ['className', 'children', 'asChild', 'color', 'radius', 'disabled'],
  )
  const ariaExpandedProps =
    'aria-expanded' in props
      ? {
          'aria-expanded': prop(() =>
            readPropValue(props['aria-expanded']),
          ) as unknown as JSX.IntrinsicElements['button']['aria-expanded'],
        }
      : {}
  return renderWithAsChild(props, (asChild) => {
    const Comp = asChild ? Slot.Root : 'button'
    const renderContents = () => {
      const currentChildren = readPropValue(children)
      const content =
        asChild && React.isValidElement(currentChildren)
          ? readPropValue(
              (currentChildren.props as { children?: React.ReactNode } | null | undefined)
                ?.children,
            )
          : currentChildren

      if (!readPropValue(props.loading)) return content

      return renderLoadingButtonContents(
        content,
        () => readPropValue(props.size) ?? baseButtonPropDefs.size.default,
      )
    }
    const currentChildren = readPropValue(children)
    const liveContents = reactive(renderContents) as unknown as React.ReactNode
    const contents = renderChildren(liveContents)
    const child =
      asChild && React.isValidElement(currentChildren)
        ? React.cloneElement(currentChildren, {
            ...((currentChildren.props as Record<string, unknown> | null | undefined) ?? {}),
            children: contents,
          })
        : contents

    return (
      <Comp
        // The `data-disabled` attribute enables correct styles for `<Button asChild disabled>`.
        data-disabled={
          prop(() => readPropValue(disabled) || undefined) as unknown as true | undefined
        }
        data-accent-color={color}
        data-radius={radius}
        {...baseButtonProps}
        {...ariaExpandedProps}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-reset', 'rt-BaseButton', className)}
        disabled={disabled}
      >
        {child}
      </Comp>
    )
  })
})
BaseButton.displayName = 'BaseButton'

export { BaseButton }
export type { BaseButtonProps }

function renderLoadingButtonContents(
  children: React.ReactNode,
  getSize: () => BaseButtonProps['size'],
) {
  return (
    <>
      {/*
       * We need a wrapper to set `visibility: hidden` to hide the button content
       * whilst we show the `Spinner`. The button is a flex container with a `gap`,
       * so we use `display: contents` to ensure the correct flex layout.
       *
       * However, `display: contents` removes the content from the accessibility
       * tree in some browsers, so we force remove it with `aria-hidden` and
       * re-add it in the tree with `VisuallyHidden`
       */}
      <span style={{ display: 'contents', visibility: 'hidden' }} aria-hidden>
        {children}
      </span>
      <VisuallyHidden>{children}</VisuallyHidden>
      <Flex asChild align="center" justify="center" position="absolute" inset="0">
        <span>
          <Spinner
            size={
              prop(() =>
                mapResponsiveProp(getSize(), mapButtonSizeToSpinnerSize),
              ) as unknown as React.ComponentPropsWithoutRef<typeof Spinner>['size']
            }
          />
        </span>
      </Flex>
    </>
  )
}

function omitPropsPreservingDescriptors(
  source: Record<string, unknown>,
  omittedKeys: string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const omitted = new Set(omittedKeys)

  for (const key of Reflect.ownKeys(source)) {
    if (typeof key === 'string' && omitted.has(key)) {
      continue
    }

    const descriptor = Object.getOwnPropertyDescriptor(source, key)
    if (!descriptor) {
      continue
    }

    Object.defineProperty(result, key, descriptor)
  }

  return result
}
