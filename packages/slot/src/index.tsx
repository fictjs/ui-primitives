import { Fragment, prop, type FictNode, type FictVNode, type JSX } from '@fictjs/runtime'

import { composeRefs, type PossibleRef } from '@fictjs/compose-refs'

type PropsRecord = Record<PropertyKey, unknown>
type SlotRef = PossibleRef<Element>
type InlineStylableElement = Element & ElementCSSInlineStyle

type SlotProps = JSX.IntrinsicElements['div'] & {
  children?: FictNode | FictNode[]
}

interface SlotCloneProps extends PropsRecord {
  children?: FictNode | FictNode[]
  ref?: SlotRef
}

interface SlottableProps {
  children?: FictNode | FictNode[]
}

interface SlottableComponent {
  (props: SlottableProps): FictNode
  __fictSlotId: symbol
  displayName?: string
}

const SLOTTABLE_IDENTIFIER = Symbol('fict.slot.slottable')
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

function isVNode(node: unknown): node is FictVNode {
  return !!node && typeof node === 'object' && 'type' in (node as FictVNode)
}

function isElementNode(node: unknown): node is Element {
  return typeof Element !== 'undefined' && node instanceof Element
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function flattenChildren(
  children: FictNode | FictNode[] | undefined,
  result: FictNode[] = [],
): FictNode[] {
  if (Array.isArray(children)) {
    for (const child of children) {
      flattenChildren(child, result)
    }
    return result
  }

  if (children !== undefined && children !== null && children !== false) {
    result.push(children)
  }

  return result
}

function getSingleChild(children: FictNode | FictNode[] | undefined): FictNode | null {
  const flattened = flattenChildren(children)
  if (flattened.length !== 1) return null
  return flattened[0] ?? null
}

function normalizePropName(name: string): string {
  if (name === 'className') return 'class'
  if (name === 'htmlFor') return 'for'
  return name
}

function isReactiveValue(value: unknown): value is () => unknown {
  if (typeof value !== 'function') {
    return false
  }

  const reactiveValue = value as unknown as PropsRecord

  return (
    reactiveValue[SIGNAL_MARKER] === true ||
    reactiveValue[COMPUTED_MARKER] === true ||
    reactiveValue[PROP_GETTER_MARKER] === true
  )
}

function readValue<T>(value: T): T {
  if (isReactiveValue(value)) {
    return (value as () => T)()
  }

  return value
}

function normalizeProps(
  source: Record<string, unknown> | null | undefined,
  excluded: Iterable<PropertyKey> = [],
): PropsRecord {
  const next: PropsRecord = {}
  if (!source) return next
  const excludedKeys = new Set(excluded)

  for (const key of Reflect.ownKeys(source)) {
    if (excludedKeys.has(key)) continue

    const normalizedKey = typeof key === 'string' ? normalizePropName(key) : key
    const descriptor = Object.getOwnPropertyDescriptor(source, key)
    if (!descriptor) continue

    if ('value' in descriptor) {
      Object.defineProperty(next, normalizedKey, {
        configurable: true,
        enumerable: descriptor.enumerable ?? true,
        writable: descriptor.writable ?? true,
        value: descriptor.value,
      })
      continue
    }

    const accessorDescriptor: PropertyDescriptor = {
      configurable: true,
      enumerable: descriptor.enumerable ?? true,
    }

    if (descriptor.get) {
      accessorDescriptor.get = descriptor.get
    }

    if (descriptor.set) {
      accessorDescriptor.set = descriptor.set
    }

    Object.defineProperty(next, normalizedKey, accessorDescriptor)
  }

  return next
}

function copyPropsPreservingDescriptors(target: PropsRecord, source: PropsRecord): PropsRecord {
  for (const key of Reflect.ownKeys(source)) {
    const descriptor = Object.getOwnPropertyDescriptor(source, key)
    if (!descriptor) continue
    Object.defineProperty(target, key, descriptor)
  }

  return target
}

function toClassName(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (isObject(value)) {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([name]) => name)
      .join(' ')
  }
  return String(value)
}

