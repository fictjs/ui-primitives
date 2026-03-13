import type { FictNode, JSX } from '@fictjs/runtime'

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
  const { children, width = 10, height = 5, class: svgClass, className, ...arrowProps } = props
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
    <svg
      {...(arrowProps as Record<string, unknown>)}
      width={width}
      height={height}
      viewBox="0 0 30 10"
      preserveAspectRatio="none"
      ref={(node: SVGSVGElement | null) => {
        ref.current = node

        if (!props.ref) return
        if (typeof props.ref === 'function') {
          props.ref(node)
          return
        }

        props.ref.current = node
      }}
    >
      {props.asChild ? children : <polygon points="0,0 30,0 15,10" />}
    </svg>
  )
}

Arrow.displayName = 'Arrow'

const Root = Arrow

export { Arrow, Root }
export type { ArrowProps }
