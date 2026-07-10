import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { useLayoutEffect } from '@fictjs/use-layout-effect'
import { usePrevious } from '@fictjs/use-previous'
import { useSize } from '@fictjs/use-size'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeRadio?: Scope }
type StyleRecord = Record<string, string | number>

const RADIO_NAME = 'Radio'
const INDICATOR_NAME = 'RadioIndicator'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createRadioContext, createRadioScope] = createContextScope(RADIO_NAME)

type RadioContextValue = {
  checked: () => boolean
  disabled: () => boolean
}

const [RadioProvider, useRadioContext] = createRadioContext<RadioContextValue>(RADIO_NAME)

type RadioProps = Omit<JSX.IntrinsicElements['button'], 'disabled' | 'onChange'> & {
  asChild?: boolean
  checked?: MaybeAccessor<boolean | undefined>
  defaultChecked?: MaybeAccessor<boolean | undefined>
  disabled?: MaybeAccessor<boolean | undefined>
  required?: MaybeAccessor<boolean | undefined>
  onCheck?: () => void
}

type RadioIndicatorProps = JSX.IntrinsicElements['span'] & {
  asChild?: boolean
  forceMount?: MaybeAccessor<boolean | undefined>
}

type RadioBubbleInputProps = Omit<
  JSX.IntrinsicElements['input'],
  'checked' | 'disabled' | 'form' | 'name' | 'required' | 'value'
> & {
  checked: MaybeAccessor<boolean>
  control: MaybeAccessor<HTMLButtonElement | null>
  bubbles: MaybeAccessor<boolean | undefined>
  disabled?: MaybeAccessor<boolean | undefined>
  form?: MaybeAccessor<string | undefined>
  name?: MaybeAccessor<string | undefined>
  required?: MaybeAccessor<boolean | undefined>
  value?: MaybeAccessor<JSX.IntrinsicElements['input']['value'] | undefined>
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

function readStyle(value: unknown): StyleRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as StyleRecord
}

function getState(checked: boolean): 'checked' | 'unchecked' {
  return checked ? 'checked' : 'unchecked'
}

function Radio(props: ScopedProps<RadioProps>): FictNode {
  const {
    __scopeRadio,
    checked: checkedProp = false,
    defaultChecked,
    form: formInput,
    name: nameInput,
    required,
    onCheck,
    value: valueInput,
    ...radioProps
  } = props
  const button = createSignal<HTMLButtonElement | null>(null)
  const composedRefs = useComposedRefs(props.ref as PossibleRef<HTMLButtonElement>, (node) =>
    button(node),
  )
  const checked = () => Boolean(readValue(checkedProp as MaybeAccessor<boolean | undefined>))
  const disabled = () => Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>))
  const requiredValue = () =>
    required === undefined
      ? undefined
      : Boolean(readValue(required as MaybeAccessor<boolean | undefined>))
  const form = () =>
    formInput === undefined ? undefined : readValue(formInput as MaybeAccessor<string | undefined>)
  const name = () =>
    nameInput === undefined ? undefined : readValue(nameInput as MaybeAccessor<string | undefined>)
  const value = () =>
    valueInput === undefined
      ? 'on'
      : (readValue(
          valueInput as MaybeAccessor<JSX.IntrinsicElements['input']['value'] | undefined>,
        ) ?? 'on')
  const hasConsumerStoppedPropagationRef = { current: false }
  const isFormControl = createSignal(true)

  useLayoutEffect(() => {
    const currentButton = button()
    const formId = form()
    let cancelled = false

    // Fict assigns refs before the enclosing tree is attached. Defer the DOM lookup
    // until the complete render has been inserted into its parent.
    queueMicrotask(() => {
      if (!cancelled) {
        isFormControl(currentButton ? Boolean(formId || currentButton.closest('form')) : true)
      }
    })

    return () => {
      cancelled = true
    }
  })
  const primitiveProps = mergeProps(
    {
      type: 'button',
      role: 'radio',
      'aria-checked': prop(() => (checked() ? 'true' : 'false')),
      'data-state': prop(() => getState(checked())),
      'data-disabled': prop(() => (disabled() ? '' : undefined)),
    },
    prop(() => radioProps as Record<string, unknown>),
    {
      __scopeRadio: undefined,
      checked: undefined,
      disabled: prop(() => (disabled() ? true : undefined)),
      onCheck: undefined,
      ref: undefined,
      required: undefined,
      onClick: composeEventHandlers<MouseEvent>(
        props.onClick as ((event: MouseEvent) => void) | undefined,
        (event) => {
          if (!checked()) {
            onCheck?.()
          }

          if (isFormControl()) {
            hasConsumerStoppedPropagationRef.current = event.defaultPrevented
            if (!hasConsumerStoppedPropagationRef.current) {
              event.stopPropagation()
            }
          }
        },
      ),
      value: prop(value),
    },
  )
  // Defer the form-owner check until layout, after the button has been inserted into
  // its ancestor form. Evaluating `closest('form')` from the ref assignment is too early.
  const bubbleInputNode = reactive(() =>
    isFormControl() ? (
      <RadioBubbleInput
        bubbles={() => !hasConsumerStoppedPropagationRef.current}
        checked={checked}
        control={button}
        defaultChecked={
          defaultChecked === undefined
            ? checked()
            : Boolean(readValue(defaultChecked as MaybeAccessor<boolean | undefined>))
        }
        disabled={props.disabled}
        form={formInput}
        name={nameInput}
        required={required}
        style={{ transform: 'translateX(-100%)' }}
        value={valueInput}
      />
    ) : null,
  ) as unknown as FictNode

  return (
    <RadioProvider
      scope={__scopeRadio as Scope<RadioContextValue | undefined>}
      checked={checked}
      disabled={disabled}
    >
      <>
        <Primitive.button {...primitiveProps} ref={composedRefs} />
        {bubbleInputNode}
      </>
    </RadioProvider>
  )
}

