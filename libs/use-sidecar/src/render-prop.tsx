import type { FictNode } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { copyReactiveProps } from './reactive-props.js'
import type { SideCarMedium } from './types.js'

type CombinedProps<TArgs extends unknown[], TProps extends Record<string, unknown>> = TProps & {
  children: (...args: TArgs) => FictNode
}

type RenderPropComponent<TArgs extends unknown[], TProps extends Record<string, unknown>> = (
  props: CombinedProps<TArgs, TProps>,
) => FictNode

export function renderCar<TArgs extends unknown[], TProps extends Record<string, unknown>>(
  WrappedComponent: (
    props: TProps & {
      children: (...args: TArgs) => FictNode
      sideCar?: SideCarMedium<TProps> | undefined
    },
  ) => FictNode,
  defaults: (props: TProps) => TArgs,
): RenderPropComponent<TArgs, TProps> {
  return function Combiner(props: CombinedProps<TArgs, TProps>): FictNode {
    const currentState = createSignal<TArgs>(defaults(props))
    const wrappedProps = copyReactiveProps(props, new Set(['children']))

    const renderTarget = (...args: TArgs): FictNode => {
      currentState(args)
      return null
    }

    return (
      <>
        <WrappedComponent {...(wrappedProps as TProps)} children={renderTarget} />
        {reactive(() => props.children(...currentState()))}
      </>
    )
  }
}
