import { mergeProps, prop, untrack, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal, isReactive, reactive } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useId } from '@fictjs/id'
import { Label as LabelPrimitive } from '@fictjs/label'
import { Primitive } from '@fictjs/primitive'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type ScopedProps<P> = P & { __scopeForm?: Scope }
type ValidityMap = Record<string, ValidityState | undefined>
type CustomMatcherEntriesMap = Record<string, CustomMatcherEntry[]>
type CustomErrorsMap = Record<string, Record<string, boolean>>
type MessageIdsMap = Record<string, Set<string>>
type SyncCustomMatcher = (value: string, formData: FormData) => boolean
type AsyncCustomMatcher = (value: string, formData: FormData) => Promise<boolean>
type CustomMatcher = SyncCustomMatcher | AsyncCustomMatcher
type CustomMatcherEntry = { id: string; match: CustomMatcher }
type CustomMatcherArgs = [string, FormData]

const FORM_NAME = 'Form'
const FIELD_NAME = 'FormField'
const LABEL_NAME = 'FormLabel'
const CONTROL_NAME = 'FormControl'
const MESSAGE_NAME = 'FormMessage'
const VALIDITY_STATE_NAME = 'FormValidityState'
const SUBMIT_NAME = 'FormSubmit'
const DEFAULT_INVALID_MESSAGE = 'This value is not valid'
const DEFAULT_BUILT_IN_MESSAGES = {
  badInput: DEFAULT_INVALID_MESSAGE,
  patternMismatch: 'This value does not match the required pattern',
  rangeOverflow: 'This value is too large',
  rangeUnderflow: 'This value is too small',
  stepMismatch: 'This value does not match the required step',
  tooLong: 'This value is too long',
  tooShort: 'This value is too short',
  typeMismatch: 'This value does not match the required type',
  valid: undefined,
  valueMissing: 'This value is missing',
} satisfies Record<Exclude<keyof ValidityState, 'customError'>, string | undefined>
type ValidityMatcher = keyof typeof DEFAULT_BUILT_IN_MESSAGES

const [createFormContext, createFormScope] = createContextScope(FORM_NAME)

type ValidationContextValue = {
  getFieldValidity(fieldName: string): ValidityState | undefined
  onFieldValidityChange(fieldName: string, validity: ValidityState): void
  getFieldCustomMatcherEntries(fieldName: string): CustomMatcherEntry[]
  onFieldCustomMatcherEntryAdd(fieldName: string, matcherEntry: CustomMatcherEntry): void
  onFieldCustomMatcherEntryRemove(fieldName: string, matcherEntryId: string): void
  getFieldCustomErrors(fieldName: string): Record<string, boolean>
  onFieldCustomErrorsChange(fieldName: string, errors: Record<string, boolean>): void
  onFieldValiditionClear(fieldName: string): void
}

type AriaDescriptionContextValue = {
  onFieldMessageIdAdd(fieldName: string, id: string): void
  onFieldMessageIdRemove(fieldName: string, id: string): void
  getFieldDescription(fieldName: string): string | undefined
}

type FormFieldContextValue = {
  id: () => string
  name: () => string
  serverInvalid: () => boolean
}

const [ValidationProvider, useValidationContext] =
  createFormContext<ValidationContextValue>(FORM_NAME)
const [AriaDescriptionProvider, useAriaDescriptionContext] =
  createFormContext<AriaDescriptionContextValue>(FORM_NAME)
const [FormFieldProvider, useFormFieldContext] =
  createFormContext<FormFieldContextValue>(FIELD_NAME)

type FormProps = JSX.IntrinsicElements['form'] & {
  onClearServerErrors?: () => void
  onInvalid?: (event: Event) => void
}

type FormFieldProps = JSX.IntrinsicElements['div'] & {
  name: string
  serverInvalid?: boolean
}

type FormLabelProps = JSX.IntrinsicElements['label']
type FormControlProps = JSX.IntrinsicElements['input'] & {
  onInvalid?: (event: Event) => void
}
type FormMessageProps = Omit<FormMessageImplProps, 'name'> & {
  match?: ValidityMatcher | CustomMatcher
  forceMatch?: boolean
  name?: string
}

