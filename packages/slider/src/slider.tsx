import { mergeProps, prop, untrack, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { createCollection } from '@fictjs/collection'
import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useDirection, type Direction } from '@fictjs/direction'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'
import { usePrevious } from '@fictjs/use-previous'
import { useSize } from '@fictjs/use-size'

type MaybeAccessor<T> = T | (() => T)
type SliderOrientation = 'horizontal' | 'vertical'
type SlideDirection = 'from-left' | 'from-right' | 'from-bottom' | 'from-top'
type ScopedProps<P> = P & { __scopeSlider?: Scope }
type SliderThumbElement = HTMLSpanElement
type SliderStyle = Record<string, string | number>
type SizeKey = 'width' | 'height'

const PAGE_KEYS = ['PageUp', 'PageDown']
const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
const BACK_KEYS: Record<SlideDirection, string[]> = {
  'from-left': ['Home', 'PageDown', 'ArrowDown', 'ArrowLeft'],
  'from-right': ['Home', 'PageDown', 'ArrowDown', 'ArrowRight'],
  'from-bottom': ['Home', 'PageDown', 'ArrowDown', 'ArrowLeft'],
  'from-top': ['Home', 'PageDown', 'ArrowUp', 'ArrowLeft'],
}

const SLIDER_NAME = 'Slider'
const TRACK_NAME = 'SliderTrack'
const RANGE_NAME = 'SliderRange'
const THUMB_NAME = 'SliderThumb'
const BUBBLE_INPUT_NAME = 'SliderBubbleInput'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [Collection, , createCollectionScope] = createCollection<SliderThumbElement>(SLIDER_NAME)
const [createSliderContext, createSliderScope] = createContextScope(SLIDER_NAME, [
  createCollectionScope,
])

type SliderContextValue = {
  name: () => string | undefined
  disabled: () => boolean
  min: () => number
  max: () => number
  values: () => number[]
  valueIndexToChangeRef: { current: number }
  thumbs: Set<SliderThumbElement>
  rootRef: { current: HTMLSpanElement | null }
  orientation: () => SliderOrientation
  dir: () => Direction
  inverted: () => boolean
  style: () => SliderStyle
  form: () => string | undefined
}

type SliderOrientationContextValue = {
  startEdge: () => 'top' | 'right' | 'bottom' | 'left'
  endEdge: () => 'top' | 'right' | 'bottom' | 'left'
  size: () => SizeKey
  direction: () => number
}

const [SliderProvider, useSliderContext] = createSliderContext<SliderContextValue>(SLIDER_NAME)
const [SliderOrientationProvider, useSliderOrientationContext] =
  createSliderContext<SliderOrientationContextValue>(SLIDER_NAME, {
    startEdge: () => 'left',
    endEdge: () => 'right',
    size: () => 'width',
    direction: () => 1,
  })

type SliderProps = Omit<JSX.IntrinsicElements['span'], 'dir' | 'defaultValue' | 'value'> & {
  name?: MaybeAccessor<string | undefined>
  disabled?: MaybeAccessor<boolean | undefined>
  orientation?: MaybeAccessor<SliderOrientation | undefined>
  dir?: MaybeAccessor<Direction | undefined>
  min?: MaybeAccessor<number | undefined>
  max?: MaybeAccessor<number | undefined>
  step?: MaybeAccessor<number | undefined>
  minStepsBetweenThumbs?: MaybeAccessor<number | undefined>
  value?: MaybeAccessor<number[] | undefined>
  defaultValue?: MaybeAccessor<number[] | undefined>
  onValueChange?: (value: number[]) => void
  onValueCommit?: (value: number[]) => void
  inverted?: MaybeAccessor<boolean | undefined>
  form?: MaybeAccessor<string | undefined>
}

