import type { FictNode } from '@fictjs/runtime'

import type { SideCarComponent, SideCarMedium } from './types.js'

function SideCar(props: Record<string, unknown> & { sideCar?: SideCarMedium<any> }): FictNode {
  const { sideCar, ...rest } = props

  if (!sideCar) {
    throw new Error('Sidecar: please provide `sideCar` property to import the right car')
  }

  const Target = sideCar.read()

  if (!Target) {
    throw new Error('Sidecar medium not found')
  }

  return <Target {...rest} />
}

;(SideCar as typeof SideCar & { isSideCarExport?: boolean }).isSideCarExport = true

export function exportSidecar<TProps extends Record<string, unknown>>(
  medium: SideCarMedium<TProps>,
  exported: (props: TProps) => FictNode,
): SideCarComponent<TProps> {
  medium.useMedium(exported)
  return SideCar as unknown as SideCarComponent<TProps>
}
