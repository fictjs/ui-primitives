type MaybeAccessor<T> = T | (() => T)

const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

function isReadableAccessor<T>(value: MaybeAccessor<T>): value is () => T {
  return (
    typeof value === 'function' &&
    (value.length === 0 ||
      (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  )
}

function readValue<T>(value: MaybeAccessor<T>): T {
  let currentValue: unknown = value

  for (let depth = 0; depth < 10 && isReadableAccessor(currentValue); depth += 1) {
    currentValue = (currentValue as () => unknown)()
  }

  return currentValue as T
}

import { untrack } from '@fictjs/runtime'
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

  let lastMode = untrack(() => controlledState() !== undefined)
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

  let lastMode = untrack(() => controlledState() !== undefined)
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
