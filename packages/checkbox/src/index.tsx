import { mergeProps, prop, untrack, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { useControllableState, type SetStateFn } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'
import { useSize } from '@fictjs/use-size'

type MaybeAccessor<T> = T | (() => T)
type CheckedState = boolean | 'indeterminate'
type CheckboxValue = JSX.IntrinsicElements['input']['value']
type CheckboxStyle = Record<string, string | number> | undefined
type ScopedProps<P> = P & { __scopeCheckbox?: Scope<CheckboxContextValue | undefined> }
type StyleRecord = Record<string, string | number>

const CHECKBOX_NAME = 'Checkbox'
const TRIGGER_NAME = 'CheckboxTrigger'
const INDICATOR_NAME = 'CheckboxIndicator'
const BUBBLE_INPUT_NAME = 'CheckboxBubbleInput'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createCheckboxContext, createCheckboxScope] = createContextScope(CHECKBOX_NAME)

type CheckboxContextValue = {
  checked: () => CheckedState
  setChecked: SetStateFn<CheckedState>
  disabled: () => boolean
  control: () => HTMLButtonElement | null
  setControl: (node: HTMLButtonElement | null) => void
  name: () => string | undefined
  form: () => string | undefined
  value: () => CheckboxValue
  hasConsumerStoppedPropagationRef: { current: boolean }
  hasBubbleInputSyncRef: { current: boolean }
  required: () => boolean | undefined
  defaultChecked: () => boolean
  isFormControl: () => boolean
  bubbleInput: () => HTMLInputElement | null
  setBubbleInput: (node: HTMLInputElement | null) => void
}

const [CheckboxProviderImpl, useCheckboxContext] =
  createCheckboxContext<CheckboxContextValue>(CHECKBOX_NAME)

type CheckboxProviderProps = {
  checked?: MaybeAccessor<CheckedState | undefined> | undefined
  defaultChecked?: MaybeAccessor<CheckedState | undefined> | undefined
  required?: MaybeAccessor<boolean | undefined> | undefined
  onCheckedChange?: ((checked: CheckedState) => void) | undefined
  name?: MaybeAccessor<string | undefined> | undefined
  form?: MaybeAccessor<string | undefined> | undefined
  disabled?: MaybeAccessor<boolean | undefined> | undefined
  value?: MaybeAccessor<CheckboxValue | undefined> | undefined
  children?: FictNode | FictNode[]
}

type CheckboxTriggerProps = Omit<
  JSX.IntrinsicElements['button'],
  keyof CheckboxProviderProps | '__scopeCheckbox'
> & {
  asChild?: boolean
  children?: FictNode | FictNode[]
}

type CheckboxIndicatorProps = JSX.IntrinsicElements['span'] & {
  asChild?: boolean
  forceMount?: MaybeAccessor<boolean | undefined>
}

type CheckboxBubbleInputProps = Omit<JSX.IntrinsicElements['input'], 'checked'> & {
  children?: never
}

type CheckboxProps = Omit<JSX.IntrinsicElements['button'], 'checked' | 'defaultChecked'> & {
  asChild?: boolean
  checked?: MaybeAccessor<CheckedState | undefined>
  defaultChecked?: MaybeAccessor<CheckedState | undefined>
  required?: MaybeAccessor<boolean | undefined>
  onCheckedChange?: (checked: CheckedState) => void
}

