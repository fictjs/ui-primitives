import { createContext, useContext } from 'fict'
import * as React from '../helpers/element.js'
import classNames from 'classnames'
import { Select as SelectPrimitive } from '@fictjs/radix-ui'

import { extractProps } from '../helpers/extract-props.js'
import { marginPropDefs } from '../props/margin.props.js'
import { ChevronDownIcon, ThickCheckIcon } from './icons.js'
import { selectRootPropDefs, selectTriggerPropDefs, selectContentPropDefs } from './select.props.js'
import { ThemeContext, useThemeContext } from './theme.js'

import type { MarginProps } from '../props/margin.props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { ReactNode } from '../helpers/element.js'

type SelectRootOwnProps = GetPropDefTypes<typeof selectRootPropDefs>
type SelectContextValue = SelectRootOwnProps

const SelectContext = createContext<SelectContextValue>({})

interface SelectRootProps extends SelectPrimitive.SelectProps, SelectContextValue {
  children?: ReactNode
}

const SelectRoot: React.FC<SelectRootProps> = (props) => {
  const { children, size = selectRootPropDefs.size.default, ...rootProps } = props
  return (
    <SelectPrimitive.Root {...rootProps}>
      <SelectContext.Provider value={{ size }}>{children}</SelectContext.Provider>
    </SelectPrimitive.Root>
  )
}

SelectRoot.displayName = 'Select.Root'

type SelectTriggerElement = React.ElementRef<typeof SelectPrimitive.Trigger>
type SelectTriggerOwnProps = GetPropDefTypes<typeof selectTriggerPropDefs>

interface SelectTriggerProps
  extends
    ComponentPropsWithout<typeof SelectPrimitive.Trigger, RemovedProps>,
    MarginProps,
    SelectTriggerOwnProps {}

const SelectTrigger = React.forwardRef<SelectTriggerElement, SelectTriggerProps>(
  (props, forwardedRef) => {
    const context = useContext(SelectContext)
    const { className, color, radius, placeholder, ...triggerProps } = extractProps(
      { size: context?.size, ...props },
      { size: selectRootPropDefs.size },
      selectTriggerPropDefs,
      marginPropDefs,
    )
    const placeholderText = typeof placeholder === 'string' ? placeholder : undefined

    return (
      <SelectPrimitive.Trigger asChild>
        <button
          data-accent-color={color}
          data-radius={radius}
          {...triggerProps}
          ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLButtonElement>)}
          class={classNames('rt-reset', 'rt-SelectTrigger', className)}
        >
          <span class="rt-SelectTriggerInner">
            <SelectPrimitive.Value placeholder={placeholderText} />
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDownIcon class="rt-SelectIcon" />
          </SelectPrimitive.Icon>
        </button>
      </SelectPrimitive.Trigger>
    )
  },
)

SelectTrigger.displayName = 'Select.Trigger'

type SelectContentElement = React.ElementRef<typeof SelectPrimitive.Content>
type SelectContentOwnProps = GetPropDefTypes<typeof selectContentPropDefs>

interface SelectContentProps
  extends
    ComponentPropsWithout<typeof SelectPrimitive.Content, RemovedProps>,
    SelectContentOwnProps {
  container?: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Portal>['container']
}

const SelectContent = React.forwardRef<SelectContentElement, SelectContentProps>(
  (props, forwardedRef) => {
    const context = useContext(SelectContext)
    const { className, color, container, ...contentProps } = extractProps(
      { size: context?.size, ...props },
      { size: selectRootPropDefs.size },
      selectContentPropDefs,
    )
    const themeContext = useThemeContext()
    const resolvedColor = color || themeContext.accentColor

    return (
      <SelectPrimitive.Portal container={container}>
        <SelectPrimitive.Content
          data-is-root-theme="false"
          data-accent-color={resolvedColor}
          data-gray-color={themeContext.resolvedGrayColor}
          data-has-background="false"
          data-panel-background={themeContext.panelBackground}
          data-radius={themeContext.radius}
          data-scaling={themeContext.scaling}
          asChild={false}
          {...contentProps}
          ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLDivElement>)}
          class={classNames(
            'radix-themes',
            {
              light: themeContext.appearance === 'light',
              dark: themeContext.appearance === 'dark',
            },
            'rt-SelectContent',
            'rt-PopperContent',
            className,
          )}
        >
          <ThemeContext.Provider value={themeContext}>{props.children}</ThemeContext.Provider>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    )
  },
)

SelectContent.displayName = 'Select.Content'

type SelectItemElement = React.ElementRef<typeof SelectPrimitive.Item>
interface SelectItemProps extends ComponentPropsWithout<
  typeof SelectPrimitive.Item,
  RemovedProps
> {}

const SelectItem = React.forwardRef<SelectItemElement, SelectItemProps>((props, forwardedRef) => {
  const { className, children, ...itemProps } = props
  return (
    <SelectPrimitive.Item
      {...itemProps}
      ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLDivElement>)}
      class={classNames('rt-SelectItem', className)}
    >
      <SelectPrimitive.ItemIndicator class="rt-SelectItemIndicator">
        <ThickCheckIcon class="rt-SelectItemIndicatorIcon" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})

SelectItem.displayName = 'Select.Item'

type SelectGroupElement = React.ElementRef<typeof SelectPrimitive.Group>
interface SelectGroupProps extends ComponentPropsWithout<
  typeof SelectPrimitive.Group,
  RemovedProps
> {}

const SelectGroup = React.forwardRef<SelectGroupElement, SelectGroupProps>(
  ({ className, ...props }, forwardedRef) => (
    <SelectPrimitive.Group
      {...props}
      ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLDivElement>)}
      class={classNames('rt-SelectGroup', className)}
    />
  ),
)

SelectGroup.displayName = 'Select.Group'

type SelectLabelElement = React.ElementRef<typeof SelectPrimitive.Label>
interface SelectLabelProps extends ComponentPropsWithout<
  typeof SelectPrimitive.Label,
  RemovedProps
> {}

const SelectLabel = React.forwardRef<SelectLabelElement, SelectLabelProps>(
  ({ className, ...props }, forwardedRef) => (
    <SelectPrimitive.Label
      {...props}
      ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLDivElement>)}
      class={classNames('rt-SelectLabel', className)}
    />
  ),
)

SelectLabel.displayName = 'Select.Label'

type SelectSeparatorElement = React.ElementRef<typeof SelectPrimitive.Separator>
interface SelectSeparatorProps extends ComponentPropsWithout<
  typeof SelectPrimitive.Separator,
  RemovedProps
> {}

const SelectSeparator = React.forwardRef<SelectSeparatorElement, SelectSeparatorProps>(
  ({ className, ...props }, forwardedRef) => (
    <SelectPrimitive.Separator
      {...props}
      ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLDivElement>)}
      class={classNames('rt-SelectSeparator', className)}
    />
  ),
)

SelectSeparator.displayName = 'Select.Separator'

export {
  SelectRoot as Root,
  SelectTrigger as Trigger,
  SelectContent as Content,
  SelectItem as Item,
  SelectGroup as Group,
  SelectLabel as Label,
  SelectSeparator as Separator,
}

export type {
  SelectRootProps as RootProps,
  SelectTriggerProps as TriggerProps,
  SelectContentProps as ContentProps,
  SelectItemProps as ItemProps,
  SelectGroupProps as GroupProps,
  SelectLabelProps as LabelProps,
  SelectSeparatorProps as SeparatorProps,
}
