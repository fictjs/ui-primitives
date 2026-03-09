/** @jsxImportSource fict */

import { mergeProps } from 'fict'

import { RemoveScroll as RemoveScrollUI } from './UI.js'
import SideCar from './sidecar.js'
import type { IRemoveScrollProps, IRemoveScrollUIProps, RemoveScrollType } from './types.js'

const FictRemoveScroll = ((props: IRemoveScrollProps) => (
  <RemoveScrollUI
    {...(mergeProps(props as Record<string, unknown>, {
      sideCar: SideCar,
    } as Record<string, unknown>) as IRemoveScrollUIProps)}
  />
)) as RemoveScrollType

FictRemoveScroll.classNames = RemoveScrollUI.classNames

export default FictRemoveScroll
