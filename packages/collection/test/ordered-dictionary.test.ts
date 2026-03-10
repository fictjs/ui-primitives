import { describe, expect, it } from 'vitest'

import { OrderedDict } from '../src/ordered-dictionary.js'

describe('OrderedDict', () => {
  it('tracks size through set, delete, and clear', () => {
    const dict = new OrderedDict([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ])

    expect(dict.size).toBe(3)
    dict.delete('b')
    expect(dict.size).toBe(2)
    dict.set('d', 4)
    expect(dict.size).toBe(3)
    dict.clear()
    expect(dict.size).toBe(0)
  })

  it('inserts new keys at explicit indexes', () => {
    const dict = new OrderedDict([
      ['b', 2],
      ['c', 3],
      ['e', 5],
    ])

    dict.insert(0, 'a', 1)
    dict.insert(-1, 'd', 4)

    expect(dict.keyAt(0)).toBe('a')
    expect(dict.at(0)).toBe(1)
    expect(dict.keyAt(-1)).toBe('d')
    expect(dict.at(-1)).toBe(4)
  })

  it('moves existing keys when inserting at a different position', () => {
    const dict = new OrderedDict([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ])

    dict.insert(0, 'b', 4)

    expect(dict.get('b')).toBe(4)
    expect(dict.keyAt(0)).toBe('b')
    expect(dict.keyAt(1)).toBe('a')
  })

  it('returns copied dictionaries from with and toSorted', () => {
    const dict = new OrderedDict([
      ['a', 3],
      ['b', 1],
      ['c', 2],
    ])

    const moved = dict.with(0, 'c', 2)
    const sorted = dict.toSorted((a, b) => a[1] - b[1])

    expect(moved).not.toBe(dict)
    expect(sorted).not.toBe(dict)
    expect(moved.keyAt(0)).toBe('c')
    expect(sorted.keyAt(0)).toBe('b')
    expect(dict.keyAt(0)).toBe('a')
  })

  it('navigates relative positions with first, last, before, after, and from', () => {
    const dict = new OrderedDict([
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
    ])

    expect(dict.first()).toEqual(['a', 1])
    expect(dict.last()).toEqual(['d', 4])
    expect(dict.before('c')).toEqual(['b', 2])
    expect(dict.after('b')).toEqual(['c', 3])
    expect(dict.from('b', 2)).toBe(4)
    expect(dict.keyFrom('c', -2)).toBe('a')
  })

  it('supports deleting by key and by index', () => {
    const dict = new OrderedDict([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ])

    expect(dict.deleteAt(1)).toBe(true)
    expect(dict.keyAt(1)).toBe('c')
    expect(dict.delete('a')).toBe(true)
    expect(dict.first()).toEqual(['c', 3])
  })

  it('maps and filters while preserving key order', () => {
    const dict = new OrderedDict([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ])

    const mapped = dict.map(([, value]) => value * 10)
    const filtered = dict.filter(([, value]) => value >= 2)

    expect(mapped.entryAt(1)).toEqual(['b', 20])
    expect(filtered.entryAt(0)).toEqual(['b', 2])
    expect(filtered.entryAt(1)).toEqual(['c', 3])
  })

  it('reduces in both directions', () => {
    const dict = new OrderedDict([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ])

    const forward = dict.reduce((sum, [, value]) => sum + value, 0)
    const backward = dict.reduceRight((sum, [, value]) => sum + value, 0)

    expect(forward).toBe(6)
    expect(backward).toBe(6)
  })

  it('supports reverse and splice-style copies', () => {
    const dict = new OrderedDict([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ])

    const reversed = dict.toReversed()
    const spliced = dict.toSpliced(1, 1, ['d', 4])

    expect(reversed.entryAt(0)).toEqual(['c', 3])
    expect(spliced.entryAt(1)).toEqual(['d', 4])
    expect(dict.entryAt(1)).toEqual(['b', 2])
  })

  it('supports slice, every, and some helpers', () => {
    const dict = new OrderedDict([
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
    ])

    const slice = dict.slice(1, 3)

    expect(slice.entryAt(0)).toEqual(['b', 2])
    expect(slice.entryAt(1)).toEqual(['c', 3])
    expect(dict.every(([, value]) => value > 0)).toBe(true)
    expect(dict.some(([, value]) => value === 3)).toBe(true)
  })
})
