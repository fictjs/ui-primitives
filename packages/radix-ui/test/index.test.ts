import { describe, expect, it } from 'vitest'

import * as RadixUI from '../src/index.js'
import * as Internal from '../src/internal.js'

describe('@fictjs/radix-ui', () => {
  it('exports public primitive namespaces', () => {
    expect(typeof RadixUI.Dialog.Root).toBe('function')
    expect(typeof RadixUI.Tooltip.Provider).toBe('function')
    expect(typeof RadixUI.Toolbar.Root).toBe('function')
    expect(typeof RadixUI.unstable_OneTimePasswordField.Root).toBe('function')
    expect(typeof RadixUI.unstable_PasswordToggleField.Root).toBe('function')
  })

  it('exports internal helpers and primitive shims', () => {
    expect(typeof Internal.composeRefs).toBe('function')
    expect(typeof Internal.useControllableState).toBe('function')
    expect(typeof Internal.useControllableStateReducer).toBe('function')
    expect(typeof Internal.composeEventHandlers).toBe('function')
    expect(typeof Internal.Primitive.button).toBe('function')
    expect(Internal.Primitive.Root).toBe(Internal.Primitive)
    expect(typeof Internal.Primitive.dispatchDiscreteCustomEvent).toBe('function')
  })
})
