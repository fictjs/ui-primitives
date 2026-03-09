type PossibleRef<T> = ((node: T | null) => void) | { current: T | null } | null | undefined

function setRef<T>(ref: PossibleRef<T>, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value)
    return
  }

  if (ref) {
    ref.current = value
  }
}

function composeRefs<T>(...refs: PossibleRef<T>[]): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      setRef(ref, node)
    }
  }
}

function useComposedRefs<T>(...refs: PossibleRef<T>[]): (node: T | null) => void {
  return composeRefs(...refs)
}

export { composeRefs, useComposedRefs }
export type { PossibleRef }
