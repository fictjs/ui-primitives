import { createContext, useContext, type BaseProps } from '@fictjs/runtime'

export type Direction = 'ltr' | 'rtl'

interface DirectionProviderProps extends BaseProps {
  dir: Direction
}

const DirectionContext = createContext<Direction | undefined>(undefined)

function DirectionProvider(props: DirectionProviderProps) {
  return DirectionContext.Provider({
    value: props.dir,
    children: props.children,
  })
}

function useDirection(dir?: Direction): () => Direction {
  const contextDirection = useContext(DirectionContext)

  return () => dir ?? contextDirection ?? 'ltr'
}

export { DirectionContext, DirectionProvider, useDirection }
