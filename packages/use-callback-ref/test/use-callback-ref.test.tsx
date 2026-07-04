import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createRef as createDomRef, render } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import {
  assignRef,
  createCallbackRef,
  mergeRefs,
  refToCallback,
  transformRef,
  useCallbackRef,
  useMergeRefs,
  useRefToCallback,
  useTransformRef,
} from '../src/index.js'

const tick = () =>
  new Promise<void>((resolve) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(resolve)
      return
    }

    Promise.resolve().then(resolve)
  })

describe('@fictjs/use-callback-ref', () => {
  describe('core helpers', () => {
    it('createCallbackRef reports ref transitions and ignores identical writes', () => {
      const transitions: Array<[number | null, number | null]> = []
      const ref = createCallbackRef<number>((next, prev) => {
        transitions.push([next, prev])
      })

      expect(ref.current).toBe(null)

      ref.current = 1
      ref.current = 1
      ref.current = 2
      ref.current = null

      expect(transitions).toEqual([
        [1, null],
        [2, 1],
        [null, 2],
      ])
    })

    it('assignRef supports object refs, callback refs, and null refs', () => {
      const objectRef = { current: null as number | null }
      const callbackRef = vi.fn<(value: number | null) => void>()

      expect(assignRef(objectRef, 3)).toBe(objectRef)
      expect(objectRef.current).toBe(3)

      assignRef(callbackRef, 7)
      assignRef<number>(null, 9)
      assignRef<number>(undefined, 9)

      expect(callbackRef).toHaveBeenCalledTimes(1)
      expect(callbackRef).toHaveBeenCalledWith(7)
    })

    it('useCallbackRef keeps an initial value and can drive merged refs', () => {
      const objectRef = { current: null as number | null }
      const mergedRef = useMergeRefs<number>([objectRef], 5)

      expect(mergedRef.current).toBe(5)
      expect(objectRef.current).toBe(null)

      mergedRef.current = 42

      expect(mergedRef.current).toBe(42)
      expect(objectRef.current).toBe(42)
    })

    it('useCallbackRef also supports the Radix stable-callback overload', () => {
      const events: string[] = []
      const callback = useCallbackRef((value: string) => {
        events.push(value)
      })

      callback('ready')

      expect(events).toEqual(['ready'])
    })

    it('mergeRefs fans values out to all refs and exposes the latest current value', () => {
      const callbackRef = createCallbackRef<number>(() => {})
      const objectRef = { current: null as number | null }
      const spy = vi.fn<(value: number | null) => void>()
      const mergedRef = mergeRefs<number>([callbackRef, objectRef, spy])

      mergedRef.current = 11

      expect(mergedRef.current).toBe(11)
      expect(callbackRef.current).toBe(11)
      expect(objectRef.current).toBe(11)
      expect(spy).toHaveBeenCalledWith(11)
    })

    it('transformRef and useTransformRef map values before assignment', () => {
      const transformedObject = { current: null as string | null }
      const callbackTarget = createCallbackRef<string>(() => {})

      const prefixRef = transformRef<number, string>(
        transformedObject,
        (value) => (value == null ? null : `#${value}`),
      )
      const textRef = useTransformRef<number, string>(
        callbackTarget,
        (value) => (value == null ? null : String(value * 2)),
      )

      prefixRef.current = 12
      textRef.current = 21

      expect(transformedObject.current).toBe('#12')
      expect(callbackTarget.current).toBe('42')
    })

    it('refToCallback and useRefToCallback adapt refs and memoize stable callbacks', () => {
      const objectRef = { current: null as number | null }
      const callback = refToCallback(objectRef)

      callback(10)

      expect(objectRef.current).toBe(10)
      expect(useRefToCallback(objectRef)).toBe(useRefToCallback(objectRef))
      expect(useRefToCallback(null)).toBe(useRefToCallback(null))
      expect(() => useRefToCallback<number>(null)(null)).not.toThrow()
    })
  })

  describe('Fict integration', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })

    afterEach(() => {
      container.remove()
    })

    it('useCallbackRef observes mount and cleanup when used as a Fict DOM ref', () => {
      const transitions: Array<[string | null, string | null]> = []
      const ref = useCallbackRef<HTMLButtonElement>(null, (next, prev) => {
        transitions.push([next?.tagName ?? null, prev?.tagName ?? null])
      })

      const dispose = render(() => <button ref={ref}>Press</button>, container)

      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(transitions).toEqual([['BUTTON', null]])

      dispose()

      expect(ref.current).toBe(null)
      expect(transitions).toEqual([
        ['BUTTON', null],
        [null, 'BUTTON'],
      ])
    })

    it('useMergeRefs forwards mount and cleanup to object refs and callback refs', () => {
      const objectRef = createDomRef<HTMLDivElement>()
      const callbackRef = vi.fn<(value: HTMLDivElement | null) => void>()
      const mergedRef = useMergeRefs<HTMLDivElement>([objectRef, callbackRef])

      const dispose = render(() => <div ref={mergedRef}>Box</div>, container)

      expect(objectRef.current).toBeInstanceOf(HTMLDivElement)
      expect(callbackRef).toHaveBeenCalledTimes(1)
      expect(callbackRef).toHaveBeenLastCalledWith(objectRef.current)

      dispose()

      expect(objectRef.current).toBe(null)
      expect(callbackRef).toHaveBeenCalledTimes(2)
      expect(callbackRef).toHaveBeenLastCalledWith(null)
    })

    it('mergeRefs propagates null when a reactive Fict branch unmounts', async () => {
      const objectRef = createDomRef<HTMLDivElement>()
      const mergedRef = mergeRefs<HTMLDivElement>([objectRef])
      const show = createSignal(true)

      const dispose = render(
        () => (
          <>
            {reactive(() => (show() ? <div ref={mergedRef}>Shown</div> : null))}
          </>
        ),
        container,
      )

      await tick()
      expect(objectRef.current).toBeInstanceOf(HTMLDivElement)

      show(false)
      await tick()

      expect(objectRef.current).toBe(null)

      dispose()
    })

    it('useTransformRef can expose a derived handle from a Fict DOM node', () => {
      const derivedRef = createCallbackRef<string>(() => {})
      const textRef = useTransformRef<HTMLDivElement, string>(
        derivedRef,
        (node) => node?.tagName ?? null,
      )

      const dispose = render(() => <div ref={textRef}>Hello</div>, container)

      expect(derivedRef.current).toBe('DIV')

      dispose()

      expect(derivedRef.current).toBe(null)
    })
  })
})
