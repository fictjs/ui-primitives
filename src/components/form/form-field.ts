import { createContext, useContext, type FictNode } from '@fictjs/runtime'

import { createId } from '../../internal/ids'
import { Label } from './label'

export interface FormProps {
  children?: FictNode
  [key: string]: unknown
}

export interface FormFieldProps {
  name?: string
  children?: FictNode
}

export interface FormControlProps {
  as?: string
  children?: FictNode
  [key: string]: unknown
}

export interface FormDescriptionProps {
  children?: FictNode
  [key: string]: unknown
}

export interface FormMessageProps {
  children?: FictNode
  [key: string]: unknown
}

interface FieldContextValue {
  controlId: string
  descriptionId: string
  messageId: string
}

const FieldContext = createContext<FieldContextValue | null>(null)

function useFieldContext(component: string): FieldContextValue {
  const context = useContext(FieldContext)
  if (!context) {
    throw new Error(`${component} must be used inside FormField`)
  }
  return context
}

export function Form(props: FormProps): FictNode {
  return {
    type: 'form',
    props: {
      ...props,
      'data-form': '',
      children: props.children,
    },
  }
}

export function FormField(props: FormFieldProps): FictNode {
  const fieldId = props.name ? `field-${props.name}` : createId('field')

  const context: FieldContextValue = {
    controlId: fieldId,
    descriptionId: `${fieldId}-description`,
    messageId: `${fieldId}-message`,
  }

  return {
    type: FieldContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}

export function FormLabel(props: Record<string, unknown> & { children?: FictNode }): FictNode {
  const field = useFieldContext('FormLabel')

  return {
    type: Label,
    props: {
      ...props,
      htmlFor: props.htmlFor ?? field.controlId,
      'data-form-label': '',
      children: props.children,
    },
  }
}

export function FormControl(props: FormControlProps): FictNode {
  const field = useFieldContext('FormControl')
  const tag = props.as ?? 'input'

  return {
    type: tag,
    props: {
      ...props,
      as: undefined,
      id: props.id ?? field.controlId,
      'aria-describedby': `${field.descriptionId} ${field.messageId}`,
      'data-form-control': '',
      children: props.children,
    },
  }
}

export function FormDescription(props: FormDescriptionProps): FictNode {
  const field = useFieldContext('FormDescription')

  return {
    type: 'p',
    props: {
      ...props,
      id: props.id ?? field.descriptionId,
      'data-form-description': '',
      children: props.children,
    },
  }
}

export function FormMessage(props: FormMessageProps): FictNode {
  const field = useFieldContext('FormMessage')

  return {
    type: 'p',
    props: {
      ...props,
      id: props.id ?? field.messageId,
      role: props.role ?? 'alert',
      'data-form-message': '',
      children: props.children,
    },
  }
}