function readValue<T>(value: MaybeAccessor<T>): T {
  if (
    typeof value === 'function' &&
    (value.length === 0 ||
      (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  ) {
    return (value as () => T)()
  }

  return value as T
}

function readStyle(value: MaybeAccessor<CheckboxStyle> | undefined): StyleRecord {
  const resolved = value === undefined ? undefined : readValue(value)
  return typeof resolved === 'object' && resolved !== null ? (resolved as StyleRecord) : {}
}

function isIndeterminate(checked?: CheckedState): checked is 'indeterminate' {
  return checked === 'indeterminate'
}

function normalizeChecked(checked: CheckedState): boolean {
  return isIndeterminate(checked) ? false : checked
}

function getState(checked: CheckedState): 'checked' | 'indeterminate' | 'unchecked' {
  return isIndeterminate(checked) ? 'indeterminate' : checked ? 'checked' : 'unchecked'
}

function setNativeInputChecked(input: HTMLInputElement, checked: CheckedState): void {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked')
  const setChecked = descriptor?.set
  if (!setChecked) {
    return
  }

  input.indeterminate = isIndeterminate(checked)
  setChecked.call(input, normalizeChecked(checked))
}

function CheckboxProvider(props: ScopedProps<CheckboxProviderProps>): FictNode {
  const checkedProp = () =>
    props.checked === undefined
      ? undefined
      : readValue(props.checked as MaybeAccessor<CheckedState | undefined>)
  const defaultChecked = () =>
    props.defaultChecked === undefined
      ? false
      : (readValue(props.defaultChecked as MaybeAccessor<CheckedState | undefined>) ?? false)
  const required = () =>
    props.required === undefined
      ? undefined
      : readValue(props.required as MaybeAccessor<boolean | undefined>)
  const disabled = () => Boolean(readValue(props.disabled as MaybeAccessor<unknown>))
  const name = () =>
    props.name === undefined
      ? undefined
      : readValue(props.name as MaybeAccessor<string | undefined>)
  const form = () =>
    props.form === undefined
      ? undefined
      : readValue(props.form as MaybeAccessor<string | undefined>)
  const value = () =>
    props.value === undefined
      ? 'on'
      : ((readValue(props.value as MaybeAccessor<CheckboxValue | undefined>) ??
          'on') as CheckboxValue)
  const control = createSignal<HTMLButtonElement | null>(null)
  const bubbleInput = createSignal<HTMLInputElement | null>(null)
  const isFormControl = createSignal(Boolean(form()))
  const hasConsumerStoppedPropagationRef = { current: false }
  const hasBubbleInputSyncRef = { current: false }
  const controllableStateProps = {
    prop: checkedProp,
    defaultProp: defaultChecked,
    caller: CHECKBOX_NAME,
    ...(props.onCheckedChange ? { onChange: props.onCheckedChange } : {}),
  }
  const [checked, setChecked] = useControllableState<CheckedState>(controllableStateProps)
  const updateChecked: SetStateFn<CheckedState> = (nextChecked) => {
    setChecked(nextChecked)
  }
  const initialDefaultChecked = normalizeChecked(untrack(() => checked()))
  let previousBubbleChecked = untrack(() => checked())

  useLayoutEffect(() => {
    const currentControl = control()
    isFormControl(currentControl ? Boolean(form() || currentControl.closest('form')) : true)
  })

  useLayoutEffect(() => {
    const input = bubbleInput()
    const current = checked()

    if (!input) {
      previousBubbleChecked = current
      hasBubbleInputSyncRef.current = false
      return
    }

    if (!Object.is(previousBubbleChecked, current) && !hasBubbleInputSyncRef.current) {
      const bubbles = !hasConsumerStoppedPropagationRef.current
      setNativeInputChecked(input, current)
      input.dispatchEvent(new Event('input', { bubbles }))
      input.dispatchEvent(new Event('change', { bubbles }))
    }

    previousBubbleChecked = current
    hasBubbleInputSyncRef.current = false
  })

  return (
    <CheckboxProviderImpl
      scope={props.__scopeCheckbox}
      bubbleInput={bubbleInput}
      checked={checked}
      control={control}
      defaultChecked={() => initialDefaultChecked}
      disabled={disabled}
      form={form}
      hasBubbleInputSyncRef={hasBubbleInputSyncRef}
      hasConsumerStoppedPropagationRef={hasConsumerStoppedPropagationRef}
      isFormControl={isFormControl}
      name={name}
      required={required}
      setBubbleInput={bubbleInput}
      setChecked={updateChecked}
      setControl={control}
      value={value}
    >
      {props.children}
    </CheckboxProviderImpl>
  )
}

CheckboxProvider.displayName = CHECKBOX_NAME + 'Provider'

function CheckboxTrigger(props: ScopedProps<CheckboxTriggerProps>): FictNode {
  const { __scopeCheckbox, ...triggerProps } = props
  const context = useCheckboxContext(TRIGGER_NAME, __scopeCheckbox)
  const composedRefs = useComposedRefs(props.ref as PossibleRef<HTMLButtonElement>, (node) =>
    context.setControl(node),
  )
  const initialCheckedState = untrack(() => context.checked())

  useLayoutEffect(() => {
    const formElement = context.control()?.form
    if (!formElement) {
      return
    }

    const reset = () => {
      context.setChecked(initialCheckedState)
    }

    formElement.addEventListener('reset', reset)

    return () => {
      formElement.removeEventListener('reset', reset)
    }
  })

  const handleKeyDown = composeEventHandlers<KeyboardEvent>(
    props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
      }
    },
  )

  const handleClick = composeEventHandlers<MouseEvent>(
    props.onClick as ((event: MouseEvent) => void) | undefined,
    (event) => {
      if (context.disabled()) {
        return
      }

      const nextChecked = isIndeterminate(context.checked()) ? true : !context.checked()
      context.setChecked(nextChecked)

      if (context.bubbleInput() && context.isFormControl()) {
        context.hasConsumerStoppedPropagationRef.current = event.cancelBubble
        if (!context.hasConsumerStoppedPropagationRef.current) {
          event.stopPropagation()
        }
        context.hasBubbleInputSyncRef.current = true

        queueMicrotask(() => {
          const input = context.bubbleInput()
          if (!input || !input.isConnected) {
            return
          }

          const bubbles = !context.hasConsumerStoppedPropagationRef.current
          setNativeInputChecked(input, nextChecked)
          input.dispatchEvent(new Event('input', { bubbles }))
          input.dispatchEvent(new Event('change', { bubbles }))
        })
      }
    },
  )

  useLayoutEffect(() => {
    const forwardedRef = props.ref as PossibleRef<HTMLButtonElement>
    if (!forwardedRef) {
      return
    }

    return () => {
      if (typeof forwardedRef === 'function') {
        forwardedRef(null)
        return
      }

      forwardedRef.current = null
    }
  })

  const primitiveProps = mergeProps(
    {
      type: 'button',
      role: 'checkbox',
      'aria-checked': prop(() =>
        isIndeterminate(context.checked()) ? 'mixed' : String(context.checked()),
      ),
      'aria-required': prop(() => (context.required() ? 'true' : undefined)),
      'data-state': prop(() => getState(context.checked())),
      'data-disabled': prop(() => (context.disabled() ? '' : undefined)),
      disabled: prop(context.disabled),
      value: prop(context.value),
    },
    () => triggerProps as Record<string, unknown>,
    {
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      ref: undefined,
    },
  )

  return <Primitive.button {...primitiveProps} ref={composedRefs} />
}

