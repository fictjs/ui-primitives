import type { FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import type { SideCarMedium } from './types.js'

type CombinedProps<TArgs extends unknown[], TProps extends Record<string, unknown>> = TProps & {
  children: (...args: TArgs) => FictNode
}

type RenderPropComponent<TArgs extends unknown[], TProps extends Record<string, unknown>> = (
  props: CombinedProps<TArgs, TProps>,
) => FictNode

export function renderCar<
  TArgs extends unknown[],
  TProps extends Record<string, unknown>,
>(
  WrappedComponent: (
    props: TProps & {
      children: (...args: TArgs) => FictNode
      sideCar?: SideCarMedium<any> | undefined
    },
  ) => FictNode,
  defaults: (props: TProps) => TArgs,
): RenderPropComponent<TArgs, TProps> {
  return function Combiner(props: CombinedProps<TArgs, TProps>): FictNode {
    const currentState = createSignal<TArgs>(defaults(props))

    const renderTarget = (...args: TArgs): FictNode => {
      currentState(args)
      return null
    }

    return (
      <>
        <WrappedComponent {...(props as TProps)} children={renderTarget} />
        {() => props.children(...currentState())}
      </>
    )
  }
}
