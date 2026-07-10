import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useDirection, type Direction } from '@fictjs/direction'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useIsHydrated } from '@fictjs/use-is-hydrated'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type Orientation = 'horizontal' | 'vertical'
type InputType = 'password' | 'text'
type AutoComplete = 'off' | 'one-time-code'
type InputValidationType = 'alpha' | 'numeric' | 'alphanumeric' | 'none'
type ScopedProps<P> = P & { __scopeOneTimePasswordField?: Scope }
type PossibleRef<T> = ((node: T | null) => void) | { current: T | null } | null | undefined

const INPUT_VALIDATION_MAP = {
  numeric: {
    regexp: /[^\d]/g,
    pattern: '\\d{1}',
    inputMode: 'numeric',
  },
  alpha: {
    regexp: /[^a-zA-Z]/g,
    pattern: '[a-zA-Z]{1}',
    inputMode: 'text',
  },
  alphanumeric: {
    regexp: /[^a-zA-Z0-9]/g,
    pattern: '[a-zA-Z0-9]{1}',
    inputMode: 'text',
  },
  none: null,
} as const

const ONE_TIME_PASSWORD_FIELD_NAME = 'OneTimePasswordField'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createOneTimePasswordFieldContext, createOneTimePasswordFieldScope] = createContextScope(
  ONE_TIME_PASSWORD_FIELD_NAME,
)

type OneTimePasswordFieldContextValue = {
  autoComplete: () => AutoComplete
  autoFocus: () => boolean
  disabled: () => boolean
  form: () => string | undefined
  name: () => string | undefined
  orientation: () => Orientation
  placeholder: () => string | undefined
  readOnly: () => boolean
  type: () => InputType
  validationType: () => InputValidationType
  values: () => string[]
  hiddenInputRef: { current: HTMLInputElement | null }
  rootRef: { current: HTMLDivElement | null }
  isHydrated: () => boolean
  sanitizeValue(value: string | string[]): string[]
  setValues(next: string[]): void
  setChar(index: number, char: string): void
  clearChar(index: number, reason: 'Backspace' | 'Delete' | 'Cut'): void
  clearAll(reason: 'Reset' | 'Backspace' | 'Delete' | 'Clear'): void
  pasteValue(value: string): void
  attemptSubmit(): void
  getInputs(): HTMLInputElement[]
  getIndex(node: HTMLInputElement | null, fallback?: number): number
  registerInput(node: HTMLInputElement, explicitIndex: () => number | undefined): void
  unregisterInput(node: HTMLInputElement): void
}

type InputRegistration = {
  explicitIndex: () => number | undefined
  implicitIndex: number
}

const [OneTimePasswordFieldProvider, useOneTimePasswordFieldContext] =
  createOneTimePasswordFieldContext<OneTimePasswordFieldContextValue>(ONE_TIME_PASSWORD_FIELD_NAME)

type OneTimePasswordFieldProps = Omit<JSX.IntrinsicElements['div'], 'dir'> & {
  autoComplete?: MaybeAccessor<AutoComplete | undefined>
  autoFocus?: MaybeAccessor<boolean | undefined>
  autoSubmit?: MaybeAccessor<boolean | undefined>
  defaultValue?: MaybeAccessor<string | undefined>
  dir?: MaybeAccessor<Direction | undefined>
  disabled?: MaybeAccessor<boolean | undefined>
  form?: MaybeAccessor<string | undefined>
  name?: MaybeAccessor<string | undefined>
  onAutoSubmit?: (value: string) => void
  onPaste?: (event: ClipboardEvent) => void
  onValueChange?: (value: string) => void
  orientation?: MaybeAccessor<Orientation | undefined>
  placeholder?: MaybeAccessor<string | undefined>
  readOnly?: MaybeAccessor<boolean | undefined>
  sanitizeValue?: (value: string) => string
  type?: MaybeAccessor<InputType | undefined>
  validationType?: MaybeAccessor<InputValidationType | undefined>
  value?: MaybeAccessor<string | undefined>
}

