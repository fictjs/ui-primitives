import { createContext, onDestroy, useContext, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

export interface KeyboardModeProviderProps {
  children?: FictNode
}

export interface FocusVisibleProps {
  as?: string
  children?: FictNode
  [key: string]: unknown
}

interface KeyboardModeContextValue {
  isKeyboardMode: () => boolean
}

const KeyboardModeContext = createContext<KeyboardModeContextValue>({
  isKeyboardMode: () => false,
})

export function KeyboardModeProvider(props: KeyboardModeProviderProps): FictNode {
  const keyboardModeSignal = createSignal(false)
  let cleanup: (() => void) | null = null

  if (typeof document !== 'undefined') {
    const onKeyDown = () => keyboardModeSignal(true)
    const onPointerDown = () => keyboardModeSignal(false)

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown, true)

    cleanup = () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }

  onDestroy(() => {
    cleanup?.()
    cleanup = null
  })

  const context: KeyboardModeContextValue = {
    isKeyboardMode: () => keyboardModeSignal(),
  }

  return {
    type: KeyboardModeContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}

export function useKeyboardMode(): () => boolean {
  const context = useContext(KeyboardModeContext)
  return context.isKeyboardMode
}

export function FocusVisible(props: FocusVisibleProps): FictNode {
  const isKeyboardMode = useKeyboardMode()
  const tag = props.as ?? 'div'

  return {
    type: tag,
    props: {
      ...props,
      as: undefined,
      'data-focus-visible': () => (isKeyboardMode() ? 'true' : 'false'),
      children: props.children,
    },
  }
}