type SliderTrackProps = JSX.IntrinsicElements['span']
type SliderRangeProps = JSX.IntrinsicElements['span']
type SliderThumbProps = JSX.IntrinsicElements['span'] & {
  name?: MaybeAccessor<string | undefined>
}

type SliderOrientationPrivateProps = {
  onSlideStart?(value: number): void
  onSlideMove?(value: number): void
  onSlideEnd?(): void
  onHomeKeyDown(): void
  onEndKeyDown(): void
  onStepKeyDown(step: { event: KeyboardEvent; direction: number }): void
}

type SliderOrientationProps = Omit<JSX.IntrinsicElements['span'], 'dir'> &
  SliderOrientationPrivateProps

type SliderImplProps = JSX.IntrinsicElements['span'] & {
  onSlideStart(event: PointerEvent): void
  onSlideMove(event: PointerEvent): void
  onSlideEnd(event: PointerEvent): void
  onHomeKeyDown(): void
  onEndKeyDown(): void
  onStepKeyDown(event: KeyboardEvent): void
}

type SliderBubbleInputProps = Omit<
  JSX.IntrinsicElements['input'],
  'defaultValue' | 'name' | 'form' | 'value'
> & {
  name?: MaybeAccessor<string | undefined>
  form?: MaybeAccessor<string | undefined>
  value: MaybeAccessor<number | undefined>
}

