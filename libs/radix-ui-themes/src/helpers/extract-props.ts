import { prop, untrack } from 'fict'
import baseClassNames from 'classnames'

import { breakpoints } from '../props/prop-def.js'
import { getResponsiveClassNames, getResponsiveStyles } from './get-responsive-styles.js'
import { hasOwnProperty } from './has-own-property.js'
import { mergeStyles } from './merge-styles.js'

import type { CSSProperties } from './element.js'
import type { Breakpoint, PropDef } from '../props/prop-def.js'

type PropDefsWithClassName<T> =
  T extends Record<string, PropDef>
    ? { [K in keyof T]: T[K] extends { className: string } ? K : never }[keyof T]
    : never

type EnumPropDef = Extract<PropDef, { type: 'enum' }>
type StringLikePropDef = Extract<PropDef, { type: 'string' | 'enum | string' }>
type PropsRecord = Record<string | symbol, unknown>
type PropGetter<T> = (() => T) & { [PROP_GETTER_MARKER]?: boolean }

type DerivedProps = {
  className?: string
  style?: ReturnType<typeof mergeStyles>
  values: Record<string, unknown>
}

const LOCAL_VALUE_KEYS = new Set<PropertyKey>([
  'as',
  'asChild',
  'children',
  'content',
  'fallback',
  'loading',
  'ref',
])
const REACTIVE_STRUCTURE_KEYS = new Set<PropertyKey>(['as', 'asChild'])
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

function mergePropDefs<T extends Record<string, PropDef>[]>(...args: T): Record<string, PropDef> {
  return Object.assign({}, ...args)
}

function isEnumPropDef(propDef: PropDef): propDef is EnumPropDef {
  return propDef.type === 'enum'
}

function isStringLikePropDef(propDef: PropDef): propDef is StringLikePropDef {
  return propDef.type === 'string' || propDef.type === 'enum | string'
}

function hasClassName(propDef: PropDef): propDef is PropDef & { className: string } {
  return (
    'className' in propDef && typeof propDef.className === 'string' && propDef.className.length > 0
  )
}

function isPropGetter(value: unknown): value is PropGetter<unknown> {
  return typeof value === 'function' && (value as PropGetter<unknown>)[PROP_GETTER_MARKER] === true
}

function readPropValue<T>(value: T): T {
  return (isPropGetter(value) ? value() : value) as T
}

function isEventHandlerKey(key: PropertyKey): key is string {
  return (
    typeof key === 'string' &&
    (key.startsWith('on:') || key.startsWith('oncapture:') || /^on[A-Z]/.test(key))
  )
}

function isResponsiveRecord(value: unknown, allowEmpty = false): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const keys = Object.keys(value)
  return keys.some((key) => breakpoints.has(key as Breakpoint)) || (allowEmpty && keys.length === 0)
}

function copyPropsPreservingGetters(source: PropsRecord): Record<string, unknown> {
  const target: Record<string, unknown> = {}

  for (const key of Reflect.ownKeys(source)) {
    const descriptor = untrack(() => Object.getOwnPropertyDescriptor(source, key))
    if (descriptor === undefined) {
      continue
    }

    const currentValue = REACTIVE_STRUCTURE_KEYS.has(key) ? source[key] : untrack(() => source[key])
    const isLocallyConsumedValue =
      LOCAL_VALUE_KEYS.has(key) || (typeof currentValue === 'function' && !isEventHandlerKey(key))
    const value = isLocallyConsumedValue ? readPropValue(currentValue) : prop(() => source[key])

    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: descriptor.enumerable,
      // Structural and render-callback values are consumed locally. Everything else stays lazy
      // until it reaches the next component or host, including event handlers whose identity can
      // change reactively.
      value,
      writable: true,
    })
  }

  return target
}

function normalizeValue(value: unknown, propDef: PropDef): unknown {
  let normalizedValue = value
  const isResponsiveValue = isResponsiveRecord(normalizedValue, 'responsive' in propDef)

  if (propDef.default !== undefined && normalizedValue === undefined) {
    normalizedValue = propDef.default
  }

  if (isEnumPropDef(propDef)) {
    const values = [propDef.default, ...propDef.values]

    if (!values.includes(normalizedValue) && !isResponsiveValue) {
      normalizedValue = propDef.default
    }
  }

  if (!isResponsiveRecord(normalizedValue, true) || !('responsive' in propDef)) {
    return normalizedValue
  }

  // Never add defaults to the object supplied by the caller. Besides being surprising, mutating a
  // signal payload here prevents equality-based reactive sources from observing a later change.
  const responsiveValue: Record<string, unknown> = { ...normalizedValue }

  if (propDef.default !== undefined && responsiveValue.initial === undefined) {
    responsiveValue.initial = propDef.default
  }

  if (isEnumPropDef(propDef)) {
    const values = [propDef.default, ...propDef.values] as ReadonlyArray<unknown>
    if (!values.includes(responsiveValue.initial)) {
      responsiveValue.initial = propDef.default
    }
  }

  return responsiveValue
}

