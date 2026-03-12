import classNames from 'classnames'

import { getResponsiveClassNames, getResponsiveStyles } from './get-responsive-styles.js'
import { isResponsiveObject } from './is-responsive-object.js'
import { mergeStyles } from './merge-styles.js'

import type { CSSProperties } from './element.js'
import type { PropDef } from '../props/prop-def.js'

type PropDefsWithClassName<T> =
  T extends Record<string, PropDef>
    ? { [K in keyof T]: T[K] extends { className: string } ? K : never }[keyof T]
    : never

type EnumPropDef = Extract<PropDef, { type: 'enum' }>
type StringLikePropDef = Extract<PropDef, { type: 'string' | 'enum | string' }>
type PropsRecord = Record<string | symbol, unknown>

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

function isPropGetter(value: unknown): value is () => unknown {
  return (
    typeof value === 'function' &&
    (value as (() => unknown) & { [PROP_GETTER_MARKER]?: boolean })[PROP_GETTER_MARKER] === true
  )
}

function readValue<T>(value: T): T {
  if (isPropGetter(value)) {
    return value() as T
  }

  return value
}

function copyPropsPreservingGetters(source: PropsRecord): Record<string, unknown> {
  const target: Record<string, unknown> = {}

  for (const key of Reflect.ownKeys(source)) {
    const descriptor = Object.getOwnPropertyDescriptor(source, key)
    if (!descriptor) {
      continue
    }

    if ('get' in descriptor && typeof descriptor.get === 'function' && !('value' in descriptor)) {
      Object.defineProperty(target, key, {
        configurable: true,
        enumerable: descriptor.enumerable ?? true,
        get: () => descriptor.get?.call(source),
      })
      continue
    }

    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: descriptor.enumerable ?? true,
      value: descriptor.value,
      writable: true,
    })
  }

  return target
}

function setPropValue(target: PropsRecord, key: string | symbol, value: unknown): void {
  const descriptor = Object.getOwnPropertyDescriptor(target, key)

  if (!descriptor || ('value' in descriptor && descriptor.writable)) {
    target[key] = value
    return
  }

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: descriptor.enumerable ?? true,
    writable: true,
    value,
  })
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
  let className: string | undefined
  let style: ReturnType<typeof mergeStyles>
  const extractedProps = copyPropsPreservingGetters(props as PropsRecord) as Record<string, any>
  const allPropDefs = mergePropDefs(...propDefs)

  for (const key in allPropDefs) {
    let value = readValue(extractedProps[key])
    const propDef = allPropDefs[key]
    if (propDef === undefined) {
      continue
    }

    // Apply prop def defaults
    if (propDef.default !== undefined && value === undefined) {
      value = propDef.default
    }

    // Apply the default value if the value is not a valid enum value
    if (isEnumPropDef(propDef)) {
      const values = [propDef.default, ...propDef.values]

      if (!values.includes(value) && !isResponsiveObject(value)) {
        value = propDef.default
      }
    }

    // Apply the value with defaults
    setPropValue(extractedProps, key, value)

    if (hasClassName(propDef)) {
      delete extractedProps[key]

      const isResponsivePropDef = 'responsive' in propDef
      // Make sure we are not threading through responsive values for non-responsive prop defs
      if (!value || (isResponsiveObject(value) && !isResponsivePropDef)) {
        continue
      }

      if (isResponsiveObject(value)) {
        // Apply prop def defaults to the `initial` breakpoint
        if (typeof propDef.default === 'string' && value.initial === undefined) {
          value.initial = propDef.default
        }

        // Apply the default value to the `initial` breakpoint when it is not a valid enum value
        if (isEnumPropDef(propDef)) {
          const values = [propDef.default, ...propDef.values] as ReadonlyArray<unknown>

          if (!values.includes(value.initial)) {
            if (typeof propDef.default === 'string') {
              value.initial = propDef.default
            }
          }
        }
      }

      if (isEnumPropDef(propDef)) {
        const propValues = propDef.values as readonly string[]
        const propClassName = getResponsiveClassNames({
          allowArbitraryValues: false,
          value,
          className: propDef.className,
          propValues,
          parseValue: propDef.parseValue,
        })

        className = classNames(className, propClassName)
        continue
      }

      if (isStringLikePropDef(propDef)) {
        const propDefValues = propDef.type === 'string' ? [] : (propDef.values as readonly string[])

        const [propClassNames, propCustomProperties] = getResponsiveStyles({
          className: propDef.className,
          customProperties: propDef.customProperties,
          propValues: propDefValues,
          parseValue: propDef.parseValue,
          value,
        })

        style = mergeStyles(style, propCustomProperties)
        className = classNames(className, propClassNames)
        continue
      }

      if (propDef.type === 'boolean' && value) {
        // TODO handle responsive boolean props
        className = classNames(className, propDef.className)
        continue
      }
    }
  }

  setPropValue(extractedProps, 'className', classNames(className, props.className))
  setPropValue(extractedProps, 'style', mergeStyles(style, props.style))
  return extractedProps as Omit<
    P & { className?: string; style?: CSSProperties },
    PropDefsWithClassName<T[number]>
  >
}

export { extractProps }