function readValue<T>(value: MaybeAccessor<T>): T {
  if (
    typeof value === 'function' &&
    (value.length === 0 ||
      (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  ) {
    return (value as () => T)()
  }

  return value as T
}

function readStyle(value: unknown): SliderStyle {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as SliderStyle
}

function clamp(value: number, [min, max]: [number, number]) {
  return Math.min(max, Math.max(min, value))
}

function sortAndClampValues(values: number[], min: number, max: number): number[] {
  return [...values].map((value) => clamp(value, [min, max])).sort((a, b) => a - b)
}

function Slider(props: ScopedProps<SliderProps>): FictNode {
  const inheritedDirection = useDirection()
  const direction = () =>
    props.dir === undefined
      ? inheritedDirection()
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? inheritedDirection())
  const name = () =>
    props.name === undefined
      ? undefined
      : readValue(props.name as MaybeAccessor<string | undefined>)
  const disabled = () =>
    Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const orientation = () =>
    props.orientation === undefined
      ? 'horizontal'
      : ((readValue(props.orientation as MaybeAccessor<SliderOrientation | undefined>) ??
          'horizontal') as SliderOrientation)
  const min = () =>
    props.min === undefined ? 0 : (readValue(props.min as MaybeAccessor<number | undefined>) ?? 0)
  const max = () =>
    props.max === undefined
      ? 100
      : (readValue(props.max as MaybeAccessor<number | undefined>) ?? 100)
  const step = () =>
    props.step === undefined ? 1 : (readValue(props.step as MaybeAccessor<number | undefined>) ?? 1)
  const minStepsBetweenThumbs = () =>
    props.minStepsBetweenThumbs === undefined
      ? 0
      : (readValue(props.minStepsBetweenThumbs as MaybeAccessor<number | undefined>) ?? 0)
  const inverted = () =>
    Boolean(readValue(props.inverted as MaybeAccessor<boolean | undefined>) ?? false)
  const form = () =>
    props.form === undefined
      ? undefined
      : readValue(props.form as MaybeAccessor<string | undefined>)
  const defaultValue = () => {
    const nextDefaultValue =
      props.defaultValue === undefined
        ? [min()]
        : (readValue(props.defaultValue as MaybeAccessor<number[] | undefined>) ?? [min()])

    return sortAndClampValues(nextDefaultValue, min(), max())
  }
  const valueProp = () => {
    const nextValue =
      props.value === undefined
        ? undefined
        : readValue(props.value as MaybeAccessor<number[] | undefined>)

    return nextValue === undefined ? undefined : sortAndClampValues(nextValue, min(), max())
  }
  const valueIndexToChangeRef = { current: 0 }
  const thumbs = new Set<SliderThumbElement>()
  const rootRef = { current: null as HTMLSpanElement | null }
  const valuesBeforeSlideStartRef = { current: defaultValue() }
  const [values, setValues] = useControllableState<number[]>({
    prop: valueProp,
    defaultProp: defaultValue,
    caller: SLIDER_NAME,
    onChange: (nextValues) => {
      const thumb = Array.from(thumbs)[valueIndexToChangeRef.current]
      thumb?.focus()
      props.onValueChange?.(nextValues)
    },
  })
  const initialValues = untrack(() => [...values()])

  useLayoutEffect(() => {
    const document = rootRef.current?.ownerDocument ?? globalThis.document
    if (!document) return

    let disposed = false
    const getFormOwner = () => {
      const root = rootRef.current
      if (!root) return null

      const formId = form()
      if (!formId) return root.closest('form')

      const formElement = root.ownerDocument.getElementById(formId)
      return formElement?.tagName === 'FORM' ? (formElement as HTMLFormElement) : null
    }
    const handleReset = (event: Event) => {
      if (event.target !== getFormOwner()) return

      queueMicrotask(() => {
        if (disposed || event.defaultPrevented || valueProp() !== undefined) return
        setValues([...initialValues])
      })
    }

    document.addEventListener('reset', handleReset)
    return () => {
      disposed = true
      document.removeEventListener('reset', handleReset)
    }
  })

  const updateValues = (value: number, atIndex: number, { commit } = { commit: false }) => {
    const decimalCount = getDecimalCount(step())
    const snapToStep = roundValue(
      Math.round((value - min()) / step()) * step() + min(),
      decimalCount,
    )
    const nextValue = clamp(snapToStep, [min(), max()])

    setValues((prevValues = []) => {
      const nextValues = getNextSortedValues(prevValues, nextValue, atIndex)
      if (!hasMinStepsBetweenValues(nextValues, minStepsBetweenThumbs() * step())) {
        return prevValues
      }

      valueIndexToChangeRef.current = nextValues.indexOf(nextValue)
      const hasChanged = String(nextValues) !== String(prevValues)

      if (hasChanged && commit) {
        props.onValueCommit?.(nextValues)
      }

      return hasChanged ? nextValues : prevValues
    })
  }

  const handleSlideStart = (value: number) => {
    const closestIndex = getClosestValueIndex(values(), value)
    updateValues(value, closestIndex)
  }

  const handleSlideMove = (value: number) => {
    updateValues(value, valueIndexToChangeRef.current)
  }

  const handleSlideEnd = () => {
    const previousValue = valuesBeforeSlideStartRef.current[valueIndexToChangeRef.current]
    const nextValue = values()[valueIndexToChangeRef.current]
    if (previousValue !== nextValue) {
      props.onValueCommit?.(values())
    }
  }

  const sliderProps = mergeProps(
    {
      'aria-disabled': prop(() => (disabled() ? 'true' : undefined)),
      'data-disabled': prop(() => (disabled() ? '' : undefined)),
      onPointerDown: composeEventHandlers<PointerEvent>(
        props.onPointerDown as ((event: PointerEvent) => void) | undefined,
        () => {
          if (!disabled()) {
            valuesBeforeSlideStartRef.current = values()
          }
        },
      ),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeSlider: undefined,
      defaultValue: undefined,
      dir: undefined,
      disabled: undefined,
      form: undefined,
      inverted: undefined,
      max: undefined,
      min: undefined,
      minStepsBetweenThumbs: undefined,
      name: undefined,
      onValueChange: undefined,
      onValueCommit: undefined,
      orientation: undefined,
      step: undefined,
      value: undefined,
    },
  )
  const orientationNode = (
    <SliderOrientation
      {...(sliderProps as Record<string, unknown>)}
      __scopeSlider={props.__scopeSlider}
      onSlideStart={handleSlideStart}
      onSlideMove={handleSlideMove}
      onSlideEnd={handleSlideEnd}
      onHomeKeyDown={() => {
        if (!disabled()) {
          updateValues(min(), 0, { commit: true })
        }
      }}
      onEndKeyDown={() => {
        if (!disabled()) {
          updateValues(max(), values().length - 1, { commit: true })
        }
      }}
      onStepKeyDown={({
        event,
        direction: stepDirection,
      }: {
        event: KeyboardEvent
        direction: number
      }) => {
        if (disabled()) return

        const isPageKey = PAGE_KEYS.includes(event.key)
        const isSkipKey = isPageKey || (event.shiftKey && ARROW_KEYS.includes(event.key))
        const multiplier = isSkipKey ? 10 : 1
        const atIndex = valueIndexToChangeRef.current
        const currentValue = values()[atIndex] ?? min()
        updateValues(currentValue + step() * multiplier * stepDirection, atIndex, {
          commit: true,
        })
      }}
    />
  ) as unknown as FictNode

  return (
    <SliderProvider
      scope={props.__scopeSlider as Scope<SliderContextValue | undefined>}
      name={name}
      disabled={disabled}
      min={min}
      max={max}
      values={values}
      valueIndexToChangeRef={valueIndexToChangeRef}
      thumbs={thumbs}
      rootRef={rootRef}
      orientation={orientation}
      dir={direction}
      inverted={inverted}
      style={() => readStyle(props.style)}
      form={form}
    >
      <Collection.Provider scope={props.__scopeSlider}>
        <Collection.Slot scope={props.__scopeSlider}>{orientationNode}</Collection.Slot>
      </Collection.Provider>
    </SliderProvider>
  )
}

Slider.displayName = SLIDER_NAME

function SliderOrientation(props: ScopedProps<SliderOrientationProps>): FictNode {
  const {
    __scopeSlider,
    onSlideStart,
    onSlideMove,
    onSlideEnd,
    onHomeKeyDown,
    onEndKeyDown,
    onStepKeyDown,
    ...sliderProps
  } = props
  const context = useSliderContext(
    SLIDER_NAME,
    __scopeSlider as Scope<SliderContextValue | undefined>,
  )
  const slider = createSignal<HTMLSpanElement | null>(null)
  const rectRef = { current: undefined as DOMRect | undefined }
  const isHorizontal = () => context.orientation() === 'horizontal'
  const isDirectionLTR = () => context.dir() === 'ltr'
  const isSlidingFromLeft = () =>
    (isDirectionLTR() && !context.inverted()) || (!isDirectionLTR() && context.inverted())
  const isSlidingFromBottom = () => !context.inverted()
  const startEdge = () =>
    isHorizontal()
      ? isSlidingFromLeft()
        ? 'left'
        : 'right'
      : isSlidingFromBottom()
        ? 'bottom'
        : 'top'
  const endEdge = () =>
    isHorizontal()
      ? isSlidingFromLeft()
        ? 'right'
        : 'left'
      : isSlidingFromBottom()
        ? 'top'
        : 'bottom'
  const size = () => (isHorizontal() ? 'width' : 'height')
  const slideDirection = (): SlideDirection =>
    isHorizontal()
      ? isSlidingFromLeft()
        ? 'from-left'
        : 'from-right'
      : isSlidingFromBottom()
        ? 'from-bottom'
        : 'from-top'

  const getValueFromPointer = (event: PointerEvent) => {
    const sliderNode = slider()
    const rect = rectRef.current ?? sliderNode?.getBoundingClientRect()
    if (!rect) return context.min()

    rectRef.current = rect
    if (isHorizontal()) {
      return linearScale(
        [0, rect.width],
        isSlidingFromLeft() ? [context.min(), context.max()] : [context.max(), context.min()],
      )(event.clientX - rect.left)
    }

    return linearScale(
      [0, rect.height],
      isSlidingFromBottom() ? [context.max(), context.min()] : [context.min(), context.max()],
    )(event.clientY - rect.top)
  }

  useLayoutEffect(() => {
    context.orientation()
    context.dir()
    context.inverted()
    rectRef.current = undefined
  })

  return (
    <SliderOrientationProvider
      scope={__scopeSlider as Scope<SliderOrientationContextValue | undefined>}
      startEdge={startEdge}
      endEdge={endEdge}
      size={size}
      direction={() =>
        isHorizontal() ? (isSlidingFromLeft() ? 1 : -1) : isSlidingFromBottom() ? 1 : -1
      }
    >
      <SliderImpl
        {...(sliderProps as Record<string, unknown>)}
        __scopeSlider={__scopeSlider}
        ref={useComposedRefs(props.ref as PossibleRef<HTMLSpanElement>, (node) => slider(node))}
        onSlideStart={(event) => {
          onSlideStart?.(getValueFromPointer(event))
        }}
        onSlideMove={(event) => {
          onSlideMove?.(getValueFromPointer(event))
        }}
        onSlideEnd={() => {
          rectRef.current = undefined
          onSlideEnd?.()
        }}
        onHomeKeyDown={onHomeKeyDown}
        onEndKeyDown={onEndKeyDown}
        onStepKeyDown={(event) => {
          const isBackKey = BACK_KEYS[slideDirection()].includes(event.key)
          onStepKeyDown({ event, direction: isBackKey ? -1 : 1 })
        }}
      />
    </SliderOrientationProvider>
  )
}

function SliderImpl(props: ScopedProps<SliderImplProps>): FictNode {
  const {
    __scopeSlider,
    onSlideStart,
    onSlideMove,
    onSlideEnd,
    onHomeKeyDown,
    onEndKeyDown,
    onStepKeyDown,
    ...sliderProps
  } = props
  const context = useSliderContext(
    SLIDER_NAME,
    __scopeSlider as Scope<SliderContextValue | undefined>,
  )
  const isSlidingRef = { current: false }

  const primitiveProps = mergeProps(
    prop(() => sliderProps as Record<string, unknown>),
    {
      'data-orientation': prop(context.orientation),
      dir: prop(context.dir),
      style: prop(() => ({
        ...context.style(),
        '--radix-slider-thumb-transform':
          context.orientation() === 'horizontal' ? 'translateX(-50%)' : 'translateY(50%)',
      })),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event) => {
          if (context.disabled()) return

          if (event.key === 'Home') {
            onHomeKeyDown()
            event.preventDefault()
          } else if (event.key === 'End') {
            onEndKeyDown()
            event.preventDefault()
          } else if (PAGE_KEYS.concat(ARROW_KEYS).includes(event.key)) {
            onStepKeyDown(event)
            event.preventDefault()
          }
        },
      ),
      onPointerDown: composeEventHandlers<PointerEvent>(
        props.onPointerDown as ((event: PointerEvent) => void) | undefined,
        (event) => {
          if (context.disabled()) return

          const target = event.target as HTMLElement | null
          target?.setPointerCapture?.(event.pointerId)
          isSlidingRef.current = !context.thumbs.has(target as SliderThumbElement)
          event.preventDefault()

          if (context.thumbs.has(target as SliderThumbElement)) {
            target?.focus()
          } else {
            onSlideStart(event)
          }
        },
      ),
      onPointerMove: composeEventHandlers<PointerEvent>(
        props.onPointerMove as ((event: PointerEvent) => void) | undefined,
        (event) => {
          if (context.disabled()) return

          const target = event.target as HTMLElement | null
          if (isSlidingRef.current || target?.hasPointerCapture?.(event.pointerId)) {
            onSlideMove(event)
          }
        },
      ),
      onPointerUp: composeEventHandlers<PointerEvent>(
        props.onPointerUp as ((event: PointerEvent) => void) | undefined,
        (event) => {
          if (context.disabled()) return

          const target = event.target as HTMLElement | null
          const hasPointer = target?.hasPointerCapture?.(event.pointerId)
          if (isSlidingRef.current || hasPointer) {
            target?.releasePointerCapture?.(event.pointerId)
            isSlidingRef.current = false
            onSlideEnd(event)
          }
        },
      ),
    },
  )

  return (
    <Primitive.span
      {...(primitiveProps as Record<string, unknown>)}
      ref={useComposedRefs(
        (props.ref as PossibleRef<HTMLSpanElement>) ?? undefined,
        context.rootRef,
      )}
    />
  )
}

