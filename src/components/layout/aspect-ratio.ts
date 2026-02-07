import type { FictNode } from '@fictjs/runtime'

export interface AspectRatioProps {
  ratio?: number
  children?: FictNode
  [key: string]: unknown
}

export function AspectRatio(props: AspectRatioProps): FictNode {
  const ratio = props.ratio ?? 1
  const paddingBottom = `${(1 / ratio) * 100}%`

  return {
    type: 'div',
    props: {
      ...props,
      ratio: undefined,
      'data-aspect-ratio': '',
      style: {
        position: 'relative',
        width: '100%',
        paddingBottom,
        ...(typeof props.style === 'object' && props.style !== null
          ? (props.style as Record<string, unknown>)
          : {}),
      },
      children: {
        type: 'div',
        props: {
          style: {
            position: 'absolute',
            inset: 0,
          },
          'data-aspect-ratio-content': '',
          children: props.children,
        },
      },
    },
  }
}
