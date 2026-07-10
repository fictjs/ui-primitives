import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'

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
  const ref = { current: null as SVGSVGElement | null }
  const arrowProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      asChild: undefined,
      children: undefined,
      width: undefined,
      height: undefined,
      class: undefined,
      className: undefined,
      ref: undefined,
    },
  )

  useLayoutEffect(() => {
    const currentNode = ref.current
    if (!currentNode) return

    const nextClassName = [readClassValue(props.class), readClassValue(props.className)]
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
      asChild={prop(() => Boolean(props.asChild)) as unknown as boolean}
      width={prop(() => props.width ?? 10) as unknown as number}
      height={prop(() => props.height ?? 5) as unknown as number}
      viewBox="0 0 30 10"
      preserveAspectRatio="none"
      ref={(node: Element | null) => {
        ref.current = node as SVGSVGElement | null

        const forwardedRef = props.ref
        if (!forwardedRef) return
        if (typeof forwardedRef === 'function') {
          forwardedRef(node as SVGSVGElement | null)
          return
        }

        forwardedRef.current = node as SVGSVGElement | null
      }}
    >
      {props.asChild ? props.children : <polygon points="0,0 30,0 15,10" />}
    </Primitive.svg>
  )
}

Arrow.displayName = 'Arrow'

const Root = Arrow

export { Arrow, Root }
export type { ArrowProps }
