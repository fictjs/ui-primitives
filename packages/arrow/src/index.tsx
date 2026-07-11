import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { isReactive } from '@fictjs/runtime/advanced'
import { Primitive } from '@fictjs/primitive'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type ArrowProps = JSX.IntrinsicElements['svg'] & {
  asChild?: boolean
  className?: unknown
}

function readStructuralValue(value: unknown): unknown {
  let currentValue = value

  for (let depth = 0; depth < 10 && isReactive(currentValue); depth += 1) {
    const nextValue = currentValue()
    if (nextValue === currentValue) break
    currentValue = nextValue
  }

  return currentValue
}

function readClassValue(value: unknown): string {
  if (typeof value === 'function' && value.length === 0) {
    const nextValue = (value as () => unknown)()
    return nextValue == null ? '' : String(nextValue)
  }

  return value == null ? '' : String(value)
}

function Arrow(props: ArrowProps): FictNode {
  const rawProps = mergeProps({}, props as unknown as Record<string, unknown>)
  const asChildProp = rawProps.asChild
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

  const renderArrow = (asChild: boolean) => (
    <Primitive.svg
      {...(arrowProps as Record<string, unknown>)}
      asChild={asChild}
      width={prop(() => props.width ?? 10) as unknown as number}
      height={prop(() => props.height ?? 5) as unknown as number}
      viewBox="0 0 30 10"
      preserveAspectRatio="none"
      ref={(node: Element | null) => {
        ref.current = node as SVGSVGElement | null

        if (ref.current) {
          const nextClassName = [readClassValue(props.class), readClassValue(props.className)]
            .filter(Boolean)
            .join(' ')

          if (nextClassName) {
            ref.current.setAttribute('class', nextClassName)
          } else {
            ref.current.removeAttribute('class')
          }
        }

        const forwardedRef = props.ref
        if (!forwardedRef) return
        if (typeof forwardedRef === 'function') {
          forwardedRef(node as SVGSVGElement | null)
          return
        }

        forwardedRef.current = node as SVGSVGElement | null
      }}
    >
      {asChild ? props.children : <polygon points="0,0 30,0 15,10" />}
    </Primitive.svg>
  )

  return renderArrow(Boolean(readStructuralValue(asChildProp)))
}

Arrow.displayName = 'Arrow'

const Root = Arrow

export { Arrow, Root }
export type { ArrowProps }
