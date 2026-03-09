/** @jsxImportSource fict */

import { createSignal } from 'fict/advanced'

import { RemoveScrollBar, getGapWidth, zeroRightClassName } from '../src/index.js'

function Locker() {
  const locked = createSignal(false)

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {() => (locked() ? <RemoveScrollBar /> : null)}
      <button onClick={() => locked(!locked())}>{() => (locked() ? 'Restore' : 'Remove')}</button>
      <div>{() => `gap: ${JSON.stringify(getGapWidth('margin'))}`}</div>
    </div>
  )
}

function Span() {
  return (
    <div style={{ background: '#eee', padding: '1rem' }}>
      {Array.from({ length: 100 }, () => (
        <>
          --
          <br />
        </>
      ))}
    </div>
  )
}

function Fixed() {
  return (
    <div>
      <div
        style={{
          position: 'fixed',
          background: 'green',
          left: 0,
          top: 0,
          right: 0,
          display: 'flex',
          'justify-content': 'space-between',
        }}
      >
        <div>position fixed</div>
        <div>position fixed</div>
      </div>
      <div
        style={{
          position: 'fixed',
          background: 'green',
          left: 0,
          top: '20px',
          right: 0,
          display: 'flex',
          'justify-content': 'space-between',
        }}
        className={zeroRightClassName}
      >
        <div>position fixed+</div>
        <div>+position fixed</div>
      </div>
    </div>
  )
}

export const Default = () => (
  <>
    <Fixed />
    <br />
    <br />
    <br />
    <Locker />
    <Locker />
    <Span />
  </>
)

export default {
  component: RemoveScrollBar,
  title: 'fict-remove-scroll-bar/Cases',
}