type FormMessageImplProps = JSX.IntrinsicElements['span'] & {
  name: string
  present?: () => boolean
  textContent?: () => string
}

type FormValidityStateProps = {
  children: (validity: ValidityState | undefined) => FictNode
  name?: string
}

type FormSubmitProps = JSX.IntrinsicElements['button']

function cloneValidityState(validity: ValidityState): ValidityState {
  return validityStateToObject(validity) as ValidityState
}

function toDomRef<T>(ref: PossibleRef<T>) {
  return ref as unknown as ((node: T | null) => void) | { current: T | null }
}

function readReactiveValue(value: unknown): unknown {
  let currentValue = value

  for (let depth = 0; depth < 10 && isReactive(currentValue); depth += 1) {
    const nextValue = currentValue()
    if (nextValue === currentValue) break
    currentValue = nextValue
  }

  return currentValue
}

function isTextContent(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

function shallowBooleanRecordEqual(
  left: Record<string, boolean>,
  right: Record<string, boolean>,
): boolean {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) return false

  return leftKeys.every((key) => left[key] === right[key])
}

function mergeAriaDescriptionIds(...values: unknown[]): string | undefined {
  const ids = values
    .flatMap((value) => (value == null ? [] : String(value).split(/\s+/)))
    .filter(Boolean)

  return ids.length > 0 ? [...new Set(ids)].join(' ') : undefined
}

