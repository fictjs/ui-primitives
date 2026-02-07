import type { FictNode } from '@fictjs/runtime'

export interface SkeletonProps {
  loading?: boolean
  children?: FictNode
  [key: string]: unknown
}

export function Skeleton(props: SkeletonProps): FictNode {
  const loading = props.loading ?? true

  return {
    type: 'div',
    props: {
      ...props,
      loading: undefined,
      'aria-busy': loading ? 'true' : 'false',
      'data-skeleton': '',
      children: loading
        ? {
            type: 'span',
            props: {
              'data-skeleton-placeholder': '',
              children: props.children ?? null,
            },
          }
        : props.children,
    },
  }
}
