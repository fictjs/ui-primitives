import {
  autoPlacement as baseAutoPlacement,
  flip as baseFlip,
  hide as baseHide,
  inline as baseInline,
  limitShift as baseLimitShift,
  offset as baseOffset,
  shift as baseShift,
  size as baseSize,
  type AutoPlacementOptions,
  type Coords,
  type Derivable,
  type FlipOptions,
  type HideOptions,
  type InlineOptions,
  type LimitShiftOptions,
  type Middleware,
  type MiddlewareState,
  type OffsetOptions,
  type ShiftOptions,
  type SizeOptions,
} from '@floating-ui/dom'

import { arrow as baseArrow } from './arrow.js'
import type { ArrowOptions } from './types.js'

export type DependencyList = readonly unknown[]

export const offset = (options?: OffsetOptions, deps?: DependencyList): Middleware => {
  const result = baseOffset(options)
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps],
  }
}

export const shift = (
  options?: ShiftOptions | Derivable<ShiftOptions>,
  deps?: DependencyList,
): Middleware => {
  const result = baseShift(options)
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps],
  }
}

export const limitShift = (
  options?: LimitShiftOptions | Derivable<LimitShiftOptions>,
  deps?: DependencyList,
): {
  fn: (state: MiddlewareState) => Coords
  options: [
    LimitShiftOptions | Derivable<LimitShiftOptions> | undefined,
    DependencyList | undefined,
  ]
} => {
  const result = baseLimitShift(options)
  return {
    fn: result.fn,
    options: [options, deps],
  }
}

export const flip = (
  options?: FlipOptions | Derivable<FlipOptions>,
  deps?: DependencyList,
): Middleware => {
  const result = baseFlip(options)
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps],
  }
}

export const size = (
  options?: SizeOptions | Derivable<SizeOptions>,
  deps?: DependencyList,
): Middleware => {
  const result = baseSize(options)
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps],
  }
}

export const autoPlacement = (
  options?: AutoPlacementOptions | Derivable<AutoPlacementOptions>,
  deps?: DependencyList,
): Middleware => {
  const result = baseAutoPlacement(options)
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps],
  }
}

export const hide = (
  options?: HideOptions | Derivable<HideOptions>,
  deps?: DependencyList,
): Middleware => {
  const result = baseHide(options)
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps],
  }
}

export const inline = (
  options?: InlineOptions | Derivable<InlineOptions>,
  deps?: DependencyList,
): Middleware => {
  const result = baseInline(options)
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps],
  }
}

export const arrow = (
  options: ArrowOptions | Derivable<ArrowOptions>,
  deps?: DependencyList,
): Middleware => {
  const result = baseArrow(options)
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps],
  }
}
