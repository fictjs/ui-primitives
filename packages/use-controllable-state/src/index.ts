type MaybeAccessor<T> = T | (() => T)

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

import { createSignal } from '@fictjs/runtime/advanced'

import { useEffectEvent } from '@fictjs/use-effect-event'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type ChangeHandler<T> = (state: T) => void
type SetStateFn<T> = (value: T | ((prev: T) => T)) => void
type Dispatch<A> = (action: A) => void

interface UseControllableStateParams<T> {
  prop?: MaybeAccessor<T | undefined>
  defaultProp: MaybeAccessor<T>
  onChange?: ChangeHandler<T>
  caller?: string
}

type AnyAction = {
  type: string
}

const noop = () => {}

function useControllableState<T>({
  prop,
  defaultProp,
  onChange = noop as ChangeHandler<T>,
  caller,
}: UseControllableStateParams<T>): [() => T, SetStateFn<T>] {
  const uncontrolled = createSignal(readValue(defaultProp))
  const emitChange = useEffectEvent(onChange)
  const controlledState = () => (prop === undefined ? undefined : readValue(prop))
  const value = () => {
    const currentProp = controlledState()
    return currentProp !== undefined ? currentProp : uncontrolled()
  }

  let lastMode = controlledState() !== undefined
  useLayoutEffect(() => {
    const nextMode = controlledState() !== undefined

    if (process.env.NODE_ENV !== 'production' && lastMode !== nextMode) {
      const from = lastMode ? 'controlled' : 'uncontrolled'
      const to = nextMode ? 'controlled' : 'uncontrolled'
      const label = caller ?? 'useControllableState'
      console.warn(
        label +
          ' is changing from ' +
          from +
          ' to ' +
          to +
          '. Components should stay either controlled or uncontrolled for their lifetime.',
      )
    }

    lastMode = nextMode
  })

  const setValue: SetStateFn<T> = (nextValue) => {
    const current = value()
    const resolved =
      typeof nextValue === 'function' ? (nextValue as (prev: T) => T)(current) : nextValue

    if (controlledState() !== undefined) {
      if (!Object.is(current, resolved)) {
        emitChange(resolved)
      }
      return
    }

    if (!Object.is(current, resolved)) {
      uncontrolled(resolved)
      emitChange(resolved)
    }
  }

  return [value, setValue]
}

function useControllableStateReducer<T, S extends object, A extends AnyAction>(
  reducer: (prevState: S & { state: T }, action: A) => S & { state: T },
  userArgs: UseControllableStateParams<T>,
  initialState: Omit<S, 'state'>,
): [() => S & { state: T }, Dispatch<A>]
function useControllableStateReducer<T, S extends object, I extends object, A extends AnyAction>(
  reducer: (prevState: S & { state: T }, action: A) => S & { state: T },
  userArgs: UseControllableStateParams<T>,
  initialArg: I,
  init: (value: I & { state: T }) => Omit<S, 'state'>,
): [() => S & { state: T }, Dispatch<A>]
function useControllableStateReducer<T, S extends object, I extends object, A extends AnyAction>(
  reducer: (prevState: S & { state: T }, action: A) => S & { state: T },
  { prop, defaultProp, onChange = noop as ChangeHandler<T>, caller }: UseControllableStateParams<T>,
  initialArg: Omit<S, 'state'> | I,
  init?: (value: I & { state: T }) => Omit<S, 'state'>,
): [() => S & { state: T }, Dispatch<A>] {
  const defaultState = () => readValue(defaultProp)
  const controlledState = () => (prop === undefined ? undefined : readValue(prop))
  const emitChange = useEffectEvent(onChange)
  const createInitialState = (): S & { state: T } => {
    const state = defaultState()
    const baseState = init
      ? init({ ...(initialArg as I), state })
      : (initialArg as Omit<S, 'state'>)

    return { ...baseState, state } as S & { state: T }
  }
  const internalState = createSignal<S & { state: T }>(createInitialState())

  let lastMode = controlledState() !== undefined
  useLayoutEffect(() => {
    const nextMode = controlledState() !== undefined

    if (process.env.NODE_ENV !== 'production' && lastMode !== nextMode) {
      const from = lastMode ? 'controlled' : 'uncontrolled'
      const to = nextMode ? 'controlled' : 'uncontrolled'
      const label = caller ?? 'useControllableStateReducer'
      console.warn(
        label +
          ' is changing from ' +
          from +
          ' to ' +
          to +
          '. Components should stay either controlled or uncontrolled for their lifetime.',
      )
    }

    lastMode = nextMode
  })

  const state = () => {
    const currentInternalState = internalState()
    const currentProp = controlledState()

    if (currentProp === undefined) {
      return currentInternalState
    }

    return {
      ...currentInternalState,
      state: currentProp,
    }
  }

  const dispatch: Dispatch<A> = (action) => {
    const prevState = state()
    const nextState = reducer(prevState, action)

    internalState(nextState)

    if (!Object.is(prevState.state, nextState.state)) {
      emitChange(nextState.state)
    }
  }

  return [state, dispatch]
}

export { useControllableState, useControllableStateReducer }
export type { AnyAction, ChangeHandler, Dispatch, SetStateFn, UseControllableStateParams }