function Form(props: ScopedProps<FormProps>): FictNode {
  const formRef = { current: null as HTMLFormElement | null }

  const validityMap = createSignal<ValidityMap>({})
  const customMatcherEntriesMap = createSignal<CustomMatcherEntriesMap>({})
  const customErrorsMap = createSignal<CustomErrorsMap>({})
  const messageIdsMap = createSignal<MessageIdsMap>({})

  const validationContext: ValidationContextValue = {
    getFieldValidity(fieldName) {
      return validityMap()[fieldName]
    },
    onFieldValidityChange(fieldName, validity) {
      const currentValidityMap = untrack(() => validityMap())
      validityMap({
        ...currentValidityMap,
        [fieldName]: cloneValidityState(validity),
      })
    },
    getFieldCustomMatcherEntries(fieldName) {
      return customMatcherEntriesMap()[fieldName] ?? []
    },
    onFieldCustomMatcherEntryAdd(fieldName, matcherEntry) {
      const currentEntriesMap = untrack(() => customMatcherEntriesMap())
      const currentEntries = currentEntriesMap[fieldName] ?? []
      const nextEntries = currentEntries.some((entry) => entry.id === matcherEntry.id)
        ? currentEntries.map((entry) => (entry.id === matcherEntry.id ? matcherEntry : entry))
        : [...currentEntries, matcherEntry]

      if (
        nextEntries.length === currentEntries.length &&
        nextEntries.every((entry, index) => entry === currentEntries[index])
      ) {
        return
      }

      customMatcherEntriesMap({
        ...currentEntriesMap,
        [fieldName]: nextEntries,
      })
    },
    onFieldCustomMatcherEntryRemove(fieldName, matcherEntryId) {
      const currentEntriesMap = untrack(() => customMatcherEntriesMap())
      const currentEntries = currentEntriesMap[fieldName] ?? []
      const nextEntries = currentEntries.filter(
        (matcherEntry) => matcherEntry.id !== matcherEntryId,
      )

      if (nextEntries.length === currentEntries.length) {
        return
      }

      customMatcherEntriesMap({
        ...currentEntriesMap,
        [fieldName]: nextEntries,
      })
    },
    getFieldCustomErrors(fieldName) {
      return customErrorsMap()[fieldName] ?? {}
    },
    onFieldCustomErrorsChange(fieldName, errors) {
      const currentErrorsMap = untrack(() => customErrorsMap())
      const currentErrors = currentErrorsMap[fieldName] ?? {}
      const nextErrors = { ...currentErrors, ...errors }

      if (shallowBooleanRecordEqual(currentErrors, nextErrors)) {
        return
      }

      customErrorsMap({
        ...currentErrorsMap,
        [fieldName]: nextErrors,
      })
    },
    onFieldValiditionClear(fieldName) {
      validityMap({ ...untrack(() => validityMap()), [fieldName]: undefined })
      customErrorsMap({ ...untrack(() => customErrorsMap()), [fieldName]: {} })
    },
  }

  const ariaDescriptionContext: AriaDescriptionContextValue = {
    onFieldMessageIdAdd(fieldName, id) {
      const currentMessageIdsMap = untrack(() => messageIdsMap())
      const currentIds = currentMessageIdsMap[fieldName] ?? new Set<string>()
      if (currentIds.has(id)) {
        return
      }

      const nextIds = new Set(currentIds)
      nextIds.add(id)
      messageIdsMap({ ...currentMessageIdsMap, [fieldName]: nextIds })
    },
    onFieldMessageIdRemove(fieldName, id) {
      const currentMessageIdsMap = untrack(() => messageIdsMap())
      const currentIds = currentMessageIdsMap[fieldName] ?? new Set<string>()
      if (!currentIds.has(id)) {
        return
      }

      const nextIds = new Set(currentIds)
      nextIds.delete(id)
      messageIdsMap({ ...currentMessageIdsMap, [fieldName]: nextIds })
    },
    getFieldDescription(fieldName) {
      const description = Array.from(messageIdsMap()[fieldName] ?? []).join(' ')
      return description || undefined
    },
  }

  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      onInvalid: composeEventHandlers<Event>(
        (event) => props.onInvalid?.(event),
        (event) => {
          const form = event.currentTarget as HTMLFormElement
          const firstInvalidControl = getFirstInvalidControl(form)
          if (firstInvalidControl === event.target) {
            firstInvalidControl.focus()
          }
          event.preventDefault()
        },
      ),
      onSubmit: composeEventHandlers<SubmitEvent>(
        (event) => props.onSubmit?.(event),
        () => {
          props.onClearServerErrors?.()
        },
        { checkForDefaultPrevented: false },
      ),
      onReset: composeEventHandlers<Event>(
        (event) => props.onReset?.(event),
        () => {
          props.onClearServerErrors?.()
        },
      ),
      __scopeForm: undefined,
      onClearServerErrors: undefined,
      ref: undefined,
    },
  )

  return (
    <ValidationProvider
      scope={props.__scopeForm as Scope<ValidationContextValue | undefined>}
      {...validationContext}
    >
      <AriaDescriptionProvider
        scope={props.__scopeForm as Scope<AriaDescriptionContextValue | undefined>}
        {...ariaDescriptionContext}
      >
        <Primitive.form
          {...(primitiveProps as Record<string, unknown>)}
          ref={useComposedRefs(props.ref as PossibleRef<HTMLFormElement>, formRef)}
        />
      </AriaDescriptionProvider>
    </ValidationProvider>
  )
}

Form.displayName = FORM_NAME

function FormField(props: ScopedProps<FormFieldProps>): FictNode {
  const validationContext = useValidationContext(
    FIELD_NAME,
    props.__scopeForm as Scope<ValidationContextValue | undefined>,
  )
  const id = useId()
  const ref = { current: null as HTMLDivElement | null }
  const name = () => props.name
  const serverInvalid = () => Boolean(props.serverInvalid)
  const validity = () => validationContext.getFieldValidity(name())
  const primitiveProps = mergeProps(
    {
      'data-valid': prop(() => getValidAttribute(validity(), serverInvalid())),
      'data-invalid': prop(() => getInvalidAttribute(validity(), serverInvalid())),
    },
    prop(() => props as unknown as Record<string, unknown>),
    {
      __scopeForm: undefined,
      name: undefined,
      serverInvalid: undefined,
    },
  )

  useLayoutEffect(() => {
    const field = ref.current
    if (!field) return

    const valid = getValidAttribute(validity(), serverInvalid())
    const invalid = getInvalidAttribute(validity(), serverInvalid())
    if (valid) field.setAttribute('data-valid', valid)
    else field.removeAttribute('data-valid')
    if (invalid) field.setAttribute('data-invalid', invalid)
    else field.removeAttribute('data-invalid')
  })

  return (
    <FormFieldProvider
      scope={props.__scopeForm as Scope<FormFieldContextValue | undefined>}
      id={() => id()}
      name={name}
      serverInvalid={serverInvalid}
    >
      {props.ref ? (
        <Primitive.div
          {...(primitiveProps as Record<string, unknown>)}
          ref={useComposedRefs(toDomRef(props.ref as PossibleRef<HTMLDivElement>), ref)}
        />
      ) : (
        <Primitive.div {...(primitiveProps as Record<string, unknown>)} ref={ref} />
      )}
    </FormFieldProvider>
  )
}

