/** @jsxImportSource fict */

import type { FictNode } from 'fict'
import { createSignal } from 'fict/advanced'

import {
  RemoveScrollBar,
  fullWidthClassName,
  getGapWidth,
  noScrollbarsClassName,
  zeroRightClassName,
} from '@fictjs/fict-remove-scroll-bar'

function fill(count: number, label: string): string[] {
  return Array.from({ length: count }, (_, index) => `${label} ${index + 1}`)
}

function Locker(props: { label: string }): FictNode {
  const locked = createSignal(false)

  return (
    <div
      style={{
        display: 'grid',
        gap: '0.5rem',
        padding: '1rem',
        border: '1px solid #d6d6d6',
        background: '#faf7f2',
      }}
    >
      {locked() ? <RemoveScrollBar /> : null}
      <div
        style={{ display: 'flex', gap: '0.75rem', 'align-items': 'center', 'flex-wrap': 'wrap' }}
      >
        <button
          onClick={() => locked(!locked())}
        >{`${props.label}: ${locked() ? 'restore scroll' : 'remove scroll'}`}</button>
        <code>{JSON.stringify(getGapWidth())}</code>
      </div>
      <div style={{ color: '#5c5750' }}>
        Toggle the lock and inspect the fixed bars at the top of the page.
      </div>
    </div>
  )
}

function FixedBars(): FictNode {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: 0,
          display: 'flex',
          padding: '0.75rem 1rem',
          background: '#1e8a5b',
          color: '#fff',
          'justify-content': 'space-between',
          'z-index': 2,
        }}
      >
        <span>fixed bar</span>
        <span>no compensation</span>
      </div>
      <div
        class={zeroRightClassName}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: '3rem',
          display: 'flex',
          padding: '0.75rem 1rem',
          background: '#0d5c63',
          color: '#fff',
          'justify-content': 'space-between',
          'z-index': 2,
        }}
      >
        <span>fixed bar</span>
        <span>with `zeroRightClassName`</span>
      </div>
    </>
  )
}

export default function App(): FictNode {
  const rows = fill(80, 'Scrollable row')

  return (
    <div
      style={{ 'font-family': 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#1d1d1d' }}
    >
      <FixedBars />
      <main style={{ padding: '7rem 1rem 2rem', display: 'grid', gap: '1rem' }}>
        <Locker label="Primary lock" />
        <Locker label="Nested lock" />

        <section
          class={fullWidthClassName}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '0.75rem 1rem',
            background: '#f4b860',
            color: '#1d1d1d',
            'z-index': 2,
          }}
        >
          full-width footer using `fullWidthClassName`
        </section>

        <section
          class={noScrollbarsClassName}
          style={{
            height: '10rem',
            overflow: 'auto',
            padding: '0.75rem',
            background: '#f2efe8',
            border: '1px solid #d6d6d6',
          }}
        >
          {rows.map((row) => (
            <p>{row}</p>
          ))}
        </section>

        <section style={{ display: 'grid', gap: '0.5rem' }}>
          {rows.map((row) => (
            <p>{row}</p>
          ))}
        </section>
      </main>
    </div>
  )
}