function getResponsiveBooleanClassNames(value: unknown, className: string): string | undefined {
  if (value === true) {
    return className
  }

  if (!isResponsiveRecord(value)) {
    return undefined
  }

  const classes: string[] = []
  for (const breakpoint in value) {
    if (!hasOwnProperty(value, breakpoint) || !breakpoints.has(breakpoint as Breakpoint)) {
      continue
    }

    if (value[breakpoint] === true) {
      classes.push(breakpoint === 'initial' ? className : `${breakpoint}:${className}`)
    }
  }

  return classes.length > 0 ? classes.join(' ') : undefined
}

function deriveProps(props: PropsRecord, allPropDefs: Record<string, PropDef>): DerivedProps {
  let className: string | undefined
  let style: ReturnType<typeof mergeStyles>
  const values: Record<string, unknown> = {}

  for (const key in allPropDefs) {
    const propDef = allPropDefs[key]
    if (propDef === undefined) {
      continue
    }

    const value = normalizeValue(readPropValue(props[key]), propDef)
    values[key] = value

    if (!hasClassName(propDef)) {
      continue
    }

    const isResponsivePropDef = 'responsive' in propDef
    // Make sure we are not threading through responsive values for non-responsive prop defs.
    if (!value || (isResponsiveRecord(value) && !isResponsivePropDef)) {
      continue
    }

    if (isEnumPropDef(propDef)) {
      const propValues = propDef.values as readonly string[]
      const propClassName = getResponsiveClassNames({
        allowArbitraryValues: false,
        value: value as Parameters<typeof getResponsiveClassNames>[0]['value'],
        className: propDef.className,
        propValues,
        parseValue: propDef.parseValue,
      })

      className = baseClassNames(className, propClassName)
      continue
    }

    if (isStringLikePropDef(propDef)) {
      const propDefValues = propDef.type === 'string' ? [] : (propDef.values as readonly string[])

      const [propClassNames, propCustomProperties] = getResponsiveStyles({
        className: propDef.className,
        customProperties: propDef.customProperties,
        propValues: propDefValues,
        parseValue: propDef.parseValue,
        value: value as Parameters<typeof getResponsiveStyles>[0]['value'],
      })

      style = mergeStyles(style, propCustomProperties)
      className = baseClassNames(className, propClassNames)
      continue
    }

    if (propDef.type === 'boolean') {
      className = baseClassNames(
        className,
        getResponsiveBooleanClassNames(value, propDef.className),
      )
    }
  }

  return {
    className: baseClassNames(className, readPropValue(props.className) as classNames.Argument),
    style: mergeStyles(style, readPropValue(props.style) as CSSProperties | undefined),
    values,
  }
}

/**
 * Takes props, checks them against prop defs that have a `className` on them,
 * adds necessary CSS classes and inline styles, and returns the props without
 * the corresponding prop defs that were used to formulate the new `className`
 * and `style` values. Also applies prop def defaults to every prop.
 */
function extractProps<
  P extends { className?: string; style?: CSSProperties; [key: string]: any },
  T extends Record<string, PropDef>[],
>(
  props: P,
  ...propDefs: T
): Omit<P & { className?: string; style?: CSSProperties }, PropDefsWithClassName<T[number]>> {
  const extractedProps = copyPropsPreservingGetters(props as PropsRecord) as Record<string, any>
  const allPropDefs = mergePropDefs(...propDefs)
  const derivedProps = prop(() => deriveProps(props as PropsRecord, allPropDefs), { unwrap: false })

  for (const key in allPropDefs) {
    const propDef = allPropDefs[key]
    if (propDef === undefined) {
      continue
    }

    if (hasClassName(propDef)) {
      delete extractedProps[key]
      continue
    }

    extractedProps[key] = LOCAL_VALUE_KEYS.has(key)
      ? normalizeValue(readPropValue((props as PropsRecord)[key]), propDef)
      : prop(() => derivedProps().values[key])
  }

  extractedProps.className = prop(() => derivedProps().className)
  extractedProps.style = prop(() => derivedProps().style)

  return extractedProps as Omit<
    P & { className?: string; style?: CSSProperties },
    PropDefsWithClassName<T[number]>
  >
}

export { extractProps, readPropValue }
