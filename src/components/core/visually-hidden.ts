import type { FictNode } from '@fictjs/runtime'

export interface VisuallyHiddenProps {
  as?: string
  children?: FictNode
  [key: string]: unknown
}

const visuallyHiddenStyle: Record<string, string> = {
  position: 'absolute',
  border: '0',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
}

export function VisuallyHidden(props: VisuallyHiddenProps): FictNode {
  const { as = 'span', children, style, ...rest } = props

  return {
    type: as,
    props: {
      ...rest,
      style:
        typeof style === 'object' && style !== null
          ? { ...visuallyHiddenStyle, ...(style as Record<string, string>) }
          : visuallyHiddenStyle,
      children,
    },
  }
}
