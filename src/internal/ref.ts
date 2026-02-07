export type RefLike<T> = ((node: T | null) => void) | { current: T | null } | undefined

export function assignRef<T>(ref: RefLike<T>, value: T | null): void {
  if (!ref) return
  if (typeof ref === 'function') {
    ref(value)
    return
  }
  ref.current = value
}

export function composeRefs<T>(...refs: RefLike<T>[]): (node: T | null) => void {
  return (node: T | null) => {
    for (const ref of refs) {
      assignRef(ref, node)
    }
  }
}