type OneTimePasswordFieldHiddenInputProps = Omit<
  JSX.IntrinsicElements['input'],
  | 'value'
  | 'defaultValue'
  | 'type'
  | 'onChange'
  | 'readOnly'
  | 'disabled'
  | 'autoComplete'
  | 'autoFocus'
>

type OneTimePasswordFieldInputProps = Omit<
  JSX.IntrinsicElements['input'],
  | 'value'
  | 'defaultValue'
  | 'disabled'
  | 'readOnly'
  | 'autoComplete'
  | 'autoFocus'
  | 'form'
  | 'name'
  | 'placeholder'
  | 'type'
> & {
  onInvalidChange?: (character: string) => void
  index?: number
  orientation?: MaybeAccessor<Orientation | undefined>
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

function setRef<T>(ref: PossibleRef<T>, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value)
    return
  }

  if (ref) {
    ref.current = value
  }
}

function removeWhitespace(value: string) {
  return value.replace(/\s/g, '')
}

function focusInput(element: HTMLInputElement | null | undefined) {
  if (!element) return

  if (element.ownerDocument.activeElement === element) {
    requestAnimationFrame(() => {
      element.select?.()
    })
    return
  }

  element.focus()
}

function OneTimePasswordField(props: ScopedProps<OneTimePasswordFieldProps>): FictNode {
  const inheritedDirection = useDirection()
  const direction = () =>
    props.dir === undefined
      ? inheritedDirection()
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? inheritedDirection())
  const autoComplete = () =>
    props.autoComplete === undefined
      ? 'one-time-code'
      : ((readValue(props.autoComplete as MaybeAccessor<AutoComplete | undefined>) ??
          'one-time-code') as AutoComplete)
  const autoFocus = () => Boolean(readValue(props.autoFocus as MaybeAccessor<boolean | undefined>))
  const autoSubmit = () =>
    Boolean(readValue(props.autoSubmit as MaybeAccessor<boolean | undefined>))
  const disabled = () => Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>))
  const form = () =>
    props.form === undefined
      ? undefined
      : readValue(props.form as MaybeAccessor<string | undefined>)
  const name = () =>
    props.name === undefined
      ? undefined
      : readValue(props.name as MaybeAccessor<string | undefined>)
  const orientation = () =>
    props.orientation === undefined
      ? 'horizontal'
      : ((readValue(props.orientation as MaybeAccessor<Orientation | undefined>) ??
          'horizontal') as Orientation)
  const placeholder = () =>
    props.placeholder === undefined
      ? undefined
      : readValue(props.placeholder as MaybeAccessor<string | undefined>)
  const readOnly = () => Boolean(readValue(props.readOnly as MaybeAccessor<boolean | undefined>))
  const type = () =>
    props.type === undefined
      ? 'text'
      : ((readValue(props.type as MaybeAccessor<InputType | undefined>) ?? 'text') as InputType)
  const validationType = () =>
    props.validationType === undefined
      ? 'numeric'
      : ((readValue(props.validationType as MaybeAccessor<InputValidationType | undefined>) ??
          'numeric') as InputValidationType)
  const validation = () => INPUT_VALIDATION_MAP[validationType()]
  const rootRef = { current: null as HTMLDivElement | null }
  const hiddenInputRef = { current: null as HTMLInputElement | null }
  const isHydrated = useIsHydrated()
  const inputRegistry = new Map<HTMLInputElement, InputRegistration>()
  const inputsVersion = createSignal(0)
  let inputsVersionScheduled = false

  const scheduleInputsVersionUpdate = () => {
    if (inputsVersionScheduled) return

    inputsVersionScheduled = true
    queueMicrotask(() => {
      inputsVersionScheduled = false
      inputsVersion(inputsVersion() + 1)
    })
  }

  const sanitizeValue = (value: string | string[]) => {
    let nextValue = Array.isArray(value) ? value.join('') : value
    nextValue = removeWhitespace(nextValue)

    if (validation()) {
      nextValue = nextValue.replace(new RegExp(validation()!.regexp), '')
    } else if (props.sanitizeValue) {
      nextValue = props.sanitizeValue(nextValue)
    }

    return nextValue.split('')
  }

  const valueProp = () =>
    props.value === undefined
      ? undefined
      : sanitizeValue(readValue(props.value as MaybeAccessor<string | undefined>) ?? '')
  const defaultValue = () =>
    props.defaultValue === undefined
      ? []
      : sanitizeValue(readValue(props.defaultValue as MaybeAccessor<string | undefined>) ?? '')
  const initialDefaultValue = defaultValue()
  const [values, setValues] = useControllableState<string[]>({
    prop: valueProp,
    defaultProp: initialDefaultValue,
    caller: ONE_TIME_PASSWORD_FIELD_NAME,
    onChange: (nextValues) => props.onValueChange?.(nextValues.join('')),
  })

  const getInputs = () => {
    inputsVersion()
    const nodes =
      rootRef.current === null
        ? Array.from(inputRegistry.keys())
        : Array.from(rootRef.current.querySelectorAll<HTMLInputElement>('[data-radix-otp-input]'))

    return nodes.sort((a, b) => {
      const aRegistration = inputRegistry.get(a)
      const bRegistration = inputRegistry.get(b)
      const aIndex =
        aRegistration?.explicitIndex() ?? aRegistration?.implicitIndex ?? Number.POSITIVE_INFINITY
      const bIndex =
        bRegistration?.explicitIndex() ?? bRegistration?.implicitIndex ?? Number.POSITIVE_INFINITY

      return aIndex - bIndex
    })
  }

  const getIndex = (node: HTMLInputElement | null, fallback = -1) => {
    if (!node) return fallback
    const registration = inputRegistry.get(node)
    if (registration) {
      return registration.explicitIndex() ?? registration.implicitIndex
    }
    const dynamicIndex = getInputs().indexOf(node)
    return dynamicIndex === -1 ? fallback : dynamicIndex
  }

  const locateForm = () => {
    const ownerDocument = rootRef.current?.ownerDocument ?? document
    if (form()) {
      const associatedElement = ownerDocument.getElementById(form()!)
      if (associatedElement?.tagName === 'FORM') {
        return associatedElement as HTMLFormElement
      }
    }

    return hiddenInputRef.current?.form ?? getInputs()[0]?.form ?? null
  }

  const focusIndex = (index: number) => {
    focusInput(getInputs()[index])
  }

  const setValuesClamped = (nextValues: string[]) => {
    const count = getInputs().length
    const clamped = count > 0 ? nextValues.slice(0, count) : nextValues
    setValues(clamped)
  }

  const setChar = (index: number, char: string) => {
    const clean = sanitizeValue(char)[0]
    if (!clean) return

    const nextValues = [...values()]
    while (nextValues.length < index) {
      nextValues.push('')
    }
    nextValues[index] = clean
    setValuesClamped(nextValues)

    const inputs = getInputs()
    const lastIndex = inputs.length - 1
    if (index < lastIndex) {
      focusInput(inputs[index + 1])
    } else {
      inputs[index]?.select?.()
    }
  }

  const clearChar = (index: number, reason: 'Backspace' | 'Delete' | 'Cut') => {
    if (!values()[index]) return
    const nextValues = values().filter((_, itemIndex) => itemIndex !== index)
    setValuesClamped(nextValues)

    if (reason === 'Backspace') {
      focusIndex(Math.max(0, index - 1))
    } else {
      focusIndex(index)
    }
  }

  const clearAll = (_reason: 'Reset' | 'Backspace' | 'Delete' | 'Clear') => {
    if (values().length === 0) return
    setValues([])
    focusIndex(0)
  }

  const pasteValue = (value: string) => {
    const nextValues = sanitizeValue(value)
    if (nextValues.length === 0) return
    setValuesClamped(nextValues)
    focusIndex(Math.min(nextValues.length - 1, getInputs().length - 1))
  }

  const attemptSubmit = () => {
    locateForm()?.requestSubmit?.()
  }

  const primitiveProps = mergeProps(
    {
      role: 'group',
      dir: direction,
      onPaste: composeEventHandlers<ClipboardEvent>(
        (event) => (props.onPaste as ((event: ClipboardEvent) => void) | undefined)?.(event),
        (event) => {
          event.preventDefault()
          pasteValue(event.clipboardData?.getData('text') ?? '')
        },
      ),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeOneTimePasswordField: undefined,
      autoComplete: undefined,
      autoFocus: undefined,
      autoSubmit: undefined,
      defaultValue: undefined,
      dir: undefined,
      disabled: undefined,
      form: undefined,
      name: undefined,
      onAutoSubmit: undefined,
      onValueChange: undefined,
      orientation: undefined,
      placeholder: undefined,
      readOnly: undefined,
      sanitizeValue: undefined,
      type: undefined,
      validationType: undefined,
      value: undefined,
      children: undefined,
      ref: undefined,
    },
  )

  useLayoutEffect(() => {
    if (autoFocus()) {
      focusIndex(0)
    }
  })

  useLayoutEffect(() => {
    const formElement = locateForm()
    if (!formElement) return

    const handleReset = (event: Event) => {
      queueMicrotask(() => {
        if (!event.defaultPrevented && valueProp() === undefined) {
          setValuesClamped(initialDefaultValue)
        }
      })
    }
    formElement.addEventListener('reset', handleReset)
    return () => formElement.removeEventListener('reset', handleReset)
  })

  useLayoutEffect(() => {
    const currentValue = values().join('')
    const count = getInputs().length
    if (
      autoSubmit() &&
      count > 0 &&
      values().length === count &&
      values().every((char) => char !== '')
    ) {
      props.onAutoSubmit?.(currentValue)
      attemptSubmit()
    }
  })

  useLayoutEffect(() => {
    const nextValue = values().join('').trim()
    if (hiddenInputRef.current && hiddenInputRef.current.value !== nextValue) {
      hiddenInputRef.current.value = nextValue
    }

    const inputs = getInputs()
    for (let index = 0; index < inputs.length; index++) {
      const input = inputs[index]
      if (!input) continue
      const nextChar = values()[index] ?? ''
      if (input.value !== nextChar) {
        input.value = nextChar
      }
    }
  })

  return (
    <OneTimePasswordFieldProvider
      scope={
        props.__scopeOneTimePasswordField as Scope<OneTimePasswordFieldContextValue | undefined>
      }
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      disabled={disabled}
      form={form}
      name={name}
      orientation={orientation}
      placeholder={placeholder}
      readOnly={readOnly}
      type={type}
      validationType={validationType}
      values={values}
      hiddenInputRef={hiddenInputRef}
      rootRef={rootRef}
      isHydrated={isHydrated}
      sanitizeValue={sanitizeValue}
      setValues={setValuesClamped}
      setChar={setChar}
      clearChar={clearChar}
      clearAll={clearAll}
      pasteValue={pasteValue}
      attemptSubmit={attemptSubmit}
      getInputs={getInputs}
      getIndex={getIndex}
      registerInput={(node, explicitIndex) => {
        const currentRegistration = inputRegistry.get(node)
        const registeredIndices = Array.from(
          inputRegistry.values(),
          (registration) => registration.explicitIndex() ?? registration.implicitIndex,
        )
        inputRegistry.set(node, {
          explicitIndex,
          implicitIndex:
            currentRegistration?.implicitIndex ??
            (registeredIndices.length === 0 ? 0 : Math.max(...registeredIndices) + 1),
        })
        scheduleInputsVersionUpdate()
      }}
      unregisterInput={(node) => {
        inputRegistry.delete(node)
        scheduleInputsVersionUpdate()
      }}
    >
      <Primitive.div
        {...(primitiveProps as Record<string, unknown>)}
        ref={(node) => {
          const element = node instanceof HTMLDivElement ? node : null
          rootRef.current = element
          setRef(props.ref as PossibleRef<HTMLDivElement>, element)
        }}
      >
        {props.children}
      </Primitive.div>
    </OneTimePasswordFieldProvider>
  )
}

