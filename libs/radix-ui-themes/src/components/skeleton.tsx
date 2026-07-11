import { createElement } from 'fict'
import { createConditional } from 'fict/internal'
import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { Slot } from '@fictjs/radix-ui'

import { inert } from '../helpers/inert.js'
import { extractProps, readPropValue } from '../helpers/extract-props.js'
import { marginPropDefs } from '../props/margin.props.js'
import { skeletonPropDefs } from './skeleton.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'

type SkeletonElement = React.ElementRef<'span'>
type SkeletonOwnProps = GetPropDefTypes<typeof skeletonPropDefs>
interface SkeletonProps
  extends ComponentPropsWithout<'span', RemovedProps>, MarginProps, SkeletonOwnProps {}
const replacedElementTags = new Set([
  'audio',
  'canvas',
  'embed',
  'iframe',
  'img',
  'object',
  'svg',
  'video',
])
const paintedControlTags = new Set(['button', 'input', 'meter', 'progress', 'select', 'textarea'])
const paintedControlComponentNames = new Set([
  'Button',
  'Checkbox',
  'CheckboxCards.Item',
  'CheckboxGroup.Item',
  'IconButton',
  'Radio',
  'RadioCards.Item',
  'RadioGroup.Item',
  'SegmentedControl.Item',
  'Select.Trigger',
  'Slider',
  'Switch',
  'TextArea',
  'TextField.Root',
])

function getElementTypeName(type: unknown): string | undefined {
  if (typeof type === 'string') return type
  if (!type || (typeof type !== 'function' && typeof type !== 'object')) return undefined

  const component = type as { displayName?: string; name?: string }
  return component.displayName || component.name
}

function shouldWrapChild(children: React.ReactNode): boolean {
  if (!React.isValidElement(children)) return true

  const typeName = getElementTypeName(children.type)
  if (!typeName) return false

  return (
    replacedElementTags.has(typeName) ||
    paintedControlTags.has(typeName) ||
    paintedControlComponentNames.has(typeName)
  )
}

const Skeleton = React.forwardRef<SkeletonElement, SkeletonProps>((props, forwardedRef) => {
  const { children, className, loading, ...skeletonProps } = extractProps(
    props,
    skeletonPropDefs,
    marginPropDefs,
  )

  return createConditional(
    () => Boolean(readPropValue(loading)),
    () => {
      const currentChildren = readPropValue(children)
      const useWrapper = shouldWrapChild(currentChildren)
      const Tag = useWrapper ? 'span' : Slot.Root

      return (
        <Tag
          ref={React.coerceRef(forwardedRef)}
          aria-hidden
          class={classNames('rt-Skeleton', className)}
          data-inline-skeleton={
            useWrapper && !React.isValidElement(currentChildren) ? true : undefined
          }
          tabIndex={-1}
          inert={inert}
          {...skeletonProps}
        >
          {currentChildren}
        </Tag>
      )
    },
    createElement,
    () => readPropValue(children),
    undefined,
    undefined,
    { trackBranchReads: true },
  ) as unknown as React.ReactNode
})
Skeleton.displayName = 'Skeleton'

export { Skeleton }
export type { SkeletonProps }