CheckboxTrigger.displayName = TRIGGER_NAME

function CheckboxIndicator(props: ScopedProps<CheckboxIndicatorProps>): FictNode {
  const { __scopeCheckbox, ...indicatorProps } = props
  const context = useCheckboxContext(INDICATOR_NAME, __scopeCheckbox)
  const present = () =>
    Boolean(
      (props.forceMount === undefined ? false : readValue(props.forceMount)) ||
      isIndeterminate(context.checked()) ||
      context.checked() === true,
    )
  const primitiveProps = mergeProps(() => indicatorProps as Record<string, unknown>, {
    'data-state': prop(() => getState(context.checked())),
    'data-disabled': prop(() => (context.disabled() ? '' : undefined)),
    forceMount: undefined,
    style: prop(() => ({
      pointerEvents: 'none',
      ...readStyle(props.style as MaybeAccessor<CheckboxStyle> | undefined),
    })),
  })

  return (
    <Presence present={present}>
      <Primitive.span {...primitiveProps} />
    </Presence>
  )
}

CheckboxIndicator.displayName = INDICATOR_NAME

function CheckboxBubbleInput(props: ScopedProps<CheckboxBubbleInputProps>): FictNode {
  const { __scopeCheckbox, ...inputProps } = props
  const context = useCheckboxContext(BUBBLE_INPUT_NAME, __scopeCheckbox)
  const composedRefs = useComposedRefs(props.ref as PossibleRef<HTMLInputElement>, (node) =>
    context.setBubbleInput(node),
  )
  const controlSize = useSize(context.control)

  useLayoutEffect(() => {
    const input = context.bubbleInput()
    if (!input) {
      return
    }

    input.indeterminate = isIndeterminate(context.checked())
  })

  const primitiveProps = mergeProps(
    {
      type: 'checkbox',
      'aria-hidden': true,
      defaultChecked: prop(context.defaultChecked),
      disabled: prop(context.disabled),
      'attr:form': prop(context.form),
      name: prop(context.name),
      required: prop(context.required),
      value: prop(context.value),
      tabIndex: -1,
    },
    () => inputProps as Record<string, unknown>,
    {
      ref: undefined,
      style: prop(() => {
        const nextControlSize = controlSize()
        return {
          ...readStyle(props.style as MaybeAccessor<CheckboxStyle> | undefined),
          ...(nextControlSize
            ? {
                height: `${nextControlSize.height}px`,
                width: `${nextControlSize.width}px`,
              }
            : {}),
          margin: 0,
          opacity: 0,
          pointerEvents: 'none',
          position: 'absolute',
          transform: 'translateX(-100%)',
        }
      }),
    },
  )

  return <Primitive.input {...primitiveProps} ref={composedRefs} />
}