FormField.displayName = FIELD_NAME

function FormLabel(props: ScopedProps<FormLabelProps>): FictNode {
  const validationContext = useValidationContext(
    LABEL_NAME,
    props.__scopeForm as Scope<ValidationContextValue | undefined>,
  )
  const fieldContext = useFormFieldContext(
    LABEL_NAME,
    props.__scopeForm as Scope<FormFieldContextValue | undefined>,
  )
  const ref = { current: null as HTMLLabelElement | null }
  const validity = () => validationContext.getFieldValidity(fieldContext.name())
  const htmlFor = () => props.htmlFor ?? fieldContext.id()
  const primitiveProps = mergeProps(
    {
      'data-valid': prop(() => getValidAttribute(validity(), fieldContext.serverInvalid())),
      'data-invalid': prop(() => getInvalidAttribute(validity(), fieldContext.serverInvalid())),
      htmlFor: prop(htmlFor),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeForm: undefined,
      ref: undefined,
    },
  )

  useLayoutEffect(() => {
    const label = ref.current
    if (!label) return

    const valid = getValidAttribute(validity(), fieldContext.serverInvalid())
    const invalid = getInvalidAttribute(validity(), fieldContext.serverInvalid())
    label.htmlFor = htmlFor()
    if (valid) label.setAttribute('data-valid', valid)
    else label.removeAttribute('data-valid')
    if (invalid) label.setAttribute('data-invalid', invalid)
    else label.removeAttribute('data-invalid')
  })

  if (props.ref) {
    return (
      <LabelPrimitive
        {...(primitiveProps as Record<string, unknown>)}
        ref={useComposedRefs(toDomRef(props.ref as PossibleRef<HTMLLabelElement>), ref)}
      />
    )
  }

  return <LabelPrimitive {...(primitiveProps as Record<string, unknown>)} ref={ref} />
}

FormLabel.displayName = LABEL_NAME

