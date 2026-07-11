import type { FictNode, FictVNode, JSX } from 'fict'

type ReactNode = FictNode | FictNode[]
type ReactElement<P = Record<string, unknown>> = FictVNode & {
  props: P
}
type RefCallback<T> = { bivarianceHack(node: T | null): void }['bivarianceHack']
type PossibleRef<T> = RefCallback<T> | { current: T | null } | null | undefined
type FC<P = any> = ((props: P) => FictNode) & {
  displayName?: string
}
type CSSProperties = string | Record<string, string | number>
type RefObject<T> = { current: T | null }
type ElementType<P = any> = keyof JSX.IntrinsicElements | FC<P>
type AliasProps = {
  className?: string
  htmlFor?: string
  asChild?: boolean
}

type PropsOf<T extends ElementType> = T extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[T]
  : T extends (props: infer P) => unknown
    ? P
    : Record<string, unknown> & AliasProps & { ref?: PossibleRef<Element> }

type NormalizedProps<T extends ElementType> = PropsOf<T> & AliasProps

type ElementRef<_T extends ElementType> = Element
type ComponentPropsWithoutRef<T extends ElementType> = Omit<NormalizedProps<T>, 'ref'>
type ComponentPropsWithRef<T extends ElementType> = NormalizedProps<T>

function forwardRef<R, P>(render: (props: P, ref: PossibleRef<R>) => FictNode) {
  const Component = (props: P & { ref?: PossibleRef<R> }) => render(props, props.ref)
  return Component as ((props: P & { ref?: PossibleRef<R> }) => FictNode) & {
    displayName?: string
  }
}

function coerceRef<T extends Element>(ref: PossibleRef<T>): ((node: T | null) => void) | undefined {
  if (ref === undefined) return undefined

  return (node) => {
    if (typeof ref === 'function') {
      ref(node)
      return
    }

    if (ref === null) {
      return
    }

    ref.current = node
  }
}

function flattenChildren(children: ReactNode | undefined, result: FictNode[] = []): FictNode[] {
  if (Array.isArray(children)) {
    for (const child of children) {
      flattenChildren(child, result)
    }
    return result
  }

  if (children !== undefined && children !== null && children !== false) {
    result.push(children)
  }

  return result
}

function isValidElement(value: unknown): value is ReactElement {
  return Boolean(value && typeof value === 'object' && 'type' in value && 'props' in value)
}

function cloneElement<P extends Record<string, unknown>>(
  element: ReactElement<P>,
  props: Partial<P> & { children?: ReactNode },
): ReactElement<P> {
  const nextProps = {
    ...(element.props as Record<string, unknown>),
    ...(props as Record<string, unknown>),
  } as P

  return {
    ...element,
    props: nextProps,
  }
}

const Children = {
  only(children: ReactNode): ReactElement {
    const flattened = flattenChildren(children)
    if (flattened.length !== 1 || !isValidElement(flattened[0])) {
      throw new Error('Expected exactly one Fict element child.')
    }
    return flattened[0]
  },
  toArray(children: ReactNode): FictNode[] {
    return flattenChildren(children)
  },
}

const version = '19.0.0'

export { Children, cloneElement, coerceRef, forwardRef, isValidElement, version }
export type {
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementRef,
  ElementType,
  FC,
  PossibleRef,
  RefCallback,
  ReactElement,
  ReactNode,
  RefObject,
}
