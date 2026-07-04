import { mergeProps, prop, untrack, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

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
type ValidityMatcher = (typeof VALIDITY_MATCHERS)[number]
type SyncCustomMatcher = (value: string, formData: FormData) => boolean
type AsyncCustomMatcher = (value: string, formData: FormData) => Promise<boolean>
type CustomMatcher = SyncCustomMatcher | AsyncCustomMatcher
type CustomMatcherEntry = { id: string; match: CustomMatcher }
type SyncCustomMatcherEntry = { id: string; match: SyncCustomMatcher }
type AsyncCustomMatcherEntry = { id: string; match: AsyncCustomMatcher }
type CustomMatcherArgs = [string, FormData]

const FORM_NAME = 'Form'
const FIELD_NAME = 'FormField'
const LABEL_NAME = 'FormLabel'
const CONTROL_NAME = 'FormControl'
const MESSAGE_NAME = 'FormMessage'
const VALIDITY_STATE_NAME = 'FormValidityState'
const SUBMIT_NAME = 'FormSubmit'
const DEFAULT_INVALID_MESSAGE = 'This value is not valid'
const VALIDITY_MATCHERS = [
  'badInput',
  'patternMismatch',
  'rangeOverflow',
  'rangeUnderflow',
  'stepMismatch',
  'tooLong',
  'tooShort',
  'typeMismatch',
  'valid',
  'valueMissing',
] as const
const DEFAULT_BUILT_IN_MESSAGES: Record<ValidityMatcher, string | undefined> = {
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
}

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

function readStyle(value: unknown): Record<string, string | number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, string | number>
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

function Form(props: ScopedProps<FormProps>): FictNode {
  const { __scopeForm, onClearServerErrors = () => {}, ...rootProps } = props
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
    prop(() => rootProps as Record<string, unknown>),
    {
      onInvalid: composeEventHandlers<Event>(
        props.onInvalid as ((event: Event) => void) | undefined,
        (event) => {
          const form = event.currentTarget as HTMLFormElement
          const firstInvalidControl = getFirstInvalidControl(form)
          if (firstInvalidControl === event.target) {
            firstInvalidControl.focus()
          }
          event.preventDefault()
        },
      ),
      onSubmit: composeEventHandlers<Event>(
        props.onSubmit as ((event: Event) => void) | undefined,
        () => {
          onClearServerErrors()
        },
        { checkForDefaultPrevented: false },
      ),
      onReset: composeEventHandlers<Event>(
        props.onReset as ((event: Event) => void) | undefined,
        () => {
          onClearServerErrors()
        },
      ),
      ref: undefined,
    },
  )

  return (
    <ValidationProvider
      scope={__scopeForm as Scope<ValidationContextValue | undefined>}
      {...validationContext}
    >
      <AriaDescriptionProvider
        scope={__scopeForm as Scope<AriaDescriptionContextValue | undefined>}
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
  const { __scopeForm, name, serverInvalid = false, ...fieldProps } = props
  const validationContext = useValidationContext(
    FIELD_NAME,
    __scopeForm as Scope<ValidationContextValue | undefined>,
  )
  const id = useId()
  const ref = { current: null as HTMLDivElement | null }
  const validity = () => validationContext.getFieldValidity(name)
  const primitiveProps = mergeProps(
    {
      'data-valid': prop(() => getValidAttribute(validity(), serverInvalid)),
      'data-invalid': prop(() => getInvalidAttribute(validity(), serverInvalid)),
    },
    prop(() => fieldProps as Record<string, unknown>),
  )

  useLayoutEffect(() => {
    const field = ref.current
    if (!field) return

    const valid = getValidAttribute(validity(), serverInvalid)
    const invalid = getInvalidAttribute(validity(), serverInvalid)
    if (valid) field.setAttribute('data-valid', valid)
    else field.removeAttribute('data-valid')
    if (invalid) field.setAttribute('data-invalid', invalid)
    else field.removeAttribute('data-invalid')
  })

  return (
    <FormFieldProvider
      scope={__scopeForm as Scope<FormFieldContextValue | undefined>}
      id={() => id()}
      name={() => name}
      serverInvalid={() => serverInvalid}
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
  const { __scopeForm, ...labelProps } = props
  const validationContext = useValidationContext(
    LABEL_NAME,
    __scopeForm as Scope<ValidationContextValue | undefined>,
  )
  const fieldContext = useFormFieldContext(
    LABEL_NAME,
    __scopeForm as Scope<FormFieldContextValue | undefined>,
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
    prop(() => labelProps as Record<string, unknown>),
    {
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
  const { __scopeForm, ...controlProps } = props
  const validationContext = useValidationContext(
    CONTROL_NAME,
    __scopeForm as Scope<ValidationContextValue | undefined>,
  )
  const fieldContext = useFormFieldContext(
    CONTROL_NAME,
    __scopeForm as Scope<FormFieldContextValue | undefined>,
  )
  const ariaDescriptionContext = useAriaDescriptionContext(
    CONTROL_NAME,
    __scopeForm as Scope<AriaDescriptionContextValue | undefined>,
  )
  const ref = { current: null as HTMLInputElement | null }
  const name = () => props.name ?? fieldContext.name()
  const id = () => props.id ?? fieldContext.id()

  const updateControlValidity = async (control: HTMLInputElement) => {
    if (hasBuiltInError(control.validity)) {
      validationContext.onFieldValidityChange(name(), control.validity)
      return
    }

    const formData = control.form ? new FormData(control.form) : new FormData()
    const matcherArgs: CustomMatcherArgs = [control.value, formData]
    const customMatcherEntries = validationContext.getFieldCustomMatcherEntries(name())
    const syncCustomMatcherEntries: SyncCustomMatcherEntry[] = []
    const asyncCustomMatcherEntries: AsyncCustomMatcherEntry[] = []

    for (const customMatcherEntry of customMatcherEntries) {
      if (isAsyncCustomMatcherEntry(customMatcherEntry, matcherArgs)) {
        asyncCustomMatcherEntries.push(customMatcherEntry)
      } else if (isSyncCustomMatcherEntry(customMatcherEntry)) {
        syncCustomMatcherEntries.push(customMatcherEntry)
      }
    }

    const syncCustomErrors = syncCustomMatcherEntries.map(({ id, match }) => {
      return [id, match(...matcherArgs)] as const
    })
    const syncCustomErrorsById = Object.fromEntries(syncCustomErrors)
    const hasSyncCustomErrors = Object.values(syncCustomErrorsById).some(Boolean)
    control.setCustomValidity(hasSyncCustomErrors ? DEFAULT_INVALID_MESSAGE : '')
    validationContext.onFieldValidityChange(name(), control.validity)
    validationContext.onFieldCustomErrorsChange(name(), syncCustomErrorsById)

    if (!hasSyncCustomErrors && asyncCustomMatcherEntries.length > 0) {
      const promisedCustomErrors = asyncCustomMatcherEntries.map(({ id, match }) =>
        match(...matcherArgs).then((matches) => [id, matches] as const),
      )
      const asyncCustomErrors = await Promise.all(promisedCustomErrors)
      const asyncCustomErrorsById = Object.fromEntries(asyncCustomErrors)
      const hasAsyncCustomErrors = Object.values(asyncCustomErrorsById).some(Boolean)
      control.setCustomValidity(hasAsyncCustomErrors ? DEFAULT_INVALID_MESSAGE : '')
      validationContext.onFieldValidityChange(name(), control.validity)
      validationContext.onFieldCustomErrorsChange(name(), asyncCustomErrorsById)
    }
  }

  const resetControlValidity = () => {
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
  useLayoutEffect(() => {
    const control = ref.current
    if (!control) return

    const valid = getValidAttribute(validity(), fieldContext.serverInvalid())
    const invalid = getInvalidAttribute(validity(), fieldContext.serverInvalid())
    const describedBy = ariaDescriptionContext.getFieldDescription(name())
    if (valid) control.setAttribute('data-valid', valid)
    else control.removeAttribute('data-valid')

    if (invalid) control.setAttribute('data-invalid', invalid)
    else control.removeAttribute('data-invalid')

    if (fieldContext.serverInvalid()) control.setAttribute('aria-invalid', 'true')
    else control.removeAttribute('aria-invalid')

    if (describedBy) control.setAttribute('aria-describedby', describedBy)
    else control.removeAttribute('aria-describedby')
  })
  const primitiveProps = mergeProps(
    {
      'data-valid': prop(() => getValidAttribute(validity(), fieldContext.serverInvalid())),
      'data-invalid': prop(() => getInvalidAttribute(validity(), fieldContext.serverInvalid())),
      'aria-invalid': prop(() => (fieldContext.serverInvalid() ? true : undefined)),
      'aria-describedby': prop(() => ariaDescriptionContext.getFieldDescription(name())),
      title: '',
      id: prop(id),
      name: prop(name),
    },
    prop(() => controlProps as Record<string, unknown>),
    {
      ref: undefined,
      onInvalid: composeEventHandlers<Event>(
        props.onInvalid as ((event: Event) => void) | undefined,
        (event) => {
          void updateControlValidity(event.currentTarget as HTMLInputElement)
        },
      ),
      onChange: props.onChange as ((event: Event) => void) | undefined,
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
  const { match, name: nameProp, ...messageProps } = props
  const fieldContext = useFormFieldContext(
    MESSAGE_NAME,
    props.__scopeForm as Scope<FormFieldContextValue | undefined>,
  )
  const name = nameProp ?? fieldContext.name()

  if (match === undefined) {
    if (props.ref) {
      return (
        <FormMessageImpl
          {...messageProps}
          ref={toDomRef(props.ref as PossibleRef<HTMLSpanElement>)}
          name={name}
        >
          {props.children ?? DEFAULT_INVALID_MESSAGE}
        </FormMessageImpl>
      )
    }

    return (
      <FormMessageImpl {...messageProps} name={name}>
        {props.children ?? DEFAULT_INVALID_MESSAGE}
      </FormMessageImpl>
    )
  }

  if (typeof match === 'function') {
    if (props.ref) {
      return (
        <FormCustomMessage
          {...messageProps}
          ref={toDomRef(props.ref as PossibleRef<HTMLSpanElement>)}
          match={match}
          name={name}
        />
      )
    }

    return <FormCustomMessage {...messageProps} match={match} name={name} />
  }

  if (props.ref) {
    return (
      <FormBuiltInMessage
        {...messageProps}
        ref={toDomRef(props.ref as PossibleRef<HTMLSpanElement>)}
        match={match}
        name={name}
      />
    )
  }

  return <FormBuiltInMessage {...messageProps} match={match} name={name} />
}

FormMessage.displayName = MESSAGE_NAME

type FormBuiltInMessageProps = FormMessageImplProps & {
  match: ValidityMatcher
  forceMatch?: boolean
}

function FormBuiltInMessage(props: ScopedProps<FormBuiltInMessageProps>): FictNode {
  const { match, forceMatch = false, name, children, ...messageProps } = props
  const validationContext = useValidationContext(
    MESSAGE_NAME,
    messageProps.__scopeForm as Scope<ValidationContextValue | undefined>,
  )
  const validity = () => validationContext.getFieldValidity(name)
  const matches = () => Boolean(forceMatch || validity()?.[match])
  const builtInMessageProps = mergeProps(prop(() => messageProps as Record<string, unknown>))
  const messageText = () => String(children ?? DEFAULT_BUILT_IN_MESSAGES[match] ?? '')

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
  const { match, forceMatch = false, name, id: idProp, children, ...messageProps } = props
  const validationContext = useValidationContext(
    MESSAGE_NAME,
    messageProps.__scopeForm as Scope<ValidationContextValue | undefined>,
  )
  const generatedId = useId()
  const id = () => idProp ?? generatedId()

  useLayoutEffect(() => {
    validationContext.onFieldCustomMatcherEntryAdd(name, { id: id(), match })
    return () => validationContext.onFieldCustomMatcherEntryRemove(name, id())
  })

  const validity = () => validationContext.getFieldValidity(name)
  const customErrors = () => validationContext.getFieldCustomErrors(name)
  const matches = () =>
    Boolean(
      forceMatch ||
      (validity() && !hasBuiltInError(validity()!) && Object.values(customErrors()).some(Boolean)),
    )
  const customMessageProps = mergeProps(prop(() => messageProps as Record<string, unknown>))
  const messageText = () => String(children ?? DEFAULT_INVALID_MESSAGE)

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
  const { __scopeForm, id: idProp, name, present, textContent, ...messageProps } = props
  const ariaDescriptionContext = useAriaDescriptionContext(
    MESSAGE_NAME,
    __scopeForm as Scope<AriaDescriptionContextValue | undefined>,
  )
  const id = idProp ?? useId()()
  const ref = { current: null as HTMLSpanElement | null }

  useLayoutEffect(() => {
    if (present?.() === false) {
      ariaDescriptionContext.onFieldMessageIdRemove(name, id)
      return
    }

    ariaDescriptionContext.onFieldMessageIdAdd(name, id)
    return () => ariaDescriptionContext.onFieldMessageIdRemove(name, id)
  })

  useLayoutEffect(() => {
    const message = ref.current
    if (!message || !present || !textContent) return

    const visible = present()
    message.hidden = !visible
    message.style.display = visible ? '' : 'none'
    message.textContent = visible ? textContent() : ''
  })

  const primitiveProps = mergeProps(
    {
      id,
    },
    prop(() => messageProps as Record<string, unknown>),
    {
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
  const { __scopeForm, name: nameProp, children } = props
  const validationContext = useValidationContext(
    VALIDITY_STATE_NAME,
    __scopeForm as Scope<ValidationContextValue | undefined>,
  )
  const fieldContext = useFormFieldContext(
    VALIDITY_STATE_NAME,
    __scopeForm as Scope<FormFieldContextValue | undefined>,
  )
  const name = nameProp ?? fieldContext.name()
  return children(validationContext.getFieldValidity(name))
}

FormValidityState.displayName = VALIDITY_STATE_NAME

function FormSubmit(props: ScopedProps<FormSubmitProps>): FictNode {
  const { __scopeForm, ...submitProps } = props
  const primitiveProps = mergeProps(
    {
      type: 'submit',
    },
    prop(() => submitProps as Record<string, unknown>),
    {
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

function isAsyncCustomMatcherEntry(
  entry: CustomMatcherEntry,
  args: CustomMatcherArgs,
): entry is AsyncCustomMatcherEntry {
  return entry.match.constructor.name === 'AsyncFunction' || returnsPromise(entry.match, args)
}

function isSyncCustomMatcherEntry(entry: CustomMatcherEntry): entry is SyncCustomMatcherEntry {
  return entry.match.constructor.name === 'Function'
}

function returnsPromise(func: Function, args: Array<unknown>) {
  return func(...args) instanceof Promise
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
