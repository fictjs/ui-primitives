import type { FictNode, JSX } from '@fictjs/runtime'

import { Primitive } from '@fictjs/primitive'

type ArrowProps = JSX.IntrinsicElements['svg'] & {
  asChild?: boolean
}

function Arrow(props: ArrowProps): FictNode {
  const { children, width = 10, height = 5, ...arrowProps } = props

  return (
    <Primitive.svg
      {...(arrowProps as Record<string, unknown>)}
      width={width}
      height={height}
      viewBox="0 0 30 10"
      preserveAspectRatio="none"
    >
      {props.asChild ? children : <polygon points="0,0 30,0 15,10" />}
    </Primitive.svg>
  )
}

Arrow.displayName = 'Arrow'

const Root = Arrow

export { Arrow, Root }
export type { ArrowProps }
