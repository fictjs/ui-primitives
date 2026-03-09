import { createRef } from '@fictjs/runtime'

import { arrow, offset, platform, shift, useFloating } from '../src/index.js'

App
function App() {
  const arrowRef = createRef<HTMLDivElement>()
  const referenceRef = createRef<HTMLButtonElement>()
  const floatingRef = createRef<HTMLDivElement>()

  useFloating()

  const floating = useFloating<HTMLButtonElement>({
    open: () => true,
    transform: () => false,
    placement: () => 'right',
    middleware: () => [
      offset(() => ({ mainAxis: 0 })),
      shift(),
      arrow({ element: arrowRef }),
      {
        name: 'test',
        async fn({ elements }) {
          // @ts-expect-error - non-existent property should not be allowed
          elements.floating.notARealProperty = ''
          return {}
        },
      },
      false,
      null,
      undefined,
    ],
    platform: () => ({ ...platform }),
    elements: {
      reference: referenceRef,
      floating: floatingRef,
    },
  })

  floating.x()
  floating.y()
  floating.middlewareData()
  floating.refs.setReference(document.createElement('button'))
  floating.refs.setFloating(document.createElement('div'))
  floating.update()

  return (
    <>
      <button ref={floating.refs.reference} />
      <div ref={floating.refs.setFloating} style={floating.floatingStyles}>
        <div ref={arrowRef} />
      </div>
    </>
  )
}

VirtualReference
function VirtualReference() {
  const floating = useFloating()

  floating.refs.setReference({
    getBoundingClientRect() {
      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        toJSON() {
          return {}
        },
      }
    },
  })

  return <div ref={floating.refs.setFloating} />
}

NarrowReferenceType
function NarrowReferenceType() {
  const floating1 = useFloating()
  const floating2 = useFloating<HTMLButtonElement>()
  const floating3 = useFloating<HTMLAnchorElement>()
  const virtualReference = {
    getBoundingClientRect() {
      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        toJSON() {
          return {}
        },
      }
    },
  }

  // @ts-expect-error - default reference type includes VirtualElement
  floating1.refs.reference.current?.contains(document.body)
  floating2.refs.reference.current?.contains(document.body)
  floating3.refs.reference.current?.contains(document.body)

  floating2.refs.setReference(document.createElement('button'))

  // @ts-expect-error - virtual references are not assignable when the generic narrows to HTMLButtonElement
  floating2.refs.setReference(virtualReference)

  return (
    <>
      <button ref={floating1.refs.setReference} />
      <button ref={floating2.refs.setFloating} />
      {/* @ts-expect-error - no legacy top-level reference property */}
      <button ref={floating3.reference} />
    </>
  )
}

Setters
function Setters() {
  const floating = useFloating({
    elements: {
      floating: document.body,
      reference: document.body,
    },
  })

  return (
    <>
      <div ref={floating.refs.setReference} />
      <div ref={floating.refs.setFloating} />
    </>
  )
}
