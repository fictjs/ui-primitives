import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useId } from '@fictjs/id'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useEffectEvent } from '@fictjs/use-effect-event'
import { useIsHydrated } from '@fictjs/use-is-hydrated'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopePasswordToggleField?: Scope }
type InternalFocusState = {
  clickTriggered: boolean
  selectionStart: number | null
  selectionEnd: number | null
}
type PrimitiveInputProps = JSX.IntrinsicElements['input']
type PrimitiveButtonProps = JSX.IntrinsicElements['button']
type PrimitiveSvgProps = JSX.IntrinsicElements['svg']

const PASSWORD_TOGGLE_FIELD_NAME = 'PasswordToggleField'
const PASSWORD_TOGGLE_FIELD_INPUT_NAME = PASSWORD_TOGGLE_FIELD_NAME + 'Input'
const PASSWORD_TOGGLE_FIELD_TOGGLE_NAME = PASSWORD_TOGGLE_FIELD_NAME + 'Toggle'
const PASSWORD_TOGGLE_FIELD_SLOT_NAME = PASSWORD_TOGGLE_FIELD_NAME + 'Slot'
const PASSWORD_TOGGLE_FIELD_ICON_NAME = PASSWORD_TOGGLE_FIELD_NAME + 'Icon'
const INITIAL_FOCUS_STATE: InternalFocusState = {
  clickTriggered: false,
  selectionStart: null,
  selectionEnd: null,
}

const [createPasswordToggleFieldContext] = createContextScope(PASSWORD_TOGGLE_FIELD_NAME)

type PasswordToggleFieldContextValue = {
  inputId: () => string
  inputRef: { current: HTMLInputElement | null }
  visible: () => boolean
  setVisible(next: boolean | ((previous: boolean) => boolean)): void
  syncInputId(providedId: string | number | undefined): void
  focusState: { current: InternalFocusState }
}

const [PasswordToggleFieldProvider, usePasswordToggleFieldContext] =
  createPasswordToggleFieldContext<PasswordToggleFieldContextValue>(PASSWORD_TOGGLE_FIELD_NAME)

type PasswordToggleFieldProps = {
  id?: string
  visible?: MaybeAccessor<boolean | undefined>
  defaultVisible?: MaybeAccessor<boolean | undefined>
  onVisibilityChange?: (visible: boolean) => void
  /** @deprecated Use `onVisibilityChange` instead. */
  onVisiblityChange?: (visible: boolean) => void
  children?: FictNode | FictNode[]
}

type PasswordToggleFieldOwnProps = {
  autoComplete?: 'current-password' | 'new-password'
}

type PasswordToggleFieldInputProps = Omit<
  PrimitiveInputProps,
  keyof PasswordToggleFieldOwnProps | 'type'
> &
  PasswordToggleFieldOwnProps

type PasswordToggleFieldToggleProps = Omit<PrimitiveButtonProps, 'type'>

type PasswordToggleFieldSlotDeclarativeProps = {
  visible: FictNode
  hidden: FictNode
}

type PasswordToggleFieldSlotRenderProps = {
  render: (args: { visible: boolean }) => FictNode
}

type PasswordToggleFieldSlotProps =
  | PasswordToggleFieldSlotDeclarativeProps
  | PasswordToggleFieldSlotRenderProps

type PasswordToggleFieldIconProps = Omit<PrimitiveSvgProps, 'children' | 'hidden'> & {
  visible: FictNode
  hidden: FictNode
}

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

function PasswordToggleField(props: ScopedProps<PasswordToggleFieldProps>): FictNode {
  const baseId = useId(() => props.id)
  const inputIdState = createSignal<string | null>(`${baseId()}-input`)
  const inputId = () => inputIdState() ?? `${baseId()}-input`
  const visibleProp = () =>
    props.visible === undefined
      ? undefined
      : readValue(props.visible as MaybeAccessor<boolean | undefined>)
  const defaultVisible = () =>
    props.defaultVisible === undefined
      ? false
      : (readValue(props.defaultVisible as MaybeAccessor<boolean | undefined>) ?? false)
  const onVisibilityChange = (nextVisible: boolean) =>
    (props.onVisibilityChange ?? props.onVisiblityChange)?.(nextVisible)
  const [visible, setVisible] = useControllableState<boolean>({
    caller: PASSWORD_TOGGLE_FIELD_NAME,
    prop: visibleProp,
    defaultProp: defaultVisible,
    onChange: onVisibilityChange,
  })
  const inputRef = { current: null as HTMLInputElement | null }
  const focusState = { current: { ...INITIAL_FOCUS_STATE } }

  return (
    <PasswordToggleFieldProvider
      scope={props.__scopePasswordToggleField as Scope<PasswordToggleFieldContextValue | undefined>}
      inputId={inputId}
      inputRef={inputRef}
      visible={visible}
      setVisible={setVisible}
      syncInputId={(providedId) => {
        inputIdState(providedId != null ? String(providedId) : null)
      }}
      focusState={focusState}
    >
      {props.children}
    </PasswordToggleFieldProvider>
  )
}

