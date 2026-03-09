import type { FictNode, JSX } from '@fictjs/runtime'

import { Primitive } from '@fictjs/primitive'

type LabelProps = JSX.IntrinsicElements['label']

function Label(props: LabelProps): FictNode {
  const { onMouseDown, ...labelProps } = props

  return (
    <Primitive.label
      {...(labelProps as Record<string, unknown>)}
      onMouseDown={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('button, input, select, textarea')) return

        onMouseDown?.(event)
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