OneTimePasswordField.displayName = ONE_TIME_PASSWORD_FIELD_NAME

function OneTimePasswordFieldHiddenInput(
  props: ScopedProps<OneTimePasswordFieldHiddenInputProps>,
): FictNode {
  const context = useOneTimePasswordFieldContext(
    'OneTimePasswordFieldHiddenInput',
    props.__scopeOneTimePasswordField as Scope<OneTimePasswordFieldContextValue | undefined>,
  )
  const primitiveProps = mergeProps(
    {
      type: 'hidden',
      value: prop(() => context.values().join('').trim()),
      autoComplete: 'off',
      autoFocus: false,
      autoCapitalize: 'off',
      autoCorrect: 'off',
      spellCheck: false,
      readOnly: true,
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeOneTimePasswordField: undefined,
      'attr:form': prop(() => props.form ?? context.form()),
      disabled: prop(context.disabled),
      name: prop(() => props.name ?? context.name()),
      ref: undefined,
    },
  )

  return (
    <Primitive.input
      {...(primitiveProps as Record<string, unknown>)}
      ref={(node) => {
        const element = node instanceof HTMLInputElement ? node : null
        context.hiddenInputRef.current = element
        setRef(props.ref as PossibleRef<HTMLInputElement>, element)
      }}
    />
  )
}