function SliderTrack(props: ScopedProps<SliderTrackProps>): FictNode {
  const { __scopeSlider, ...trackProps } = props
  const context = useSliderContext(
    TRACK_NAME,
    __scopeSlider as Scope<SliderContextValue | undefined>,
  )
  const primitiveProps = mergeProps(
    {
      'data-disabled': prop(() => (context.disabled() ? '' : undefined)),
      'data-orientation': prop(context.orientation),
    },
    prop(() => trackProps as Record<string, unknown>),
  )

  if (props.ref) {
    const forwardedRef = props.ref! as unknown as
      | ((node: HTMLSpanElement | null) => void)
      | { current: HTMLSpanElement | null }
    return <Primitive.span {...(primitiveProps as Record<string, unknown>)} ref={forwardedRef} />
  }

  return <Primitive.span {...(primitiveProps as Record<string, unknown>)} />
}

function SliderRange(props: ScopedProps<SliderRangeProps>): FictNode {
  const { __scopeSlider, ...rangeProps } = props
  const context = useSliderContext(
    RANGE_NAME,
    __scopeSlider as Scope<SliderContextValue | undefined>,
  )
  const orientation = useSliderOrientationContext(
    RANGE_NAME,
    __scopeSlider as Scope<SliderOrientationContextValue | undefined>,
  )
  const percentages = () =>
    context.values().map((value) => convertValueToPercentage(value, context.min(), context.max()))
  const offsetStart = () => (context.values().length > 1 ? Math.min(...percentages()) : 0)
  const offsetEnd = () => 100 - Math.max(...percentages(), 0)
  const primitiveProps = mergeProps(
    {
      'data-disabled': prop(() => (context.disabled() ? '' : undefined)),
      'data-orientation': prop(context.orientation),
      style: prop(() => ({
        ...readStyle(props.style),
        [orientation.startEdge()]: `${offsetStart()}%`,
        [orientation.endEdge()]: `${offsetEnd()}%`,
      })),
    },
    prop(() => rangeProps as Record<string, unknown>),
  )

  if (props.ref) {
    const forwardedRef = props.ref! as unknown as
      | ((node: HTMLSpanElement | null) => void)
      | { current: HTMLSpanElement | null }
    return <Primitive.span {...(primitiveProps as Record<string, unknown>)} ref={forwardedRef} />
  }

  return <Primitive.span {...(primitiveProps as Record<string, unknown>)} />
}

