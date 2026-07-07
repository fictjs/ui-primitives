import { type FictNode, type FictVNode, type JSX } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { createContextScope, type Scope } from '@fictjs/context'
import { Primitive } from '@fictjs/primitive'
import { useCallbackRef } from '@fictjs/use-callback-ref'
import { useIsHydrated } from '@fictjs/use-is-hydrated'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'
type ImgCrossOrigin = JSX.IntrinsicElements['img']['crossOrigin']
type ImgReferrerPolicy = JSX.IntrinsicElements['img']['referrerPolicy']
type AvatarStateProps = {
  __avatarImageLoadingStatus?: () => ImageLoadingStatus
  __avatarOnImageLoadingStatusChange?: (status: ImageLoadingStatus) => void
}
type ScopedProps<P> = P & { __scopeAvatar?: Scope<unknown> }
type ImageStatusSubscriber = {
  onError?: (event: Event) => void
  onStatusChange(status: ImageLoadingStatus): void
}

const AVATAR_NAME = 'Avatar'
const IMAGE_NAME = 'AvatarImage'
const FALLBACK_NAME = 'AvatarFallback'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')
const imageStatusCache = new Map<string, ImageLoadingStatus>()
const pendingImageLoads = new Map<string, HTMLImageElement>()
const imageStatusSubscribers = new Map<string, Set<ImageStatusSubscriber>>()

const [, createAvatarScope] = createContextScope(AVATAR_NAME)

type AvatarProps = JSX.IntrinsicElements['span'] & {
  asChild?: boolean
}
type AvatarImageProps = Omit<
  JSX.IntrinsicElements['img'],
  'crossOrigin' | 'referrerPolicy' | 'src'
> & {
  crossOrigin?: MaybeAccessor<ImgCrossOrigin | undefined>
  referrerPolicy?: MaybeAccessor<ImgReferrerPolicy | undefined>
  src?: MaybeAccessor<string | undefined>
  onLoadingStatusChange?: (status: ImageLoadingStatus) => void
}
type AvatarFallbackProps = JSX.IntrinsicElements['span'] & {
  delayMs?: MaybeAccessor<number | undefined>
}

