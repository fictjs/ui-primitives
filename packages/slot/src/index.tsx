import { Fragment, prop, type FictNode, type FictVNode, type JSX } from '@fictjs/runtime'

import { composeRefs, type PossibleRef } from '@fictjs/compose-refs'

type PropsRecord = Record<PropertyKey, unknown>
type SlotRef = PossibleRef<Element>

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function flattenChildren(children: FictNode | FictNode[] | undefined, result: FictNode[] = []): FictNode[] {
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
  return (
    typeof value === 'function' &&
    ((value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  )
}

function readValue<T>(value: T): T {
  if (
    isReactiveValue(value)
  ) {
    return (value as () => T)()
  }

  return value
}

function normalizeProps(source: Record<string, unknown> | null | undefined): PropsRecord {
  const next: PropsRecord = {}
  if (!source) return next

  for (const key of Reflect.ownKeys(source)) {
    const normalizedKey = typeof key === 'string' ? normalizePropName(key) : key
    next[normalizedKey] = (source as PropsRecord)[key]
  }

  return next
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
  const overrideProps: PropsRecord = { ...childProps }

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
        overrideProps[key] = prop(() => mergeStyle(readValue(slotPropValue), readValue(childPropValue)))
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

  return { ...slotProps, ...overrideProps }
}

function cloneVNode(
  node: FictVNode,
  props: PropsRecord,
  children?: FictNode | FictNode[],
): FictVNode {
  const nextProps = {
    ...normalizeProps(node.props as Record<string, unknown> | null | undefined),
    ...props,
  }

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

function createSlotClone(ownerName: string) {
  const SlotClone = (props: SlotCloneProps): FictNode => {
    const { children, ref: forwardedRef, ...slotProps } = props
    const child = getSingleChild(children)

    if (!child) return null
    if (!isVNode(child)) return child

    const mergedProps = mergeProps(
      normalizeProps(slotProps as Record<string, unknown>),
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
    const { children, ref: forwardedRef, ...slotProps } = props
    const childrenArray = flattenChildren(children)
    const slottable = childrenArray.find(isSlottable)

    if (slottable) {
      const newElement = getSingleChild(
        (slottable.props as { children?: FictNode | FictNode[] } | null | undefined)?.children,
      )

      if (!newElement || !isVNode(newElement)) {
        return null
      }

      const newChildren = childrenArray.map((child) => {
        if (child === slottable) {
          return (newElement.props as { children?: FictNode | FictNode[] } | null | undefined)?.children ?? null
        }
        return child
      })

      return (
        <SlotClone {...(slotProps as Record<string, unknown>)} ref={forwardedRef}>
          {cloneVNode(newElement, {}, newChildren)}
        </SlotClone>
      )
    }

    return (
      <SlotClone {...(slotProps as Record<string, unknown>)} ref={forwardedRef}>
        {children}
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