function FormControl(props: ScopedProps<FormControlProps>): FictNode {
  const validationContext = useValidationContext(
    CONTROL_NAME,
    props.__scopeForm as Scope<ValidationContextValue | undefined>,
  )
  const fieldContext = useFormFieldContext(
    CONTROL_NAME,
    props.__scopeForm as Scope<FormFieldContextValue | undefined>,
  )
  const ariaDescriptionContext = useAriaDescriptionContext(
    CONTROL_NAME,
    props.__scopeForm as Scope<AriaDescriptionContextValue | undefined>,
  )
  const ref = { current: null as HTMLInputElement | null }
  const name = () => props.name ?? fieldContext.name()
  const id = () => props.id ?? fieldContext.id()
  let validationRun = 0

  const updateControlValidity = async (control: HTMLInputElement) => {
    const currentValidationRun = ++validationRun

    if (hasBuiltInError(control.validity)) {
      validationContext.onFieldValidityChange(name(), control.validity)
      return
    }

    const formData = control.form ? new FormData(control.form) : new FormData()
    const matcherArgs: CustomMatcherArgs = [control.value, formData]
    const customMatcherEntries = validationContext.getFieldCustomMatcherEntries(name())
    const matcherResults = customMatcherEntries.map(({ id, match }) => ({
      id,
      result: match(...matcherArgs),
    }))
    const syncCustomErrors = matcherResults
      .filter((entry): entry is { id: string; result: boolean } => !isPromiseResult(entry.result))
      .map(({ id: matcherId, result }) => [matcherId, result] as const)
    const asyncCustomMatcherResults = matcherResults.filter(
      (entry): entry is { id: string; result: Promise<boolean> } => isPromiseResult(entry.result),
    )
    const syncCustomErrorsById = Object.fromEntries(syncCustomErrors)
    const hasSyncCustomErrors = Object.values(syncCustomErrorsById).some(Boolean)
    control.setCustomValidity(hasSyncCustomErrors ? DEFAULT_INVALID_MESSAGE : '')
    validationContext.onFieldValidityChange(name(), control.validity)
    validationContext.onFieldCustomErrorsChange(name(), syncCustomErrorsById)

    if (!hasSyncCustomErrors && asyncCustomMatcherResults.length > 0) {
      const promisedCustomErrors = asyncCustomMatcherResults.map(({ id: matcherId, result }) =>
        result.then((matches) => [matcherId, matches] as const),
      )
      const asyncCustomErrors = await Promise.all(promisedCustomErrors)
      if (currentValidationRun !== validationRun || ref.current !== control) return

      const asyncCustomErrorsById = Object.fromEntries(asyncCustomErrors)
      const hasAsyncCustomErrors = Object.values(asyncCustomErrorsById).some(Boolean)
      control.setCustomValidity(hasAsyncCustomErrors ? DEFAULT_INVALID_MESSAGE : '')
      validationContext.onFieldValidityChange(name(), control.validity)
      validationContext.onFieldCustomErrorsChange(name(), asyncCustomErrorsById)
    } else {
      for (const { result } of asyncCustomMatcherResults) {
        void result.catch(() => undefined)
      }
    }
  }

  const resetControlValidity = () => {
    validationRun++
    const control = ref.current
    if (!control) return

    control.setCustomValidity('')
    validationContext.onFieldValiditionClear(name())
  }

  useLayoutEffect(() => {
    const control = ref.current
    if (!control) return

    const handleChange = () => {
      void updateControlValidity(control)
    }
    const handleInvalid = () => {
      void updateControlValidity(control)
    }
    control.addEventListener('change', handleChange)
    control.addEventListener('invalid', handleInvalid)
    return () => {
      validationRun++
      control.removeEventListener('change', handleChange)
      control.removeEventListener('invalid', handleInvalid)
    }
  })

  useLayoutEffect(() => {
    const form = ref.current?.form
    if (!form) return

    form.addEventListener('reset', resetControlValidity)
    return () => form.removeEventListener('reset', resetControlValidity)
  })

  useLayoutEffect(() => {
    const control = ref.current
    const form = control?.closest('form')
    if (!control || !form || !fieldContext.serverInvalid()) return

    const firstInvalidControl = getFirstInvalidControl(form)
    if (firstInvalidControl === control) {
      firstInvalidControl.focus()
    }
  })

  const validity = () => validationContext.getFieldValidity(name())
  const describedBy = () =>
    mergeAriaDescriptionIds(
      props['aria-describedby'],
      ariaDescriptionContext.getFieldDescription(name()),
    )
  const ariaInvalid = () => (fieldContext.serverInvalid() ? true : props['aria-invalid'])
  useLayoutEffect(() => {
    const control = ref.current
    if (!control) return

    const valid = getValidAttribute(validity(), fieldContext.serverInvalid())
    const invalid = getInvalidAttribute(validity(), fieldContext.serverInvalid())
    const nextDescribedBy = describedBy()
    const nextAriaInvalid = ariaInvalid()
    if (valid) control.setAttribute('data-valid', valid)
    else control.removeAttribute('data-valid')

    if (invalid) control.setAttribute('data-invalid', invalid)
    else control.removeAttribute('data-invalid')

    if (nextAriaInvalid !== undefined && nextAriaInvalid !== null) {
      control.setAttribute('aria-invalid', String(nextAriaInvalid))
    } else control.removeAttribute('aria-invalid')

    if (nextDescribedBy) control.setAttribute('aria-describedby', nextDescribedBy)
    else control.removeAttribute('aria-describedby')
  })
  const primitiveProps = mergeProps(
    {
      'data-valid': prop(() => getValidAttribute(validity(), fieldContext.serverInvalid())),
      'data-invalid': prop(() => getInvalidAttribute(validity(), fieldContext.serverInvalid())),
      title: '',
      id: prop(id),
      name: prop(name),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeForm: undefined,
      ref: undefined,
      'aria-invalid': prop(ariaInvalid),
      'aria-describedby': prop(describedBy),
      onInvalid: composeEventHandlers<Event>(
        (event) => props.onInvalid?.(event),
        (event) => {
          void updateControlValidity(event.currentTarget as HTMLInputElement)
        },
      ),
      onChange: (event: Event) => props.onChange?.(event),
    },
  )

  return (
    <Primitive.input
      {...(primitiveProps as Record<string, unknown>)}
      ref={useComposedRefs(props.ref as PossibleRef<HTMLInputElement>, ref)}
    />
  )
}

