import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'

import { Primitive } from '@fictjs/primitive'

type MaybeAccessor<T> = T | (() => T)
type AspectRatioProps = JSX.IntrinsicElements['div'] & {
  ratio?: MaybeAccessor<number>
}

const ASPECT_RATIO_FILL_STYLES = Object.freeze({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
})

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

function isStyleObject(value: unknown): value is Record<string, string | number> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeFillStyle(style: unknown): string | Record<string, string | number> {
  if (!style) return ASPECT_RATIO_FILL_STYLES
  if (isStyleObject(style)) {
    return { ...style, ...ASPECT_RATIO_FILL_STYLES }
  }
  return `${String(style)};position:absolute;top:0;right:0;bottom:0;left:0`
}

function AspectRatio(props: AspectRatioProps): FictNode {
  const aspectRatioProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      ratio: undefined,
      style: undefined,
    },
  )
  const wrapperProps: Record<string, unknown> = {
    'data-radix-aspect-ratio-wrapper': '',
    style: prop(() => ({
      position: 'relative',
      width: '100%',
      paddingBottom: `${100 / readValue(props.ratio ?? 1 / 1)}%`,
    })),
  }

  return (
    <div {...wrapperProps}>
      <Primitive.div
        {...(aspectRatioProps as Record<string, unknown>)}
        style={
          prop(() => mergeFillStyle(props.style)) as unknown as NonNullable<
            AspectRatioProps['style']
          >
        }
      />
    </div>
  )
}

AspectRatio.displayName = 'AspectRatio'

const Root = AspectRatio

export { AspectRatio, Root }
export type { AspectRatioProps }
