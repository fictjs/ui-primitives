import { describe, expect, it } from 'vitest'

import * as primitives from '../src/index'

describe('ui-primitives setup', () => {
  it('exports a module namespace', () => {
    expect(primitives).toBeTypeOf('object')
  })
})
