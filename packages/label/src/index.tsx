import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'

import { Primitive } from '@fictjs/primitive'

type LabelProps = JSX.IntrinsicElements['label']

function Label(props: LabelProps): FictNode {
  const labelProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      onMouseDown: undefined,
    },
  )

  return (
    <Primitive.label
      {...(labelProps as Record<string, unknown>)}
      onMouseDown={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('button, input, select, textarea')) return

        props.onMouseDown?.(event)
        if (!event.defaultPrevented && event.detail > 1) {
          event.preventDefault()
        }
      }}
    />
  )
}

Label.displayName = 'Label'

const Root = Label

export { Label, Root }
export type { LabelProps }