function mergeStyle(slotStyle: unknown, childStyle: unknown): unknown {
  if (isObject(slotStyle) && isObject(childStyle)) {
    return { ...slotStyle, ...childStyle }
  }

  if (slotStyle == null) return childStyle
  if (childStyle == null) return slotStyle
  return `${String(slotStyle)}; ${String(childStyle)}`
}

function isEventProp(name: string): boolean {
  return /^on[A-Z]/.test(name) || name.startsWith('oncapture:')
}

function mergeProps(slotProps: PropsRecord, childProps: PropsRecord): PropsRecord {
  const overrideProps: PropsRecord = copyPropsPreservingDescriptors({}, childProps)

  for (const key of Reflect.ownKeys(childProps)) {
    if (typeof key !== 'string') continue

    const slotPropValue = slotProps[key]
    const childPropValue = childProps[key]

    if (isEventProp(key)) {
      if (slotPropValue && childPropValue) {
        overrideProps[key] = (...args: unknown[]) => {
          const resolvedChild = readValue(childPropValue)
          const resolvedSlot = readValue(slotPropValue)
          const childResult =
            typeof resolvedChild === 'function'
              ? (resolvedChild as (...args: unknown[]) => unknown)(...args)
              : undefined
          if (typeof resolvedSlot === 'function') {
            ;(resolvedSlot as (...args: unknown[]) => unknown)(...args)
          }
          return childResult
        }
      } else if (slotPropValue) {
        overrideProps[key] = slotPropValue
      }
    } else if (key === 'style') {
      if (isReactiveValue(slotPropValue) || isReactiveValue(childPropValue)) {
        overrideProps[key] = prop(() =>
          mergeStyle(readValue(slotPropValue), readValue(childPropValue)),
        )
      } else {
        const mergedStyle = mergeStyle(slotPropValue, childPropValue)
        if (mergedStyle !== undefined) {
          overrideProps[key] = mergedStyle
        }
      }
    } else if (key === 'class') {
      if (isReactiveValue(slotPropValue) || isReactiveValue(childPropValue)) {
        overrideProps[key] = prop(() =>
          [toClassName(readValue(slotPropValue)), toClassName(readValue(childPropValue))]
            .filter(Boolean)
            .join(' '),
        )
      } else {
        const mergedClassName = [toClassName(slotPropValue), toClassName(childPropValue)]
          .filter(Boolean)
          .join(' ')
        if (mergedClassName) {
          overrideProps[key] = mergedClassName
        }
      }
    }
  }

  return copyPropsPreservingDescriptors(copyPropsPreservingDescriptors({}, slotProps), overrideProps)
}

function cloneVNode(
  node: FictVNode,
  props: PropsRecord,
  children?: FictNode | FictNode[],
): FictVNode {
  const nextProps = copyPropsPreservingDescriptors(
    normalizeProps(node.props as Record<string, unknown> | null | undefined),
    props,
  )

  if (children !== undefined) {
    nextProps.children = children
  }

  return {
    ...node,
    props: nextProps as Record<string, unknown>,
  }
}

function getElementRef(element: FictVNode): SlotRef {
  const props = element.props as { ref?: SlotRef } | null | undefined
  return props?.ref
}

function isSlottable(child: FictNode): child is FictVNode {
  if (!isVNode(child) || typeof child.type !== 'function') return false
  return (child.type as Partial<SlottableComponent>).__fictSlotId === SLOTTABLE_IDENTIFIER
}

