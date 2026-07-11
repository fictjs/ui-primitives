import { prop } from 'fict'
import { createSignal, reactive } from 'fict/advanced'

import * as React from '../helpers/element.js'
import { Avatar as AvatarPrimitive } from '@fictjs/radix-ui'
import { classNames } from '../helpers/reactive-class-names.js'

import { avatarPropDefs } from './avatar.props.js'
import { extractProps, readPropValue } from '../helpers/extract-props.js'
import { getSubtree } from '../helpers/get-subtree.js'
import { renderWithAsChild } from '../helpers/render-with-as-child.js'
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
    asChild: _asChild,
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
      {reactive(() => {
        return status() === 'idle' || status() === 'loading' ? (
          <span class="rt-AvatarFallback" />
        ) : status() === 'error' ? (
          <span
            class={classNames(
              'rt-AvatarFallback',
              prop(() => {
                const currentFallback = readPropValue(fallback)
                return {
                  'rt-one-letter':
                    typeof currentFallback === 'string' && currentFallback.length === 1,
                  'rt-two-letters':
                    typeof currentFallback === 'string' && currentFallback.length === 2,
                }
              }),
            )}
          >
            {prop(() => readPropValue(fallback)) as unknown as React.ReactNode}
          </span>
        ) : null
      })}
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

  return renderWithAsChild(props, (asChild) => {
    const subtree = asChild
      ? getSubtree({ asChild, children: readPropValue(children) }, content)
      : content
    return (
      <AvatarPrimitive.Root
        data-accent-color={color}
        data-radius={radius}
        class={classNames('rt-reset', 'rt-AvatarRoot', className)}
        style={style}
        asChild={asChild}
        ref={React.coerceRef(ref as React.PossibleRef<HTMLSpanElement>)}
      >
        {subtree}
      </AvatarPrimitive.Root>
    )
  })
}

Avatar.displayName = 'Avatar'

export { Avatar }
export type { AvatarProps }