FormControl.displayName = CONTROL_NAME

function FormMessage(props: ScopedProps<FormMessageProps>): FictNode {
  const fieldContext = useFormFieldContext(
    MESSAGE_NAME,
    props.__scopeForm as Scope<FormFieldContextValue | undefined>,
  )
  // Fict 0.26 flushes lifecycle hooks inside reactive VNode roots before their parent is
  // connected. Keep the message implementation and initial VNode child shape synchronous;
  // accessors below still carry names, text, validity, and forwarded props through updates.
  const rawProps = mergeProps({}, props as unknown as Record<string, unknown>)
  const match = readReactiveValue(rawProps.match) as FormMessageProps['match']
  const initialChildren = readReactiveValue(rawProps.children) ?? DEFAULT_INVALID_MESSAGE
  const forwardedRef = readReactiveValue(rawProps.ref) as PossibleRef<HTMLSpanElement>
  const name = () => (readReactiveValue(rawProps.name) as string | undefined) ?? fieldContext.name()
  const messageProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      match: undefined,
      name: undefined,
      ref: undefined,
    },
  )
  const refProps = forwardedRef ? { ref: toDomRef(forwardedRef) } : {}
  const reactiveName = prop(name) as unknown as string

  if (match === undefined) {
    const defaultMessageProps = mergeProps(messageProps, { children: undefined })

    if (isTextContent(initialChildren)) {
      const messageText = () => {
        const children = readReactiveValue(rawProps.children) ?? DEFAULT_INVALID_MESSAGE
        return typeof children === 'boolean' ? '' : String(children)
      }

      return (
        <FormMessageImpl
          {...defaultMessageProps}
          {...refProps}
          name={reactiveName}
          textContent={messageText}
        >
          {initialChildren as FictNode}
        </FormMessageImpl>
      )
    }

    return (
      <FormMessageImpl {...defaultMessageProps} {...refProps} name={reactiveName}>
        {initialChildren as FictNode}
      </FormMessageImpl>
    )
  }

  if (typeof match === 'function') {
    return <FormCustomMessage {...messageProps} {...refProps} match={match} name={reactiveName} />
  }

  return <FormBuiltInMessage {...messageProps} {...refProps} match={match} name={reactiveName} />
}

FormMessage.displayName = MESSAGE_NAME

type FormBuiltInMessageProps = FormMessageImplProps & {
  match: ValidityMatcher
  forceMatch?: boolean
}

