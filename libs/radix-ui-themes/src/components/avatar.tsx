import { createSignal, reactive } from 'fict/advanced'

import * as React from '../helpers/element.js'
import { Avatar as AvatarPrimitive } from '@fictjs/radix-ui'
import { classNames } from '../helpers/reactive-class-names.js'

import { avatarPropDefs } from './avatar.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { getSubtree } from '../helpers/get-subtree.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { JSX } from 'fict'

import type { MarginProps } from '../props/margin.props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type AvatarImageStatus = 'idle' | 'loading' | 'loaded' | 'error'
type AvatarOwnProps = GetPropDefTypes<typeof avatarPropDefs>
type AvatarImageProps = Omit<JSX.IntrinsicElements['img'], 'children' | 'ref'> & {
  onLoadingStatusChange?: (status: AvatarImageStatus) => void
}

interface AvatarProps extends MarginProps, AvatarOwnProps, AvatarImageProps {
  children?: React.ReactNode
  ref?: React.PossibleRef<Element>
}

function Avatar(props: AvatarProps): React.ReactNode {
  const {
    asChild,
    children,
    className,
    style,
    color,
    radius,
    fallback,
    onLoadingStatusChange: _onLoadingStatusChange,
    onLoad: _onLoad,
    onError: _onError,
    ref,
    src,
    ...imageProps
  } = extractProps(props, avatarPropDefs, marginPropDefs)

  const status = createSignal<AvatarImageStatus>('idle')

  const handleStatusChange = (nextStatus: AvatarImageStatus) => {
    status(nextStatus)
    props.onLoadingStatusChange?.(nextStatus)
  }

  const content = (
    <>
      {reactive(() =>
        status() === 'idle' || status() === 'loading' ? (
          <span class="rt-AvatarFallback" />
        ) : status() === 'error' ? (
          <span
            class={classNames('rt-AvatarFallback', {
              'rt-one-letter': typeof fallback === 'string' && fallback.length === 1,
              'rt-two-letters': typeof fallback === 'string' && fallback.length === 2,
            })}
          >
            {fallback}
          </span>
        ) : null,
      )}
      <AvatarPrimitive.Image
        {...imageProps}
        src={src}
        class="rt-AvatarImage"
        onLoad={(event: Event) => props.onLoad?.(event)}
        onError={(event: Event) => props.onError?.(event)}
        onLoadingStatusChange={handleStatusChange}
      />
    </>
  )

  const subtree = getSubtree({ asChild, children }, content)

  if (asChild) {
    return (
      <AvatarPrimitive.Root
        data-accent-color={color}
        data-radius={radius}
        class={classNames('rt-reset', 'rt-AvatarRoot', className)}
        style={style}
        asChild
      >
        {subtree}
      </AvatarPrimitive.Root>
    )
  }

  return (
    <AvatarPrimitive.Root
      data-accent-color={color}
      data-radius={radius}
      class={classNames('rt-reset', 'rt-AvatarRoot', className)}
      style={style}
      ref={React.coerceRef(ref as React.PossibleRef<HTMLSpanElement>)}
    >
      {subtree}
    </AvatarPrimitive.Root>
  )
}

Avatar.displayName = 'Avatar'

export { Avatar }
export type { AvatarProps }