function readValue<T>(value: MaybeAccessor<T>): T {
  if (
    typeof value === 'function' &&
    (value.length === 0 ||
      (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  ) {
    return (value as () => T)()
  }

  return value as T
}

function isVNode(node: unknown): node is FictVNode {
  return !!node && typeof node === 'object' && 'type' in (node as FictVNode)
}

function cloneVNode(node: FictVNode, props: Record<string, unknown>): FictVNode {
  return {
    ...node,
    props: {
      ...(node.props as Record<string, unknown> | null | undefined),
      ...props,
    },
  }
}

function injectAvatarState(
  node: FictNode | FictNode[] | undefined,
  state: AvatarStateProps,
): FictNode | FictNode[] {
  if (Array.isArray(node)) {
    return node.map((child) => injectAvatarState(child, state))
  }

  if (!isVNode(node)) {
    return node ?? null
  }

  if (node.type === AvatarImage || node.type === AvatarFallback) {
    return cloneVNode(node, state)
  }

  const children = (node.props as { children?: FictNode | FictNode[] } | null | undefined)?.children
  if (children === undefined) {
    return node
  }

  return cloneVNode(node, {
    children: injectAvatarState(children, state),
  })
}

function Avatar(props: ScopedProps<AvatarProps>): FictNode {
  const imageLoadingStatus = createSignal<ImageLoadingStatus>('idle')
  const primitiveProps: Record<string, unknown> = {
    ...(props as Record<string, unknown>),
    __scopeAvatar: undefined,
    children: undefined,
  }
  const children = injectAvatarState(props.children as FictNode | FictNode[] | undefined, {
    __avatarImageLoadingStatus: imageLoadingStatus,
    __avatarOnImageLoadingStatusChange: (status) => imageLoadingStatus(status),
  })

  return (
    <Primitive.span {...(primitiveProps as Record<string, unknown>)}>{children}</Primitive.span>
  )
}

Avatar.displayName = AVATAR_NAME

function AvatarImage(props: ScopedProps<AvatarImageProps & AvatarStateProps>): FictNode {
  const src = () =>
    props.src === undefined ? undefined : readValue(props.src as MaybeAccessor<string | undefined>)
  const imageLoadingStatus = useImageLoadingStatus(src, {
    crossOrigin: () =>
      props.crossOrigin === undefined
        ? undefined
        : readValue(props.crossOrigin as MaybeAccessor<ImgCrossOrigin | undefined>),
    onError: useCallbackRef((event: Event) => {
      const onError = props.onError as ((event: Event) => void) | undefined
      onError?.(event)
    }),
    referrerPolicy: () =>
      props.referrerPolicy === undefined
        ? undefined
        : readValue(props.referrerPolicy as MaybeAccessor<ImgReferrerPolicy | undefined>),
  })
  const handleLoadingStatusChange = useCallbackRef((status: ImageLoadingStatus) => {
    props.onLoadingStatusChange?.(status)
    props.__avatarOnImageLoadingStatusChange?.(status)
  })

  useLayoutEffect(() => {
    const status = imageLoadingStatus()
    if (status !== 'idle') {
      handleLoadingStatusChange(status)
    }
  })

  const getPrimitiveProps = (): Record<string, unknown> => ({
    ...(props as Record<string, unknown>),
    __scopeAvatar: undefined,
    __avatarImageLoadingStatus: undefined,
    __avatarOnImageLoadingStatusChange: undefined,
    children: undefined,
    onLoadingStatusChange: undefined,
    src: src(),
  })

  return (
    <>
      {reactive(() =>
        imageLoadingStatus() === 'loaded' ? <Primitive.img {...getPrimitiveProps()} /> : null,
      )}
    </>
  )
}

AvatarImage.displayName = IMAGE_NAME

function AvatarFallback(props: ScopedProps<AvatarFallbackProps & AvatarStateProps>): FictNode {
  const canRender = createSignal(props.delayMs === undefined)
  const imageLoadingStatus =
    props.__avatarImageLoadingStatus ?? (() => 'idle' as ImageLoadingStatus)

  useLayoutEffect(() => {
    const delayMs =
      props.delayMs === undefined
        ? undefined
        : readValue(props.delayMs as MaybeAccessor<number | undefined>)

    if (delayMs === undefined) {
      canRender(true)
      return
    }

    canRender(false)
    const timerId = window.setTimeout(() => {
      canRender(true)
    }, delayMs)

    return () => {
      window.clearTimeout(timerId)
    }
  })

  const primitiveProps: Record<string, unknown> = {
    ...(props as Record<string, unknown>),
    __scopeAvatar: undefined,
    __avatarImageLoadingStatus: undefined,
    __avatarOnImageLoadingStatusChange: undefined,
    delayMs: undefined,
  }

  return (
    <>
      {reactive(() =>
        canRender() && imageLoadingStatus() !== 'loaded' ? (
          <Primitive.span {...(primitiveProps as Record<string, unknown>)} />
        ) : null,
      )}
    </>
  )
}

AvatarFallback.displayName = FALLBACK_NAME

function resolveLoadingStatus(image: HTMLImageElement | null, src?: string): ImageLoadingStatus {
  if (!image) {
    return 'idle'
  }

  if (!src) {
    return 'error'
  }

  if (image.src !== src) {
    image.src = src
  }

  return image.complete && image.naturalWidth > 0 ? 'loaded' : 'loading'
}

function useImageLoadingStatus(
  src: () => string | undefined,
  options: {
    crossOrigin: () => ImgCrossOrigin | undefined
    onError?: (event: Event) => void
    referrerPolicy: () => ImgReferrerPolicy | undefined
  },
): () => ImageLoadingStatus {
  const isHydrated = useIsHydrated()
  const loadingStatus = createSignal<ImageLoadingStatus>('idle')
  const lastErrorNotificationKeyRef = { current: undefined as string | undefined }
  const imageKey = () => {
    const currentSrc = src()
    if (!currentSrc) {
      return undefined
    }

    return [currentSrc, options.crossOrigin() ?? '', options.referrerPolicy() ?? ''].join('::')
  }

  useLayoutEffect(() => {
    if (!isHydrated()) {
      loadingStatus('idle')
      return
    }

    const currentSrc = src()
    const currentKey = imageKey()

    if (!currentSrc || !currentKey) {
      loadingStatus('error')
      return
    }

    if (
      lastErrorNotificationKeyRef.current !== undefined &&
      lastErrorNotificationKeyRef.current !== currentKey
    ) {
      lastErrorNotificationKeyRef.current = undefined
    }

    const cachedStatus = imageStatusCache.get(currentKey)
    if (cachedStatus === 'loaded' || cachedStatus === 'error') {
      loadingStatus(cachedStatus)
      if (cachedStatus === 'error' && lastErrorNotificationKeyRef.current !== currentKey) {
        lastErrorNotificationKeyRef.current = currentKey
        options.onError?.(new Event('error'))
      }
      return
    }

    const nextReferrerPolicy = options.referrerPolicy()
    const nextCrossOrigin = options.crossOrigin()
    let subscribers = imageStatusSubscribers.get(currentKey)

    if (!subscribers) {
      subscribers = new Set()
      imageStatusSubscribers.set(currentKey, subscribers)
    }

    const subscriber: ImageStatusSubscriber = {
      onStatusChange: (status) => {
        loadingStatus(status)
      },
    }
    if (options.onError) {
      subscriber.onError = (event) => {
        lastErrorNotificationKeyRef.current = currentKey
        options.onError?.(event)
      }
    }

    subscribers.add(subscriber)
    loadingStatus('loading')

    if (!pendingImageLoads.has(currentKey)) {
      const image = new window.Image()
      pendingImageLoads.set(currentKey, image)

      if (nextReferrerPolicy) {
        image.referrerPolicy = nextReferrerPolicy
      }

      if (typeof nextCrossOrigin === 'string') {
        image.crossOrigin = nextCrossOrigin
      }

      const notify = (status: ImageLoadingStatus, event: Event) => {
        imageStatusCache.set(currentKey, status)
        pendingImageLoads.delete(currentKey)
        const currentSubscribers = imageStatusSubscribers.get(currentKey)
        if (!currentSubscribers) {
          return
        }

        for (const subscriber of currentSubscribers) {
          subscriber.onStatusChange(status)
          if (status === 'error') {
            subscriber.onError?.(event)
          }
        }
      }

      image.addEventListener('load', (event) => {
        notify('loaded', event)
      })
      image.addEventListener('error', (event) => {
        notify('error', event)
      })
      image.src = currentSrc
    }

    return () => {
      const currentSubscribers = imageStatusSubscribers.get(currentKey)
      currentSubscribers?.delete(subscriber)
      if (
        currentSubscribers &&
        currentSubscribers.size === 0 &&
        !pendingImageLoads.has(currentKey)
      ) {
        imageStatusSubscribers.delete(currentKey)
      }
    }
  })

  return loadingStatus
}

const Root = Avatar
const Image = AvatarImage
const Fallback = AvatarFallback

export { createAvatarScope, Avatar, AvatarImage, AvatarFallback, Root, Image, Fallback }
export type { AvatarProps, AvatarImageProps, AvatarFallbackProps, ImageLoadingStatus }
