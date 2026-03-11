import * as React from './element.js'
import type { JSX } from 'fict'

// "inert" works differently between React versions
// https://github.com/facebook/react/pull/24730
export const inert = (Number.parseFloat(React.version) >= 19 ||
  '') as JSX.IntrinsicElements['div']['inert']
