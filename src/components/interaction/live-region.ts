import { createContext, useContext, type FictNode } from '@fictjs/runtime'

import { VisuallyHidden } from '../core/visually-hidden'

export type AnnouncePoliteness = 'polite' | 'assertive'

export interface AnnounceOptions {
  politeness?: AnnouncePoliteness
}

export interface LiveRegionProviderProps {
  children?: FictNode
}

export interface AnnounceProps extends AnnounceOptions {
  message?: string | null
}

interface AnnouncerContextValue {
  announce: (message: string, options?: AnnounceOptions) => void
}

const LiveRegionContext = createContext<AnnouncerContextValue | null>(null)

export function LiveRegionProvider(props: LiveRegionProviderProps): FictNode {
  let politeNode: HTMLElement | null = null
  let assertiveNode: HTMLElement | null = null
  let pendingPolite: string | null = null
  let pendingAssertive: string | null = null

  const writeRegion = (node: HTMLElement | null, message: string) => {
    if (!node) return
    node.textContent = ''
    queueMicrotask(() => {
      if (node) {
        node.textContent = message
      }
    })
  }

  const announce = (message: string, options?: AnnounceOptions) => {
    const politeness = options?.politeness ?? 'polite'
    if (politeness === 'assertive') {
      if (assertiveNode) {
        writeRegion(assertiveNode, message)
      } else {
        pendingAssertive = message
      }
      return
    }

    if (politeNode) {
      writeRegion(politeNode, message)
    } else {
      pendingPolite = message
    }
  }

  return {
    type: LiveRegionContext.Provider,
    props: {
      value: { announce },
      children: [
        props.children,
        {
          type: VisuallyHidden,
          props: {
            'aria-live': 'polite',
            'aria-atomic': 'true',
            'data-live-region': 'polite',
            ref: (node: HTMLElement | null) => {
              politeNode = node
              if (node && pendingPolite) {
                writeRegion(node, pendingPolite)
                pendingPolite = null
              }
            },
            children: '',
          },
        },
        {
          type: VisuallyHidden,
          props: {
            'aria-live': 'assertive',
            'aria-atomic': 'true',
            'data-live-region': 'assertive',
            ref: (node: HTMLElement | null) => {
              assertiveNode = node
              if (node && pendingAssertive) {
                writeRegion(node, pendingAssertive)
                pendingAssertive = null
              }
            },
            children: '',
          },
        },
      ],
    },
  } as unknown as FictNode
}

export function useAnnouncer(): AnnouncerContextValue['announce'] {
  const context = useContext(LiveRegionContext)
  if (!context) {
    throw new Error('useAnnouncer must be used inside LiveRegionProvider')
  }
  return context.announce
}

export function Announce(props: AnnounceProps): FictNode {
  const announce = useAnnouncer()

  if (props.message) {
    announce(props.message, { politeness: props.politeness })
  }

  return null
}