PasswordToggleField.displayName = PASSWORD_TOGGLE_FIELD_NAME

function PasswordToggleFieldInput(props: ScopedProps<PasswordToggleFieldInputProps>): FictNode {
  const { __scopePasswordToggleField } = props
  const { visible, inputRef, inputId, syncInputId, setVisible, focusState } =
    usePasswordToggleFieldContext(
      PASSWORD_TOGGLE_FIELD_INPUT_NAME,
      __scopePasswordToggleField as Scope<PasswordToggleFieldContextValue | undefined>,
    )
  const inputNode = createSignal<HTMLInputElement | null>(null)
  const resetVisibility = useEffectEvent(() => {
    setVisible(false)
  })

  useLayoutEffect(() => {
    syncInputId(props.id)
  })

  useLayoutEffect(() => {
    const inputElement = inputNode()
    const form = inputElement?.form
    if (!form) return

    const handleReset = (event: Event) => {
      if (!event.defaultPrevented) {
        resetVisibility()
      }
    }
    const handleSubmit = () => {
      resetVisibility()
    }

    form.addEventListener('reset', handleReset)
    form.addEventListener('submit', handleSubmit)
    return () => {
      form.removeEventListener('reset', handleReset)
      form.removeEventListener('submit', handleSubmit)
    }
  })

  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopePasswordToggleField: undefined,
      id: prop(() => props.id ?? inputId()),
      autoCapitalize: prop(() => props.autoCapitalize ?? 'off'),
      autoComplete: prop(() => props.autoComplete ?? 'current-password'),
      spellCheck: prop(() => props.spellCheck ?? false),
      type: prop(() => (visible() ? 'text' : 'password')),
      ref: useComposedRefs(props.ref as PossibleRef<HTMLInputElement>, inputRef, inputNode),
      onBlur: composeEventHandlers<FocusEvent>(
        (event) => (props.onBlur as ((event: FocusEvent) => void) | undefined)?.(event),
        (event) => {
          const input = event.currentTarget as HTMLInputElement
          focusState.current.selectionStart = input.selectionStart
          focusState.current.selectionEnd = input.selectionEnd
        },
      ),
    },
  )

  return <Primitive.input {...(primitiveProps as Record<string, unknown>)} />
}

PasswordToggleFieldInput.displayName = PASSWORD_TOGGLE_FIELD_INPUT_NAME

function PasswordToggleFieldToggle(props: ScopedProps<PasswordToggleFieldToggleProps>): FictNode {
  const { __scopePasswordToggleField } = props
  const { setVisible, visible, inputRef, inputId, focusState } = usePasswordToggleFieldContext(
    PASSWORD_TOGGLE_FIELD_TOGGLE_NAME,
    __scopePasswordToggleField as Scope<PasswordToggleFieldContextValue | undefined>,
  )
  const internalAriaLabel = createSignal<string | undefined>(undefined)
  const elementRef = { current: null as HTMLButtonElement | null }
  const isHydrated = useIsHydrated()

  useLayoutEffect(() => {
    const element = elementRef.current
    if (!element || props['aria-label']) {
      internalAriaLabel(undefined)
      return
    }

    const defaultAriaLabel = visible() ? 'Hide password' : 'Show password'
    const syncLabel = (textContent: string | null | undefined) => {
      internalAriaLabel(textContent ? undefined : defaultAriaLabel)
    }

    syncLabel(element.textContent)
    const observer = new MutationObserver(() => {
      syncLabel(element.textContent)
    })
    observer.observe(element, { characterData: true, subtree: true, childList: true })
    return () => observer.disconnect()
  })

  useLayoutEffect(() => {
    let cleanup = () => {}
    const ownerWindow = elementRef.current?.ownerDocument?.defaultView ?? window
    const reset = () => {
      focusState.current.clickTriggered = false
    }
    const handlePointerUp = () => {
      cleanup = requestIdleCallback(ownerWindow, reset)
    }

    ownerWindow.addEventListener('pointerup', handlePointerUp)
    return () => {
      cleanup()
      ownerWindow.removeEventListener('pointerup', handlePointerUp)
    }
  })

  const primitiveProps = mergeProps(
    {
      type: 'button',
      'aria-controls': prop(() => (isHydrated() ? inputId() : undefined)),
      'aria-hidden': prop(() => (isHydrated() ? props['aria-hidden'] : true)),
      'aria-label': prop(() => props['aria-label'] ?? internalAriaLabel()),
      tabIndex: prop(() => (isHydrated() ? props.tabIndex : -1)),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopePasswordToggleField: undefined,
      children: undefined,
      ref: useComposedRefs(props.ref as PossibleRef<HTMLButtonElement>, elementRef),
      onFocus: composeEventHandlers<FocusEvent>(
        (event) => (props.onFocus as ((event: FocusEvent) => void) | undefined)?.(event),
        () => {
          focusState.current.clickTriggered = false
        },
      ),
      onPointerDown: composeEventHandlers<PointerEvent>(
        (event) => (props.onPointerDown as ((event: PointerEvent) => void) | undefined)?.(event),
        () => {
          focusState.current.clickTriggered = true
        },
      ),
      onPointerCancel: (event: PointerEvent) => {
        ;(props.onPointerCancel as ((event: PointerEvent) => void) | undefined)?.(event)
        focusState.current = { ...INITIAL_FOCUS_STATE }
      },
      onClick: (event: MouseEvent) => {
        ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
        if (event.defaultPrevented) {
          focusState.current = { ...INITIAL_FOCUS_STATE }
          return
        }

        setVisible((previousVisible) => !previousVisible)
        if (focusState.current.clickTriggered) {
          const input = inputRef.current
          if (input) {
            const { selectionStart, selectionEnd } = focusState.current
            input.focus()
            if (selectionStart !== null || selectionEnd !== null) {
              requestAnimationFrame(() => {
                if (input.ownerDocument.activeElement === input) {
                  input.selectionStart = selectionStart
                  input.selectionEnd = selectionEnd
                }
              })
            }
          }
        }

        focusState.current = { ...INITIAL_FOCUS_STATE }
      },
      onPointerUp: (event: PointerEvent) => {
        ;(props.onPointerUp as ((event: PointerEvent) => void) | undefined)?.(event)
        setTimeout(() => {
          focusState.current = { ...INITIAL_FOCUS_STATE }
        }, 50)
      },
    },
  )

  return (
    <Primitive.button {...(primitiveProps as Record<string, unknown>)}>
      {props.children}
    </Primitive.button>
  )
}

