/** @jsxImportSource fict */

import { createRef, prop } from 'fict'
import type { FictVNode } from 'fict'
import { reactive } from 'fict/advanced'
import { fullWidthClassName, zeroRightClassName } from '@fictjs/fict-remove-scroll-bar/constants'
import { useMergeRefs } from '@fictjs/use-callback-ref'
import { effectCar } from './medium.js'
import type {
  IRemoveScrollUIProps,
  RemoveScrollEffectCallbacks,
  RemoveScrollUIType,
} from './types.js'

export type { IRemoveScrollSelfProps, RemoveScrollUIType } from './types.js'

const noopCallbacks: RemoveScrollEffectCallbacks = {
  onScrollCapture() {},
  onTouchMoveCapture() {},
  onWheelCapture() {},
}

const RESERVED_PROP_NAMES = new Set([
  'allowPinchZoom',
  'as',
  'children',
  'className',
  'enabled',
  'forwardProps',
  'gapMode',
  'inert',
  'noIsolation',
  'noRelative',
  'ref',
  'removeScrollBar',
  'shards',
  'sideCar',
])

function normalizePropKey(key: string): string {
  if (key.startsWith('on') && key.endsWith('Capture') && key.length > 'onCapture'.length) {
    return `oncapture:${key.slice(2, -7).toLowerCase()}`
  }

  return key
}

function copyProps(
  source: Record<string, unknown> | null | undefined,
  exclude: ReadonlySet<string> = new Set(),
  reactiveValues = false,
): Record<string, unknown> {
  if (!source) {
    return {}
  }

  const next: Record<string, unknown> = {}

  for (const key of Reflect.ownKeys(source)) {
    if (typeof key !== 'string' || exclude.has(key)) {
      continue
    }

    next[normalizePropKey(key)] = reactiveValues ? prop(() => source[key]) : source[key]
  }

  return next
}

function isVNode(node: unknown): node is FictVNode {
  return !!node && typeof node === 'object' && 'type' in (node as FictVNode)
}

function cloneVNode(node: FictVNode, props: Record<string, unknown>): FictVNode {
  return {
    ...node,
    props: {
      ...copyProps(node.props as Record<string, unknown> | null | undefined),
      ...props,
    },
  }
}

function readEnabled(value: IRemoveScrollUIProps['enabled']): boolean {
  if (typeof value === 'function') {
    return (value as () => boolean | undefined)() !== false
  }

  return value !== false
}

/**
 * Removes scrollbar from the page and contains scroll within the lock.
 */
const RemoveScroll = ((props: IRemoveScrollUIProps) => {
  const lockRef = createRef<HTMLElement>()
  const containerRef = useMergeRefs<HTMLElement>([lockRef, props.ref as any])
  let callbacks = noopCallbacks

  const setCallbacks = (nextCallbacks: RemoveScrollEffectCallbacks): void => {
    callbacks = nextCallbacks
  }

  const captureProps = {
    'oncapture:scroll': (event: Event) => callbacks.onScrollCapture(event),
    'oncapture:touchmove': (event: TouchEvent) => callbacks.onTouchMoveCapture(event),
    'oncapture:wheel': (event: WheelEvent) => callbacks.onWheelCapture(event),
  }

  const forwardedProps = {
    ...copyProps(props as unknown as Record<string, unknown>, RESERVED_PROP_NAMES, true),
    ...captureProps,
    ref: containerRef,
  }

  const SideCar = props.sideCar
  const Container = props.as ?? 'div'

  const content = props.forwardProps ? (
    (() => {
      if (!isVNode(props.children)) {
        throw new Error('RemoveScroll with `forwardProps` expects a single Fict element child.')
      }

      return cloneVNode(props.children, forwardedProps)
    })()
  ) : (
    <Container {...forwardedProps} className={prop(() => props.className)} ref={containerRef}>
      {props.children}
    </Container>
  )

  return (
    <>
      {reactive(() =>
        readEnabled(props.enabled) ? (
          <SideCar
            sideCar={effectCar}
            allowPinchZoom={prop(() => props.allowPinchZoom ?? false)}
            gapMode={prop(() => props.gapMode)}
            inert={prop(() => props.inert ?? false)}
            lockRef={lockRef}
            noIsolation={prop(() => props.noIsolation ?? false)}
            noRelative={prop(() => props.noRelative ?? false)}
            removeScrollBar={prop(() => props.removeScrollBar ?? true)}
            setCallbacks={setCallbacks}
            shards={prop(() => props.shards)}
          />
        ) : null,
      )}
      {content}
    </>
  )
}) as RemoveScrollUIType

RemoveScroll.classNames = {
  fullWidth: fullWidthClassName,
  zeroRight: zeroRightClassName,
}

export { RemoveScroll }
