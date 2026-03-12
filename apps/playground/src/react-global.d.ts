import type {
  ComponentProps as CompatComponentProps,
  ComponentPropsWithRef as CompatComponentPropsWithRef,
  ComponentPropsWithoutRef as CompatComponentPropsWithoutRef,
  ReactNode as CompatReactNode,
} from './compat/react.js'

declare global {
  namespace React {
    type ComponentProps<T> = CompatComponentProps<T>
    type ComponentPropsWithRef<T> = CompatComponentPropsWithRef<T>
    type ComponentPropsWithoutRef<T> = CompatComponentPropsWithoutRef<T>
    type ReactNode = CompatReactNode
  }
}

export {}