function SliderThumb(props: ScopedProps<SliderThumbProps>): FictNode {
  const thumb = createSignal<SliderThumbElement | null>(null)
  const context = useSliderContext(
    THUMB_NAME,
    props.__scopeSlider as Scope<SliderContextValue | undefined>,
  )
  const orientation = useSliderOrientationContext(
    THUMB_NAME,
    props.__scopeSlider as Scope<SliderOrientationContextValue | undefined>,
  )
  const index = () => {
    const thumbNode = thumb()
    if (!thumbNode) return -1

    const thumbNodes = Array.from(
      context.rootRef.current?.querySelectorAll<SliderThumbElement>('[data-radix-slider-thumb]') ??
        [],
    )

    return thumbNodes.indexOf(thumbNode)
  }
  const value = () => {
    const currentIndex = index()
    return currentIndex === -1 ? undefined : context.values()[currentIndex]
  }
  const percent = () =>
    value() === undefined ? 0 : convertValueToPercentage(value()!, context.min(), context.max())
  const size = useSize(thumb)
  const thumbInBoundsOffset = () => {
    const dimension = size()?.[orientation.size()]
    return dimension ? getThumbInBoundsOffset(dimension, percent(), orientation.direction()) : 0
  }
  const isFormControl = createSignal(false)
  const label = () => getLabel(index(), context.values().length)
  const wrapperStyle = () => ({
    transform: 'var(--radix-slider-thumb-transform)',
    position: 'absolute',
    [orientation.startEdge()]: `calc(${percent()}% + ${thumbInBoundsOffset()}px)`,
  })
  const thumbProps = mergeProps(
    {
      role: 'slider',
      'data-radix-slider-thumb': '',
      'aria-label': prop(() => props['aria-label'] ?? label()),
      'aria-valuemin': prop(context.min),
      'aria-valuenow': prop(value),
      'aria-valuemax': prop(context.max),
      'aria-orientation': prop(context.orientation),
      'data-disabled': prop(() => (context.disabled() ? '' : undefined)),
      'data-orientation': prop(context.orientation),
      tabIndex: prop(() => (context.disabled() ? undefined : 0)),
      style: prop(() => (value() === undefined ? { display: 'none' } : readStyle(props.style))),
      onFocus: composeEventHandlers<FocusEvent>(
        props.onFocus as ((event: FocusEvent) => void) | undefined,
        () => {
          context.valueIndexToChangeRef.current = Math.max(0, index())
        },
      ),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeSlider: undefined,
      name: undefined,
      ref: undefined,
    },
  )

  useLayoutEffect(() => {
    const thumbNode = thumb()
    if (!thumbNode) return

    queueMicrotask(() => {
      if (thumb() === thumbNode) {
        isFormControl(Boolean(context.form() || thumbNode.closest('form')))
      }
    })
    context.thumbs.add(thumbNode)
    return () => {
      context.thumbs.delete(thumbNode)
    }
  })

  const bubbleInputNode = reactive(() =>
    isFormControl() ? (
      <SliderBubbleInput
        __scopeSlider={props.__scopeSlider}
        name={() => {
          const itemName =
            props.name === undefined
              ? context.name()
              : readValue(props.name as MaybeAccessor<string | undefined>)

          if (!itemName) return undefined
          return context.values().length > 1 ? `${itemName}[]` : itemName
        }}
        form={context.form}
        value={value}
      />
    ) : null,
  ) as unknown as FictNode
  const wrapperProps = mergeProps({
    style: prop(wrapperStyle),
  })

  return (
    <span {...(wrapperProps as Record<string, unknown>)}>
      <Collection.ItemSlot scope={props.__scopeSlider}>
        <Primitive.span
          {...(thumbProps as Record<string, unknown>)}
          ref={useComposedRefs(
            (props.ref as PossibleRef<SliderThumbElement>) ?? undefined,
            (node) => thumb(node),
          )}
        />
      </Collection.ItemSlot>
      {bubbleInputNode}
    </span>
  )
}

