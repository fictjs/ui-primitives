export type RefCallback<T> = (newValue: T | null) => void

export interface RefObject<T> {
  current: T | null
}

export type Ref<T> = RefCallback<T> | RefObject<T>

export type MaybeRef<T> = Ref<T> | null | undefined

export type RefLifecycleCallback<T> = (newValue: T | null, lastValue: T | null) => void
