import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'

import { Primitive } from '@fictjs/primitive'

const VISUALLY_HIDDEN_STYLES = Object.freeze({
  position: 'absolute',
  border: 0,
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  wordWrap: 'normal',
})

type VisuallyHiddenProps = JSX.IntrinsicElements['span']

function isStyleObject(value: unknown): value is Record<string, string | number> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeStyle(style: unknown): string | Record<string, string | number> {
  if (!style) return VISUALLY_HIDDEN_STYLES
  if (isStyleObject(style)) {
    return { ...VISUALLY_HIDDEN_STYLES, ...style }
  }
  return `${Object.entries(VISUALLY_HIDDEN_STYLES)
    .map(([key, value]) => `${key}:${String(value)}`)
    .join(';')};${String(style)}`
}

function VisuallyHidden(props: VisuallyHiddenProps): FictNode {
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      style: prop(() => mergeStyle(props.style)),
    },
  )

  return <Primitive.span {...primitiveProps} />
}

VisuallyHidden.displayName = 'VisuallyHidden'

const Root = VisuallyHidden

export { VisuallyHidden, Root, VISUALLY_HIDDEN_STYLES }
export type { VisuallyHiddenProps }
