import type { FictNode, JSX } from '@fictjs/runtime'

import { Primitive } from '@fictjs/primitive'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type ArrowProps = JSX.IntrinsicElements['svg'] & {
  asChild?: boolean
  className?: unknown
}

function readClassValue(value: unknown): string {
  if (typeof value === 'function' && value.length === 0) {
    const nextValue = (value as () => unknown)()
    return nextValue == null ? '' : String(nextValue)
  }

  return value == null ? '' : String(value)
}

function Arrow(props: ArrowProps): FictNode {
  const {
    asChild,
    children,
    width = 10,
    height = 5,
    class: svgClass,
    className,
    ref: forwardedRef,
    ...arrowProps
  } = props
  const ref = { current: null as SVGSVGElement | null }

  useLayoutEffect(() => {
    const currentNode = ref.current
    if (!currentNode) return

    const nextClassName = [readClassValue(svgClass), readClassValue(className)]
      .filter(Boolean)
      .join(' ')

    if (nextClassName) {
      currentNode.setAttribute('class', nextClassName)
      return
    }

    currentNode.removeAttribute('class')
  })

  return (
    <Primitive.svg
      {...(arrowProps as Record<string, unknown>)}
      asChild={Boolean(asChild)}
      width={width}
      height={height}
      viewBox="0 0 30 10"
      preserveAspectRatio="none"
      ref={(node: Element | null) => {
        ref.current = node as SVGSVGElement | null

        if (!forwardedRef) return
        if (typeof forwardedRef === 'function') {
          forwardedRef(node as SVGSVGElement | null)
          return
        }

        forwardedRef.current = node as SVGSVGElement | null
      }}
    >
      {asChild ? children : <polygon points="0,0 30,0 15,10" />}
    </Primitive.svg>
  )
}

Arrow.displayName = 'Arrow'

const Root = Arrow

export { Arrow, Root }
export type { ArrowProps }
