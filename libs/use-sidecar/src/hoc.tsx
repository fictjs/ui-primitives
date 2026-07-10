import type { FictNode } from '@fictjs/runtime'
import { reactive } from '@fictjs/runtime/advanced'

import { useSidecar } from './hook.js'
import { copyReactiveProps } from './reactive-props.js'
import type { Importer, SideCarMedium } from './types.js'

export function sidecar<TProps extends Record<string, unknown>>(
  importer: Importer<TProps>,
  errorComponent?: FictNode,
): (
  props: Omit<TProps, 'sideCar'> & { sideCar?: SideCarMedium<TProps> | undefined },
) => FictNode {
  return function Sidecar(props) {
    const [Car, error] = useSidecar(importer, props.sideCar)

    return (
      <>
        {reactive(() => {
          if (error() && errorComponent) {
            return errorComponent
          }

          const LoadedCar = Car()
          return LoadedCar ? <LoadedCar {...copyReactiveProps(props as TProps)} /> : null
        })}
      </>
    )
  }
}
