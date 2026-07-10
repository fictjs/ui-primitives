import * as React from '../helpers/element.js'
import { mergeProps, prop } from 'fict'
import { Slot as SlotPrimitive } from '@fictjs/radix-ui'
import { renderChildren } from '../helpers/render-children.js'
export const Root: React.FC<Record<string, unknown>> = (props) => (
  <SlotPrimitive.Root {...mergeProps(prop(() => props))}>
    {renderChildren((props as { children?: React.ReactNode }).children)}
  </SlotPrimitive.Root>
)
export const Slot: React.FC<Record<string, unknown>> = (props) => (
  <SlotPrimitive.Root {...mergeProps(prop(() => props))}>
    {renderChildren((props as { children?: React.ReactNode }).children)}
  </SlotPrimitive.Root>
)
export const Slottable: React.FC<{ children?: React.ReactNode }> = (props) => props.children ?? null
