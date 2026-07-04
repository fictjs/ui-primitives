import type { FictNode, JSX } from 'fict'

type ReactNode = FictNode | FictNode[]

type ComponentProps<T> = T extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[T]
  : T extends (props: infer P) => unknown
    ? P
    : never

type ComponentPropsWithRef<T> = ComponentProps<T>
type ComponentPropsWithoutRef<T> = Omit<ComponentProps<T>, 'ref'>

function Fragment(props: { children?: ReactNode; key?: string }) {
  return <>{props.children}</>
}

function Suspense(props: { children?: ReactNode; fallback?: ReactNode }) {
  return props.children ?? props.fallback ?? null
}

const ReactCompat = {
  Fragment,
  Suspense,
}

export default ReactCompat
export { Fragment, Suspense }
export type { ComponentProps, ComponentPropsWithRef, ComponentPropsWithoutRef, ReactNode }
