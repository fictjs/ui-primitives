import { createElement } from 'fict'
import { createConditional } from 'fict/internal'
import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'

import { Flex } from './flex.js'
import { spinnerPropDefs } from './spinner.props.js'
import { extractProps, readPropValue } from '../helpers/extract-props.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type SpinnerElement = React.ElementRef<'span'>
type SpinnerOwnProps = GetPropDefTypes<typeof spinnerPropDefs>
interface SpinnerProps
  extends ComponentPropsWithout<'span', RemovedProps>, MarginProps, SpinnerOwnProps {}
const Spinner = React.forwardRef<SpinnerElement, SpinnerProps>((props, forwardedRef) => {
  const { className, children, loading, ...spinnerProps } = extractProps(
    props,
    spinnerPropDefs,
    marginPropDefs,
  )

  return createConditional(
    () => Boolean(readPropValue(loading)),
    () => {
      const currentChildren = readPropValue(children)

      const spinner = (
        <span
          {...spinnerProps}
          ref={React.coerceRef(forwardedRef)}
          class={classNames('rt-Spinner', className)}
        >
          <span class="rt-SpinnerLeaf" />
          <span class="rt-SpinnerLeaf" />
          <span class="rt-SpinnerLeaf" />
          <span class="rt-SpinnerLeaf" />
          <span class="rt-SpinnerLeaf" />
          <span class="rt-SpinnerLeaf" />
          <span class="rt-SpinnerLeaf" />
          <span class="rt-SpinnerLeaf" />
        </span>
      )

      if (currentChildren === undefined) return spinner

      return (
        <Flex asChild position="relative" align="center" justify="center">
          <span>
            {/**
             * `display: contents` removes the content from the accessibility tree in some
             * browsers, so we force remove it with `aria-hidden`.
             */}
            <span
              aria-hidden
              style={{ display: 'contents', visibility: 'hidden' }}
              inert={undefined}
            >
              {currentChildren}
            </span>

            <Flex asChild align="center" justify="center" position="absolute" inset="0">
              <span>{spinner}</span>
            </Flex>
          </span>
        </Flex>
      )
    },
    createElement,
    () => readPropValue(children),
    undefined,
    undefined,
    { trackBranchReads: true },
  ) as unknown as React.ReactNode
})
Spinner.displayName = 'Spinner'

export { Spinner }
export type { SpinnerProps }