function OneTimePasswordFieldInput(props: ScopedProps<OneTimePasswordFieldInputProps>): FictNode {
  const { __scopeOneTimePasswordField } = props
  const context = useOneTimePasswordFieldContext(
    'OneTimePasswordFieldInput',
    __scopeOneTimePasswordField as Scope<OneTimePasswordFieldContextValue | undefined>,
  )
  const nodeRef = { current: null as HTMLInputElement | null }
  const index = () => context.getIndex(nodeRef.current, props.index ?? -1)
  const char = () => {
    const currentIndex = index()
    return currentIndex >= 0 ? (context.values()[currentIndex] ?? '') : ''
  }
  const validation = () => INPUT_VALIDATION_MAP[context.validationType()]
  const placeholder = () => {
    const currentIndex = index()
    if (currentIndex < 0 || !context.isHydrated() || !context.placeholder()) return undefined
    return context.values().length === 0 ? context.placeholder()?.[currentIndex] : undefined
  }
  const registerRef = (node: HTMLInputElement | null) => {
    const previousNode = nodeRef.current
    if (previousNode && previousNode !== node) {
      context.unregisterInput(previousNode)
    }

    nodeRef.current = node
    if (node) {
      context.registerInput(node, () => props.index)
    }
    setRef(props.ref as PossibleRef<HTMLInputElement>, node)
  }
  const syncInputValue = (target: HTMLInputElement) => {
    const currentIndex = index()
    if (currentIndex < 0) return

    if (!target.validity.valid) {
      props.onInvalidChange?.(target.value)
      requestAnimationFrame(() => {
        if (target.ownerDocument.activeElement === target) {
          target.select()
        }
      })
      return
    }

    if (target.value === '') {
      context.clearChar(currentIndex, 'Delete')
      return
    }

    if (target.value.length > 1) {
      context.pasteValue(target.value)
      return
    }

    context.setChar(currentIndex, target.value)
  }

  const primitiveProps = mergeProps(
    {
      'data-radix-otp-input': '',
      'data-radix-index': prop(() => {
        const currentIndex = index()
        return currentIndex >= 0 ? currentIndex : props.index
      }),
      type: prop(context.type),
      disabled: prop(context.disabled),
      readOnly: prop(context.readOnly),
      value: prop(char),
      placeholder: prop(placeholder),
      autoComplete: prop(() => (index() === 0 ? context.autoComplete() : 'off')),
      inputMode: prop(() => validation()?.inputMode),
      pattern: prop(() => validation()?.pattern),
      maxLength: prop(() => (index() === 0 ? Math.max(1, context.getInputs().length) : 1)),
      'aria-label': prop(
        () => `Character ${index() + 1} of ${Math.max(context.getInputs().length, 1)}`,
      ),
      ref: registerRef,
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeOneTimePasswordField: undefined,
      index: undefined,
      onInvalidChange: undefined,
      ref: registerRef,
      onFocus: composeEventHandlers<FocusEvent>(
        (event) => (props.onFocus as ((event: FocusEvent) => void) | undefined)?.(event),
        (event) => {
          ;(event.currentTarget as HTMLInputElement).select()
        },
      ),
      onInput: composeEventHandlers<InputEvent>(
        (event) => (props.onInput as ((event: InputEvent) => void) | undefined)?.(event),
        (event) => {
          const target = event.currentTarget as HTMLInputElement
          const value = target.value
          if (value.length > 1) {
            event.preventDefault()
            context.pasteValue(value)
            return
          }

          syncInputValue(target)
        },
      ),
      onChange: composeEventHandlers<Event>(
        (event) => (props.onChange as ((event: Event) => void) | undefined)?.(event),
        (event) => {
          syncInputValue(event.currentTarget as HTMLInputElement)
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        (event) => (props.onKeyDown as ((event: KeyboardEvent) => void) | undefined)?.(event),
        (event) => {
          const currentIndex = index()
          const currentTarget = event.currentTarget as HTMLInputElement
          if (currentIndex < 0) return

          if (event.key === 'Enter') {
            event.preventDefault()
            context.attemptSubmit()
            return
          }

          if (event.key === 'Backspace') {
            event.preventDefault()
            if (currentTarget.value !== '') {
              context.clearChar(currentIndex, 'Backspace')
            } else {
              focusInput(context.getInputs()[Math.max(0, currentIndex - 1)])
            }
            return
          }

          if (event.key === 'Delete') {
            event.preventDefault()
            if (currentTarget.value !== '') {
              context.clearChar(currentIndex, 'Delete')
            }
            return
          }

          const inputOrientation =
            props.orientation === undefined
              ? context.orientation()
              : (readValue(props.orientation as MaybeAccessor<Orientation | undefined>) ??
                context.orientation())

          if (
            event.key === 'ArrowLeft' ||
            (event.key === 'ArrowUp' &&
              context.getInputs().length > 1 &&
              inputOrientation !== 'horizontal')
          ) {
            if (context.getInputs().length > 0) {
              event.preventDefault()
              focusInput(context.getInputs()[Math.max(0, currentIndex - 1)])
            }
            return
          }

          if (
            event.key === 'ArrowRight' ||
            (event.key === 'ArrowDown' &&
              context.getInputs().length > 1 &&
              inputOrientation !== 'horizontal')
          ) {
            if (context.getInputs().length > 0) {
              event.preventDefault()
              focusInput(
                context.getInputs()[Math.min(context.getInputs().length - 1, currentIndex + 1)],
              )
            }
          }
        },
      ),
      onPointerDown: composeEventHandlers<PointerEvent>(
        (event) => (props.onPointerDown as ((event: PointerEvent) => void) | undefined)?.(event),
        (event) => {
          event.preventDefault()
          focusInput(
            context.getInputs()[
              Math.min(index(), Math.max(0, context.values().join('').trim().length))
            ],
          )
        },
      ),
    },
  )

  return <Primitive.input {...(primitiveProps as Record<string, unknown>)} />
}

const Root = OneTimePasswordField
const Input = OneTimePasswordFieldInput
const HiddenInput = OneTimePasswordFieldHiddenInput

export {
  createOneTimePasswordFieldScope,
  OneTimePasswordField,
  OneTimePasswordFieldInput,
  OneTimePasswordFieldHiddenInput,
  Root,
  Input,
  HiddenInput,
}
export type {
  OneTimePasswordFieldProps,
  OneTimePasswordFieldInputProps,
  OneTimePasswordFieldHiddenInputProps,
  InputValidationType,
}