PasswordToggleFieldToggle.displayName = PASSWORD_TOGGLE_FIELD_TOGGLE_NAME

function PasswordToggleFieldSlot(props: ScopedProps<PasswordToggleFieldSlotProps>): FictNode {
  const { visible } = usePasswordToggleFieldContext(
    PASSWORD_TOGGLE_FIELD_SLOT_NAME,
    props.__scopePasswordToggleField as Scope<PasswordToggleFieldContextValue | undefined>,
  )

  return (
    <>
      {reactive(() =>
        'render' in props
          ? props.render({ visible: visible() })
          : visible()
            ? props.visible
            : props.hidden,
      )}
    </>
  )
}

PasswordToggleFieldSlot.displayName = PASSWORD_TOGGLE_FIELD_SLOT_NAME

function PasswordToggleFieldIcon(props: ScopedProps<PasswordToggleFieldIconProps>): FictNode {
  const { visible } = usePasswordToggleFieldContext(
    PASSWORD_TOGGLE_FIELD_ICON_NAME,
    props.__scopePasswordToggleField as Scope<PasswordToggleFieldContextValue | undefined>,
  )
  const svgProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopePasswordToggleField: undefined,
      hidden: undefined,
      visible: undefined,
      'aria-hidden': true,
    },
  )

  return (
    <>
      {reactive(() => (
        <Primitive.svg {...svgProps} asChild>
          {visible() ? props.visible : props.hidden}
        </Primitive.svg>
      ))}
    </>
  )
}

PasswordToggleFieldIcon.displayName = PASSWORD_TOGGLE_FIELD_ICON_NAME

function requestIdleCallback(
  ownerWindow: Window,
  callback: IdleRequestCallback,
  options?: IdleRequestOptions,
): () => void {
  const idleWindow = ownerWindow as Window & {
    requestIdleCallback?: typeof ownerWindow.requestIdleCallback
    cancelIdleCallback?: typeof ownerWindow.cancelIdleCallback
  }

  if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
    const id = idleWindow.requestIdleCallback(callback, options)
    return () => idleWindow.cancelIdleCallback?.(id)
  }

  const start = Date.now()
  const id = ownerWindow.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    })
  }, 1)

  return () => ownerWindow.clearTimeout(id)
}

const Root = PasswordToggleField
const Input = PasswordToggleFieldInput
const Toggle = PasswordToggleFieldToggle
const Slot = PasswordToggleFieldSlot
const Icon = PasswordToggleFieldIcon

export {
  PasswordToggleField,
  PasswordToggleFieldInput,
  PasswordToggleFieldToggle,
  PasswordToggleFieldSlot,
  PasswordToggleFieldIcon,
  Root,
  Input,
  Toggle,
  Slot,
  Icon,
}
export type {
  PasswordToggleFieldProps,
  PasswordToggleFieldInputProps,
  PasswordToggleFieldToggleProps,
  PasswordToggleFieldSlotProps,
  PasswordToggleFieldIconProps,
}
