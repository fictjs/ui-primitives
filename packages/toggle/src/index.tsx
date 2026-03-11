import { mergeProps, prop, type EventHandler, type FictNode, type JSX } from '@fictjs/runtime'

import { composeEventHandlers } from '@fictjs/core-primitive'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'

type MaybeAccessor<T> = T | (() => T)

const NAME = 'Toggle'

type ToggleProps = JSX.IntrinsicElements['button'] & {
  asChild?: boolean
  pressed?: MaybeAccessor<boolean | undefined>
  defaultPressed?: MaybeAccessor<boolean | undefined>
  onPressedChange?: (pressed: boolean) => void
}

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

function Toggle(props: ToggleProps): FictNode {
  const controlledPressed = () =>
    props.pressed === undefined
      ? undefined
      : readValue(props.pressed as MaybeAccessor<boolean | undefined>)
  const defaultPressed = () =>
    props.defaultPressed === undefined ? false : (readValue(props.defaultPressed) ?? false)
  const isDisabled = () => Boolean(readValue(props.disabled as MaybeAccessor<unknown>))

  const controllableStateProps = {
    prop: controlledPressed,
    defaultProp: defaultPressed,
    caller: NAME,
    ...(props.onPressedChange ? { onChange: props.onPressedChange } : {}),
  }

  const [pressed, setPressed] = useControllableState(controllableStateProps)

  const handleClick = composeEventHandlers<MouseEvent>(
    props.onClick as EventHandler<MouseEvent> | undefined,
    () => {
      if (!isDisabled()) {
        setPressed((currentPressed) => !currentPressed)
      }
    },
  )

  const primitiveProps = mergeProps(
    {
      type: 'button',
      'aria-pressed': prop(() => (pressed() ? 'true' : 'false')),
      'data-state': prop(() => (pressed() ? 'on' : 'off')),
      'data-disabled': prop(() => (isDisabled() ? '' : undefined)),
    },
    () => props as Record<string, unknown>,
    {
      defaultPressed: undefined,
      onClick: handleClick,
      onPressedChange: undefined,
      pressed: undefined,
    },
  )

  return <Primitive.button {...(primitiveProps as Record<string, unknown>)} />
}

Toggle.displayName = NAME

const Root = Toggle

export { Toggle, Root }
export type { ToggleProps }
