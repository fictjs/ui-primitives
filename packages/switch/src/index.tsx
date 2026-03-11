import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'
import { useSize } from '@fictjs/use-size'

type MaybeAccessor<T> = T | (() => T)
type SwitchValue = JSX.IntrinsicElements['button']['value']
type SwitchStyle = Record<string, string | number> | undefined
type ScopedProps<P> = P & { __scopeSwitch?: Scope<SwitchContextValue | undefined> }

const SWITCH_NAME = 'Switch'
const THUMB_NAME = 'SwitchThumb'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createSwitchContext, createSwitchScope] = createContextScope(SWITCH_NAME)

type SwitchContextValue = {
  checked: () => boolean
  disabled: () => boolean
}

const [SwitchProvider, useSwitchContext] = createSwitchContext<SwitchContextValue>(SWITCH_NAME)

type SwitchProps = JSX.IntrinsicElements['button'] & {
  checked?: MaybeAccessor<boolean | undefined>
  defaultChecked?: MaybeAccessor<boolean | undefined>
  required?: MaybeAccessor<boolean | undefined>
  onCheckedChange?: (checked: boolean) => void
}

type SwitchThumbProps = JSX.IntrinsicElements['span']

type SwitchBubbleInputProps = Omit<
  JSX.IntrinsicElements['input'],
  'checked' | 'disabled' | 'form' | 'name' | 'required' | 'style' | 'type' | 'value'
> & {
  checked: () => boolean
  control: () => HTMLElement | null
  bubbles: MaybeAccessor<boolean>
  disabled?: MaybeAccessor<boolean | undefined>
  form?: MaybeAccessor<string | undefined>
  inputRef?: PossibleRef<HTMLInputElement>
  name?: MaybeAccessor<string | undefined>
  required?: MaybeAccessor<boolean | undefined>
  style?: MaybeAccessor<SwitchStyle>
  value?: MaybeAccessor<JSX.IntrinsicElements['input']['value'] | undefined>
}

type StyleRecord = Record<string, string | number>

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

function readStyle(value: MaybeAccessor<SwitchStyle> | undefined): StyleRecord {
  const resolved = value === undefined ? undefined : readValue(value)
  return typeof resolved === 'object' && resolved !== null ? (resolved as StyleRecord) : {}
}

function getState(checked: boolean): 'checked' | 'unchecked' {
  return checked ? 'checked' : 'unchecked'
}

function Switch(props: ScopedProps<SwitchProps>): FictNode {
  const {
    __scopeSwitch,
    checked: checkedInput,
    defaultChecked: defaultCheckedInput,
    form: formInput,
    name: nameInput,
    onCheckedChange,
    required: requiredInput,
    ...buttonProps
  } = props
  const button = createSignal<HTMLButtonElement | null>(null)
  const bubbleInput = createSignal<HTMLInputElement | null>(null)
  const isFormControl = createSignal(true)
  const checkedProp = () =>
    checkedInput === undefined ? undefined : readValue(checkedInput as MaybeAccessor<boolean | undefined>)
  const defaultChecked = () =>
    defaultCheckedInput === undefined ? false : (readValue(defaultCheckedInput) ?? false)
  const required = () =>
    requiredInput === undefined ? undefined : readValue(requiredInput as MaybeAccessor<boolean | undefined>)
  const disabled = () => Boolean(readValue(props.disabled as MaybeAccessor<unknown>))
  const name = () =>
    nameInput === undefined ? undefined : readValue(nameInput as MaybeAccessor<string | undefined>)
  const value = () =>
    props.value === undefined
      ? 'on'
      : (readValue(props.value as MaybeAccessor<SwitchValue | undefined>) ?? 'on')
  const form = () =>
    formInput === undefined ? undefined : readValue(formInput as MaybeAccessor<string | undefined>)
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLButtonElement>,
    (node) => button(node),
  )
  const controllableStateProps = {
    prop: checkedProp,
    defaultProp: defaultChecked,
    caller: SWITCH_NAME,
    ...(onCheckedChange ? { onChange: onCheckedChange } : {}),
  }
  const [checked, setChecked] = useControllableState<boolean>(controllableStateProps)
  let hasConsumerStoppedPropagation = false

  useLayoutEffect(() => {
    const currentButton = button()
    isFormControl(currentButton ? Boolean(form() || currentButton.closest('form')) : true)
  })

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

  const handleClick = composeEventHandlers<MouseEvent>(
    props.onClick as ((event: MouseEvent) => void) | undefined,
    (event) => {
      if (disabled()) {
        return
      }

      const nextChecked = !checked()
      setChecked(nextChecked)
      if (isFormControl()) {
        hasConsumerStoppedPropagation = event.cancelBubble
        if (!hasConsumerStoppedPropagation) {
          event.stopPropagation()
        }

        queueMicrotask(() => {
          queueMicrotask(() => {
            const currentInput = bubbleInput()
            if (!currentInput || !currentInput.isConnected) {
              return
            }

            currentInput.checked = nextChecked
            currentInput.dispatchEvent(
              new Event('click', {
                bubbles: !hasConsumerStoppedPropagation,
              }),
            )
          })
        })
      }
    },
  )

  const switchProps = mergeProps(
    {
      type: 'button',
      role: 'switch',
      'aria-checked': prop(() => (checked() ? 'true' : 'false')),
      'aria-required': prop(() => (required() ? 'true' : undefined)),
      'data-state': prop(() => getState(checked())),
      'data-disabled': prop(() => (disabled() ? '' : undefined)),
    },
    () => buttonProps as Record<string, unknown>,
    {
      __scopeSwitch: undefined,
      onCheckedChange: undefined,
      onClick: handleClick,
      ref: undefined,
      value: prop(value),
    },
  )
  const bubbleInputNode = (() =>
    isFormControl() ? (
      <SwitchBubbleInput
        bubbles={() => !hasConsumerStoppedPropagation}
        checked={checked}
        control={button}
        disabled={disabled}
        form={form}
        inputRef={(node) => bubbleInput(node)}
        name={name}
        required={required}
        style={{ transform: 'translateX(-100%)' }}
        value={value}
      />
    ) : null) as unknown as FictNode

  return (
    <SwitchProvider scope={__scopeSwitch} checked={checked} disabled={disabled}>
      <>
        <Primitive.button {...switchProps} ref={composedRefs} />
        {bubbleInputNode}
      </>
    </SwitchProvider>
  )
}