function FormBuiltInMessage(props: ScopedProps<FormBuiltInMessageProps>): FictNode {
  const validationContext = useValidationContext(
    MESSAGE_NAME,
    props.__scopeForm as Scope<ValidationContextValue | undefined>,
  )
  const validity = () => validationContext.getFieldValidity(props.name)
  const matches = () => Boolean(props.forceMatch || validity()?.[props.match])
  const builtInMessageProps = mergeProps(
    prop(() => props as unknown as Record<string, unknown>),
    {
      match: undefined,
      forceMatch: undefined,
      name: undefined,
      children: undefined,
    },
  )
  const messageText = () => String(props.children ?? DEFAULT_BUILT_IN_MESSAGES[props.match] ?? '')
  const name = prop(() => props.name) as unknown as string

  if (props.ref) {
    return (
      <FormMessageImpl
        {...(builtInMessageProps as Record<string, unknown>)}
        present={matches}
        ref={toDomRef(props.ref as PossibleRef<HTMLSpanElement>)}
        name={name}
        textContent={messageText}
      />
    )
  }

  return (
    <FormMessageImpl
      {...(builtInMessageProps as Record<string, unknown>)}
      name={name}
      present={matches}
      textContent={messageText}
    />
  )
}

type FormCustomMessageProps = FormMessageImplProps & {
  match: CustomMatcher
  forceMatch?: boolean
}

function FormCustomMessage(props: ScopedProps<FormCustomMessageProps>): FictNode {
  const validationContext = useValidationContext(
    MESSAGE_NAME,
    props.__scopeForm as Scope<ValidationContextValue | undefined>,
  )
  const generatedId = useId()
  const id = () => props.id ?? generatedId()

  useLayoutEffect(() => {
    const currentName = props.name
    const currentId = id()
    validationContext.onFieldCustomMatcherEntryAdd(currentName, {
      id: currentId,
      match: props.match,
    })
    return () => validationContext.onFieldCustomMatcherEntryRemove(currentName, currentId)
  })

  const validity = () => validationContext.getFieldValidity(props.name)
  const customErrors = () => validationContext.getFieldCustomErrors(props.name)
  const matches = () =>
    Boolean(
      props.forceMatch || (validity() && !hasBuiltInError(validity()!) && customErrors()[id()]),
    )
  const customMessageProps = mergeProps(
    prop(() => props as unknown as Record<string, unknown>),
    {
      match: undefined,
      forceMatch: undefined,
      name: undefined,
      children: undefined,
    },
  )
  const messageText = () => String(props.children ?? DEFAULT_INVALID_MESSAGE)
  const name = prop(() => props.name) as unknown as string

  if (props.ref) {
    return (
      <FormMessageImpl
        {...(customMessageProps as Record<string, unknown>)}
        id={id()}
        present={matches}
        ref={toDomRef(props.ref as PossibleRef<HTMLSpanElement>)}
        name={name}
        textContent={messageText}
      />
    )
  }

  return (
    <FormMessageImpl
      {...(customMessageProps as Record<string, unknown>)}
      id={id()}
      name={name}
      present={matches}
      textContent={messageText}
    />
  )
}

function FormMessageImpl(props: ScopedProps<FormMessageImplProps>): FictNode {
  const ariaDescriptionContext = useAriaDescriptionContext(
    MESSAGE_NAME,
    props.__scopeForm as Scope<AriaDescriptionContextValue | undefined>,
  )
  const generatedId = useId()
  const id = () => props.id ?? generatedId()
  const ref = { current: null as HTMLSpanElement | null }

  useLayoutEffect(() => {
    const currentName = props.name
    const currentId = id()
    if (props.present?.() === false) {
      ariaDescriptionContext.onFieldMessageIdRemove(currentName, currentId)
      return
    }

    ariaDescriptionContext.onFieldMessageIdAdd(currentName, currentId)
    return () => ariaDescriptionContext.onFieldMessageIdRemove(currentName, currentId)
  })

  useLayoutEffect(() => {
    const message = ref.current
    if (!message || !props.textContent) return

    const visible = props.present?.()
    if (visible === undefined) {
      message.textContent = props.textContent()
      return
    }

    message.hidden = !visible
    message.style.display = visible ? '' : 'none'
    message.textContent = visible ? props.textContent() : ''
  })

  const primitiveProps = mergeProps(
    {
      id: prop(id),
    },
    prop(() => props as unknown as Record<string, unknown>),
    {
      __scopeForm: undefined,
      name: undefined,
      present: undefined,
      textContent: undefined,
      ref: undefined,
    },
  )

  if (props.ref) {
    return (
      <Primitive.span
        {...(primitiveProps as Record<string, unknown>)}
        ref={useComposedRefs(toDomRef(props.ref as PossibleRef<HTMLSpanElement>), ref)}
      />
    )
  }

  return <Primitive.span {...(primitiveProps as Record<string, unknown>)} ref={ref} />
}

