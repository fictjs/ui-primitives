import { prop, type FictNode, type JSX } from '@fictjs/runtime'

import { Primitive } from '@fictjs/primitive'

type MaybeAccessor<T> = T | (() => T)

const DEFAULT_ORIENTATION = 'horizontal'
const ORIENTATIONS = ['horizontal', 'vertical'] as const

type Orientation = (typeof ORIENTATIONS)[number]
type SeparatorProps = JSX.IntrinsicElements['div'] & {
  orientation?: MaybeAccessor<Orientation>
  decorative?: MaybeAccessor<boolean>
}

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

function isValidOrientation(orientation: unknown): orientation is Orientation {
  return ORIENTATIONS.includes(orientation as Orientation)
}

function Separator(props: SeparatorProps): FictNode {
  const {
    decorative = false,
    orientation: orientationProp = DEFAULT_ORIENTATION,
    ...domProps
  } = props
  const orientation = (() => {
    const candidate = readValue(orientationProp)
    return isValidOrientation(candidate) ? candidate : DEFAULT_ORIENTATION
  })()
  const isDecorative = Boolean(readValue(decorative))
  const primitiveProps: Record<string, unknown> = {
    ...domProps,
    'data-orientation': prop(() => orientation),
    role: prop(() => (isDecorative ? 'none' : 'separator')),
    'aria-orientation': prop(() =>
      !isDecorative && orientation === 'vertical' ? 'vertical' : undefined,
    ),
  }

  return <Primitive.div {...primitiveProps} />
}

Separator.displayName = 'Separator'

const Root = Separator

export { Separator, Root }
export type { Orientation, SeparatorProps }
