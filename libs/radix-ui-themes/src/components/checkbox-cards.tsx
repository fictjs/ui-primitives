import { createContext, useContext } from 'fict'

import * as React from '../helpers/element.js'
import classNames from 'classnames'

import * as CheckboxGroupPrimitive from './checkbox-group.primitive.js'
import { checkboxCardsRootPropDefs } from './checkbox-cards.props.js'
import { baseCheckboxPropDefs } from './_internal/base-checkbox.props.js'
import { Grid } from './grid.js'
import { ThickCheckIcon } from './icons.js'
import { extractProps } from '../helpers/extract-props.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { Responsive, GetPropDefTypes } from '../props/prop-def.js'

type CheckboxCardsContextValue = {
  highContrast?: boolean
  size?: Responsive<(typeof checkboxCardsRootPropDefs.size.values)[number]>
}

const CheckboxCardsContext = createContext<CheckboxCardsContextValue>({})

type CheckboxCardsRootElement = React.ElementRef<typeof CheckboxGroupPrimitive.Root>
type CheckboxCardsRootOwnProps = GetPropDefTypes<typeof checkboxCardsRootPropDefs>

interface CheckboxCardsRootProps
  extends ComponentPropsWithout<typeof CheckboxGroupPrimitive.Root, 'color' | 'defaultChecked'>,
    MarginProps,
    CheckboxCardsRootOwnProps {}

const CheckboxCardsRoot = React.forwardRef<CheckboxCardsRootElement, CheckboxCardsRootProps>(
  (props, forwardedRef) => {
    const { className, color, ...rootProps } = extractProps(
      props,
      checkboxCardsRootPropDefs,
      marginPropDefs,
    )

    return (
      <CheckboxCardsContext.Provider
        value={{
          highContrast: props.highContrast,
          size: props.size,
        }}
      >
        <Grid asChild>
          <CheckboxGroupPrimitive.Root
            data-accent-color={color}
            {...rootProps}
            ref={React.coerceRef(forwardedRef)}
            class={classNames('rt-CheckboxCardsRoot', className)}
          />
        </Grid>
      </CheckboxCardsContext.Provider>
    )
  },
)

type CheckboxCardsItemElement = React.ElementRef<typeof CheckboxGroupPrimitive.Item>

interface CheckboxCardsItemProps
  extends ComponentPropsWithout<typeof CheckboxGroupPrimitive.Item, RemovedProps>,
    MarginProps {}

const CheckboxCardsItem = React.forwardRef<CheckboxCardsItemElement, CheckboxCardsItemProps>(
  ({ children, className, style, ...props }, forwardedRef) => {
    const context = useContext(CheckboxCardsContext)
    const { className: checkboxClassName } = extractProps(
      { size: context.size, variant: 'surface', highContrast: context.highContrast },
      baseCheckboxPropDefs,
    )

    return (
      <label class={classNames('rt-BaseCard', 'rt-CheckboxCardsItem', className)} style={style}>
        {children}
        <CheckboxGroupPrimitive.Item
          {...props}
          ref={React.coerceRef(forwardedRef)}
          class={classNames(
            'rt-reset',
            'rt-BaseCheckboxRoot',
            'rt-CheckboxCardCheckbox',
            checkboxClassName,
          )}
        >
          <CheckboxGroupPrimitive.Indicator class="rt-BaseCheckboxIndicator">
            <ThickCheckIcon />
          </CheckboxGroupPrimitive.Indicator>
        </CheckboxGroupPrimitive.Item>
      </label>
    )
  },
)

CheckboxCardsRoot.displayName = 'CheckboxCards.Root'
CheckboxCardsItem.displayName = 'CheckboxCards.Item'

export { CheckboxCardsRoot as Root, CheckboxCardsItem as Item }
export type { CheckboxCardsRootProps as RootProps, CheckboxCardsItemProps as ItemProps }