Radio.displayName = RADIO_NAME

function RadioIndicator(props: ScopedProps<RadioIndicatorProps>): FictNode {
  const { __scopeRadio, forceMount, ...indicatorProps } = props
  const context = useRadioContext(
    INDICATOR_NAME,
    __scopeRadio as Scope<RadioContextValue | undefined>,
  )
  const primitiveProps = mergeProps(
    prop(() => indicatorProps as Record<string, unknown>),
    {
      'data-state': prop(() => getState(context.checked())),
      'data-disabled': prop(() => (context.disabled() ? '' : undefined)),
    },
  )

  return (
    <Presence
      present={() =>
        Boolean(
          (forceMount === undefined
            ? false
            : readValue(forceMount as MaybeAccessor<boolean | undefined>)) || context.checked(),
        )
      }
    >
      {() => <Primitive.span {...primitiveProps} />}
    </Presence>
  )
}

RadioIndicator.displayName = INDICATOR_NAME

function RadioBubbleInput(props: RadioBubbleInputProps): FictNode {
  const { form: formProp, ...inputRestProps } = props
  const ref = createSignal<HTMLInputElement | null>(null)
  const composedRefs = useComposedRefs(props.ref as PossibleRef<HTMLInputElement>, (node) =>
    ref(node),
  )
  const controlSize = useSize(props.control)
  const previousChecked = usePrevious(props.checked)

  useLayoutEffect(() => {
    const input = ref()
    if (!input) {
      return
    }

    const prevChecked = previousChecked()
    const nextChecked = readValue(props.checked)
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked')
    const setChecked = descriptor?.set

    if (!Object.is(prevChecked, nextChecked) && setChecked) {
      setChecked.call(input, nextChecked)
      input.dispatchEvent(
        new Event('click', {
          bubbles: Boolean(readValue(props.bubbles as MaybeAccessor<boolean | undefined>)),
        }),
      )
    }
  })

  const inputProps = mergeProps(
    prop(() => inputRestProps as Record<string, unknown>),
    {
      'aria-hidden': true,
      bubbles: undefined,
      checked: prop(() => readValue(props.checked)),
      control: undefined,
      disabled: prop(() =>
        props.disabled === undefined
          ? undefined
          : Boolean(readValue(props.disabled as MaybeAccessor<unknown>)),
      ),
      'attr:form': prop(() =>
        formProp === undefined
          ? undefined
          : readValue(formProp as MaybeAccessor<string | undefined>),
      ),
      name: prop(() =>
        props.name === undefined
          ? undefined
          : readValue(props.name as MaybeAccessor<string | undefined>),
      ),
      ref: undefined,
      required: prop(() =>
        props.required === undefined
          ? undefined
          : Boolean(readValue(props.required as MaybeAccessor<unknown>)),
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
      type: 'radio',
      value: prop(() =>
        props.value === undefined
          ? undefined
          : readValue(
              props.value as MaybeAccessor<JSX.IntrinsicElements['input']['value'] | undefined>,
            ),
      ),
    },
  )

  return <Primitive.input {...inputProps} ref={composedRefs} />
}

RadioBubbleInput.displayName = 'RadioBubbleInput'

export { createRadioScope, Radio, RadioIndicator }
export type { RadioProps, RadioIndicatorProps }
