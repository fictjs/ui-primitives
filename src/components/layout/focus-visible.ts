import { createContext, useContext, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'
import { useEventListener } from '@fictjs/hooks'

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
  const targetDocument = () => (typeof document !== 'undefined' ? document : null)

  useEventListener(targetDocument, 'keydown', () => keyboardModeSignal(true), { capture: true })
  useEventListener(targetDocument, 'pointerdown', () => keyboardModeSignal(false), { capture: true })

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