function applySlotPropsToElement(element: Element, slotProps: PropsRecord, forwardedRef?: SlotRef): Element {
  const originalClassName = element.getAttribute('class') ?? ''
  const originalStyle = element.getAttribute('style') ?? ''
  const styleTarget =
    'style' in element ? (element as InlineStylableElement) : null

  for (const key of Reflect.ownKeys(slotProps)) {
    if (typeof key !== 'string') {
      continue
    }

    const value = readValue(slotProps[key])

    if (key === 'class') {
      const nextClassName = [toClassName(value), originalClassName].filter(Boolean).join(' ')
      if (nextClassName) {
        element.setAttribute('class', nextClassName)
      } else {
        element.removeAttribute('class')
      }
      continue
    }

    if (key === 'style') {
      const nextStyle = mergeStyle(value, originalStyle)
      if (!nextStyle) {
        element.removeAttribute('style')
        continue
      }

      if (typeof nextStyle === 'string') {
        element.setAttribute('style', nextStyle)
        continue
      }

      if (!styleTarget) {
        element.setAttribute('style', String(nextStyle))
        continue
      }

      element.setAttribute('style', originalStyle)
      for (const [styleName, styleValue] of Object.entries(nextStyle)) {
        styleTarget.style.setProperty(styleName, String(styleValue))
      }
      continue
    }

    if (isEventProp(key)) {
      if (typeof value === 'function') {
        const eventName = key.startsWith('oncapture:') ? key.slice('oncapture:'.length) : key.slice(2)
        element.addEventListener(eventName.toLowerCase(), value as EventListener)
      }
      continue
    }

    if (value === undefined || value === null || value === false) {
      element.removeAttribute(key)
      continue
    }

    try {
      ;(element as unknown as PropsRecord)[key] = value
    } catch {
      // Fall back to attribute writes for readonly DOM properties.
    }

    if (value === true) {
      element.setAttribute(key, '')
      continue
    }

    element.setAttribute(key, String(value))
  }

  if (forwardedRef) {
    composeRefs(forwardedRef)(element)
  }

  return element
}

function createSlotClone(ownerName: string) {
  const SlotClone = (props: SlotCloneProps): FictNode => {
    const child = getSingleChild(props.children)
    const forwardedRef = props.ref
    const slotProps = normalizeProps(props as Record<string, unknown>, ['children', 'ref'])

    if (!child) return null
    if (!isVNode(child)) return child

    const mergedProps = mergeProps(
      slotProps,
      normalizeProps(child.props as Record<string, unknown> | null | undefined),
    )

    if (child.type !== Fragment) {
      const childRef = getElementRef(child)
      if (forwardedRef || childRef) {
        mergedProps.ref = composeRefs(forwardedRef, childRef)
      }
    }

    return cloneVNode(child, mergedProps)
  }

  SlotClone.displayName = `${ownerName}.SlotClone`
  return SlotClone
}

function createSlot(ownerName: string) {
  const SlotClone = createSlotClone(ownerName)

    const Slot = (props: SlotProps & { ref?: SlotRef }): FictNode => {
    const forwardedRef = props.ref
    const childrenArray = flattenChildren(props.children)
    const slotProps = normalizeProps(props as Record<string, unknown>, ['children', 'ref'])
    const slottable = childrenArray.find(isSlottable)

    if (slottable) {
      const newElement = getSingleChild(
        (slottable.props as { children?: FictNode | FictNode[] } | null | undefined)?.children,
      )

      if (!newElement || !isVNode(newElement)) {
        if (isElementNode(newElement)) {
          return applySlotPropsToElement(newElement, slotProps, forwardedRef)
        }
        return null
      }

      const newChildren = childrenArray.map((child) => {
        if (child === slottable) {
          return (
            (newElement.props as { children?: FictNode | FictNode[] } | null | undefined)
              ?.children ?? null
          )
        }
        return child
      })

      return (
        <SlotClone {...slotProps} ref={forwardedRef}>
          {cloneVNode(newElement, {}, newChildren)}
        </SlotClone>
      )
    }

    const directChild = getSingleChild(props.children)
    if (isElementNode(directChild)) {
      return applySlotPropsToElement(directChild, slotProps, forwardedRef)
    }

    return (
      <SlotClone {...slotProps} ref={forwardedRef}>
        {props.children}
      </SlotClone>
    )
  }

  Slot.displayName = `${ownerName}.Slot`
  return Slot
}

function createSlottable(ownerName: string) {
  const Slottable = ((props: SlottableProps) => props.children ?? null) as SlottableComponent
  Slottable.displayName = `${ownerName}.Slottable`
  Slottable.__fictSlotId = SLOTTABLE_IDENTIFIER
  return Slottable
}

const Slot = createSlot('Slot')
const Slottable = createSlottable('Slottable')
const Root = Slot

export { Slot, Slottable, Root, createSlot, createSlottable }
export type { SlotProps }
