import { createSignal } from 'fict/advanced'

import * as React from '../helpers/element.js'
import classNames from 'classnames'

import { Slot } from './slot.js'
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
    onLoadingStatusChange,
    onLoad,
    onError,
    ref,
    src,
    ...imageProps
  } = extractProps(props, avatarPropDefs, marginPropDefs)

  const status = createSignal<AvatarImageStatus>(src ? 'loading' : 'error')

  const handleStatusChange = (nextStatus: AvatarImageStatus) => {
    status(nextStatus)
    onLoadingStatusChange?.(nextStatus)
  }

  const content = (
    <>
      {() =>
        status() !== 'loaded' ? (
          <span
            class={classNames('rt-AvatarFallback', {
              'rt-one-letter': typeof fallback === 'string' && fallback.length === 1,
              'rt-two-letters': typeof fallback === 'string' && fallback.length === 2,
            })}
          >
            {status() === 'error' ? fallback : null}
          </span>
        ) : null
      }
      <img
        {...imageProps}
        src={src}
        class="rt-AvatarImage"
        onLoad={(event) => {
          handleStatusChange('loaded')
          onLoad?.(event)
        }}
        onError={(event) => {
          handleStatusChange('error')
          onError?.(event)
        }}
      />
    </>
  )

  const subtree = getSubtree({ asChild, children }, content)

  if (asChild) {
    return (
      <Slot
        data-accent-color={color}
        data-radius={radius}
        class={classNames('rt-reset', 'rt-AvatarRoot', className)}
        style={style}
      >
        {subtree}
      </Slot>
    )
  }

  return (
    <span
      data-accent-color={color}
      data-radius={radius}
      class={classNames('rt-reset', 'rt-AvatarRoot', className)}
      style={style}
      ref={React.coerceRef(ref as React.PossibleRef<HTMLSpanElement>)}
    >
      {subtree}
    </span>
  )
}

Avatar.displayName = 'Avatar'

export { Avatar }
export type { AvatarProps }