SliderThumb.displayName = THUMB_NAME

function SliderBubbleInput(props: ScopedProps<SliderBubbleInputProps>): FictNode {
  const { form: formProp, ...inputRestProps } = props
  const ref = createSignal<HTMLInputElement | null>(null)
  const previousValue = usePrevious(props.value)

  useLayoutEffect(() => {
    const input = ref()
    const nextValue = readValue(props.value)
    const prevValue = previousValue()
    const nextValueString = nextValue === undefined ? '' : String(nextValue)

    if (!input) return

    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    const setValue = descriptor?.set
    if (input.value !== nextValueString) {
      if (setValue) {
        setValue.call(input, nextValueString)
      } else {
        input.value = nextValueString
      }
    }

    if (!Object.is(prevValue, nextValue)) {
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })

  const inputProps = mergeProps(
    prop(() => inputRestProps as Record<string, unknown>),
    {
      __scopeSlider: undefined,
      defaultValue: undefined,
      'attr:form': prop(() =>
        formProp === undefined
          ? undefined
          : readValue(formProp as MaybeAccessor<string | undefined>),
      ),
      name: prop(() =>
        props.name === undefined
          ? undefined
          : readValue(props.name as MaybeAccessor<string | undefined>),
      ),
      ref: undefined,
      style: prop(() => ({
        display: 'none',
        ...readStyle(props.style),
      })),
      value: prop(() => {
        const nextValue = readValue(props.value)
        return nextValue === undefined ? '' : String(nextValue)
      }),
    },
  )

  return (
    <Primitive.input
      {...(inputProps as Record<string, unknown>)}
      ref={useComposedRefs((props.ref as PossibleRef<HTMLInputElement>) ?? undefined, (node) =>
        ref(node),
      )}
    />
  )
}

SliderBubbleInput.displayName = BUBBLE_INPUT_NAME

function getNextSortedValues(prevValues: number[] = [], nextValue: number, atIndex: number) {
  const nextValues = [...prevValues]
  nextValues[atIndex] = nextValue
  return nextValues.sort((a, b) => a - b)
}

function convertValueToPercentage(value: number, min: number, max: number) {
  const maxSteps = max - min
  if (maxSteps <= 0) return 0
  const percentPerStep = 100 / maxSteps
  return clamp(percentPerStep * (value - min), [0, 100])
}

function getLabel(index: number, totalValues: number) {
  if (index < 0) return undefined
  if (totalValues > 2) return `Value ${index + 1} of ${totalValues}`
  if (totalValues === 2) return ['Minimum', 'Maximum'][index]
  return undefined
}

function getClosestValueIndex(values: number[], nextValue: number) {
  if (values.length <= 1) return 0
  const distances = values.map((value) => Math.abs(value - nextValue))
  const closestDistance = Math.min(...distances)
  return distances.indexOf(closestDistance)
}

function getThumbInBoundsOffset(size: number, offset: number, direction: number) {
  const halfSize = size / 2
  const offsetScale = linearScale([0, 50], [0, halfSize])
  return (halfSize - offsetScale(offset) * direction) * direction
}

function getStepsBetweenValues(values: number[]) {
  return values.slice(0, -1).map((value, index) => values[index + 1]! - value)
}

function hasMinStepsBetweenValues(values: number[], minStepsBetweenValues: number) {
  if (minStepsBetweenValues <= 0) return true
  const stepsBetweenValues = getStepsBetweenValues(values)
  const actualMinStepsBetweenValues = Math.min(...stepsBetweenValues)
  return actualMinStepsBetweenValues >= minStepsBetweenValues
}

function linearScale(input: readonly [number, number], output: readonly [number, number]) {
  return (value: number) => {
    if (input[0] === input[1] || output[0] === output[1]) {
      return output[0]
    }

    const ratio = (output[1] - output[0]) / (input[1] - input[0])
    return output[0] + ratio * (value - input[0])
  }
}

function getDecimalCount(value: number) {
  return (String(value).split('.')[1] || '').length
}

function roundValue(value: number, decimalCount: number) {
  const rounder = 10 ** decimalCount
  return Math.round(value * rounder) / rounder
}

const Root = Slider
const Track = SliderTrack
const Range = SliderRange
const Thumb = SliderThumb

export {
  createSliderScope,
  Slider,
  SliderTrack,
  SliderRange,
  SliderThumb,
  Root,
  Track,
  Range,
  Thumb,
}
export type { SliderProps, SliderTrackProps, SliderRangeProps, SliderThumbProps }