function FormValidityState(props: ScopedProps<FormValidityStateProps>): FictNode {
  const validationContext = useValidationContext(
    VALIDITY_STATE_NAME,
    props.__scopeForm as Scope<ValidationContextValue | undefined>,
  )
  const fieldContext = useFormFieldContext(
    VALIDITY_STATE_NAME,
    props.__scopeForm as Scope<FormFieldContextValue | undefined>,
  )
  const name = () => props.name ?? fieldContext.name()
  return <>{reactive(() => props.children(validationContext.getFieldValidity(name())))}</>
}

FormValidityState.displayName = VALIDITY_STATE_NAME

function FormSubmit(props: ScopedProps<FormSubmitProps>): FictNode {
  const primitiveProps = mergeProps(
    {
      type: 'submit',
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeForm: undefined,
      ref: undefined,
    },
  )

  if (props.ref) {
    return (
      <Primitive.button
        {...(primitiveProps as Record<string, unknown>)}
        ref={toDomRef(props.ref as PossibleRef<HTMLButtonElement>)}
      />
    )
  }

  return <Primitive.button {...(primitiveProps as Record<string, unknown>)} />
}

FormSubmit.displayName = SUBMIT_NAME

function validityStateToObject(validity: ValidityState) {
  const object: Partial<Record<keyof ValidityState, boolean>> = {}
  const keys: Array<keyof ValidityState> = [
    'badInput',
    'customError',
    'patternMismatch',
    'rangeOverflow',
    'rangeUnderflow',
    'stepMismatch',
    'tooLong',
    'tooShort',
    'typeMismatch',
    'valid',
    'valueMissing',
  ]

  for (const validityKey of keys) {
    object[validityKey] = validity[validityKey]
  }
  return object
}

function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement
}

function isFormControl(element: unknown): element is { validity: ValidityState } {
  return typeof element === 'object' && element !== null && 'validity' in element
}

function isInvalid(control: HTMLElement) {
  return (
    isFormControl(control) &&
    (control.validity.valid === false || control.getAttribute('aria-invalid') === 'true')
  )
}

function getFirstInvalidControl(form: HTMLFormElement): HTMLElement | undefined {
  const [firstInvalidControl] = Array.from(form.elements).filter(isHTMLElement).filter(isInvalid)
  return firstInvalidControl
}

function isPromiseResult(result: boolean | Promise<boolean>): result is Promise<boolean> {
  return typeof result === 'object' && result !== null && typeof result.then === 'function'
}

function hasBuiltInError(validity: ValidityState) {
  let error = false
  for (const key in validity) {
    const validityKey = key as keyof ValidityState
    if (validityKey !== 'valid' && validityKey !== 'customError' && validity[validityKey]) {
      error = true
      break
    }
  }
  return error
}

function getValidAttribute(validity: ValidityState | undefined, serverInvalid: boolean) {
  if (validity?.valid === true && !serverInvalid) return 'true'
  return undefined
}

function getInvalidAttribute(validity: ValidityState | undefined, serverInvalid: boolean) {
  if (validity?.valid === false || serverInvalid) return 'true'
  return undefined
}

const Root = Form
const Field = FormField
const Label = FormLabel
const Control = FormControl
const Message = FormMessage
const ValidityState = FormValidityState
const Submit = FormSubmit

export {
  createFormScope,
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  FormValidityState,
  FormSubmit,
  Root,
  Field,
  Label,
  Control,
  Message,
  ValidityState,
  Submit,
}
export type {
  FormProps,
  FormFieldProps,
  FormLabelProps,
  FormControlProps,
  FormMessageProps,
  FormValidityStateProps,
  FormSubmitProps,
}