Switch.displayName = SWITCH_NAME

function SwitchThumb(props: ScopedProps<SwitchThumbProps>): FictNode {
  const { __scopeSwitch, ...thumbProps } = props
  const context = useSwitchContext(THUMB_NAME, __scopeSwitch)
  const primitiveProps = mergeProps(
    () => thumbProps as Record<string, unknown>,
    {
      'data-state': prop(() => getState(context.checked())),
      'data-disabled': prop(() => (context.disabled() ? '' : undefined)),
    },
  )

  return <Primitive.span {...primitiveProps} />
}

SwitchThumb.displayName = THUMB_NAME

function SwitchBubbleInput(props: SwitchBubbleInputProps): FictNode {
  const { form: formProp, ...inputRestProps } = props
  const controlSize = useSize(props.control)

  const inputProps = mergeProps(
    () => inputRestProps as Record<string, unknown>,
    {
      'aria-hidden': true,
      checked: prop(props.checked),
      control: undefined,
      bubbles: undefined,
      children: undefined,
      disabled: prop(() => (props.disabled === undefined ? undefined : Boolean(readValue(props.disabled)))),
      'attr:form': prop(() =>
        formProp === undefined ? undefined : readValue(formProp as MaybeAccessor<string | undefined>),
      ),
      name: prop(() =>
        props.name === undefined ? undefined : readValue(props.name as MaybeAccessor<string | undefined>),
      ),
      inputRef: undefined,
      ref: undefined,
      required: prop(() =>
        props.required === undefined ? undefined : Boolean(readValue(props.required as MaybeAccessor<unknown>)),
      ),
      style: prop(() => {
        const nextControlSize = controlSize()
        return {
          ...readStyle(props.style),
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
        }
      }),
      tabIndex: -1,
      type: 'checkbox',
      value: prop(() =>
        props.value === undefined
          ? undefined
          : readValue(props.value as MaybeAccessor<JSX.IntrinsicElements['input']['value'] | undefined>),
      ),
    },
  )

  if (props.inputRef) {
    return <Primitive.input {...inputProps} ref={props.inputRef} />
  }

  return <Primitive.input {...inputProps} />
}

SwitchBubbleInput.displayName = 'SwitchBubbleInput'

const Root = Switch
const Thumb = SwitchThumb

export { createSwitchScope, Switch, SwitchThumb, Root, Thumb }
export type { SwitchProps, SwitchThumbProps }
