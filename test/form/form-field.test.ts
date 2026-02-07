import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
} from '../../src/components/form'

describe('Form field primitives', () => {
  it('wires label/control/description/message IDs', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: Form,
        props: {
          children: {
            type: FormField,
            props: {
              name: 'email',
              children: [
                { type: FormLabel, props: { children: 'Email' } },
                { type: FormControl, props: { as: 'input', type: 'email' } },
                { type: FormDescription, props: { children: 'We never share this.' } },
                { type: FormMessage, props: { children: 'Required field.' } },
              ],
            },
          },
        },
      }),
      container,
    )

    const input = container.querySelector('[data-form-control]')
    const label = container.querySelector('[data-form-label]')

    expect(input?.getAttribute('id')).toBe('field-email')
    expect(label?.getAttribute('for')).toBe('field-email')
    expect(input?.getAttribute('aria-describedby')).toContain('field-email-description')
    expect(input?.getAttribute('aria-describedby')).toContain('field-email-message')

    dispose()
    container.remove()
  })
})