CheckboxBubbleInput.displayName = BUBBLE_INPUT_NAME

function CheckboxRootBubbleInput(props: {
  __scopeCheckbox?: Scope<CheckboxContextValue | undefined>
}): FictNode {
  const context = useCheckboxContext(CHECKBOX_NAME, props.__scopeCheckbox)

  return (
    <>
      {() =>
        context.isFormControl() ? (
          <CheckboxBubbleInput __scopeCheckbox={props.__scopeCheckbox} />
        ) : null
      }
    </>
  )
}

function Checkbox(props: ScopedProps<CheckboxProps>): FictNode {
  const {
    __scopeCheckbox,
    checked,
    defaultChecked,
    disabled,
    form,
    name,
    onCheckedChange,
    required,
    value,
    ...checkboxProps
  } = props

  useLayoutEffect(() => {
    const forwardedRef = props.ref as PossibleRef<HTMLButtonElement>
    if (!forwardedRef) {
      return
    }

    return () => {
      if (typeof forwardedRef === 'function') {
        forwardedRef(null)
        return
      }

      forwardedRef.current = null
    }
  })

  return (
    <CheckboxProvider
      __scopeCheckbox={__scopeCheckbox}
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      form={form}
      name={name}
      onCheckedChange={onCheckedChange}
      required={required}
      value={value}
    >
      <CheckboxTrigger __scopeCheckbox={__scopeCheckbox} {...checkboxProps} />
      <CheckboxRootBubbleInput __scopeCheckbox={__scopeCheckbox} />
    </CheckboxProvider>
  )
}

Checkbox.displayName = CHECKBOX_NAME

const Root = Checkbox
const Provider = CheckboxProvider
const Trigger = CheckboxTrigger
const Indicator = CheckboxIndicator
const BubbleInput = CheckboxBubbleInput
const unstable_Provider = CheckboxProvider
const unstable_Trigger = CheckboxTrigger
const unstable_CheckboxProvider = CheckboxProvider
const unstable_CheckboxTrigger = CheckboxTrigger
const unstable_CheckboxBubbleInput = CheckboxBubbleInput
const unstable_BubbleInput = CheckboxBubbleInput

export {
  createCheckboxScope,
  Checkbox,
  CheckboxProvider,
  CheckboxTrigger,
  CheckboxIndicator,
  CheckboxBubbleInput,
  Root,
  Provider,
  Trigger,
  Indicator,
  BubbleInput,
  unstable_Provider,
  unstable_Trigger,
  unstable_CheckboxProvider,
  unstable_CheckboxTrigger,
  unstable_CheckboxBubbleInput,
  unstable_BubbleInput,
}
export type {
  CheckboxProps,
  CheckboxProviderProps,
  CheckboxTriggerProps,
  CheckboxIndicatorProps,
  CheckboxBubbleInputProps,
  CheckedState,
}
