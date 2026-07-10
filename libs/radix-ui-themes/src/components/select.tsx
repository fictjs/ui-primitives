import { createContext, mergeProps, prop, useContext } from 'fict'
import * as React from '../helpers/element.js'
import classNames from 'classnames'
import { Select as SelectPrimitive, ScrollArea as ScrollAreaPrimitive } from '@fictjs/radix-ui'

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
  const context: SelectContextValue = {
    get size() {
      return props.size ?? selectRootPropDefs.size.default
    },
  }

  return (
    <SelectPrimitive.Root
      {...mergeProps(
        prop(() => props as Record<string, unknown>),
        { children: undefined, size: undefined },
      )}
    >
      <SelectContext.Provider value={context}>{props.children}</SelectContext.Provider>
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
      mergeProps(
        { size: context?.size },
        prop(() => props as Record<string, unknown>),
      ) as unknown as SelectTriggerProps,
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
      mergeProps(
        { size: context?.size },
        prop(() => props as Record<string, unknown>),
      ) as unknown as SelectContentProps,
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
          sideOffset={4}
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
          <ThemeContext.Provider value={themeContext}>
            <ScrollAreaPrimitive.Root type="auto" class="rt-ScrollAreaRoot">
              <SelectPrimitive.Viewport asChild class="rt-SelectViewport">
                <ScrollAreaPrimitive.Viewport class="rt-ScrollAreaViewport">
                  {props.children}
                </ScrollAreaPrimitive.Viewport>
              </SelectPrimitive.Viewport>
              <ScrollAreaPrimitive.Scrollbar
                class="rt-ScrollAreaScrollbar rt-r-size-1"
                orientation="vertical"
              >
                <ScrollAreaPrimitive.Thumb class="rt-ScrollAreaThumb" />
              </ScrollAreaPrimitive.Scrollbar>
            </ScrollAreaPrimitive.Root>
          </ThemeContext.Provider>
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
  const itemProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    { children: undefined, className: undefined },
  ) as unknown as SelectItemProps
  return (
    <SelectPrimitive.Item
      {...itemProps}
      ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLDivElement>)}
      class={prop(() => classNames('rt-SelectItem', props.className)) as unknown as string}
    >
      <SelectPrimitive.ItemIndicator class="rt-SelectItemIndicator">
        <ThickCheckIcon class="rt-SelectItemIndicatorIcon" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{props.children}</SelectPrimitive.ItemText>
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
  (props, forwardedRef) => (
    <SelectPrimitive.Group
      {...mergeProps(
        prop(() => props as Record<string, unknown>),
        { className: undefined },
      )}
      ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLDivElement>)}
      class={prop(() => classNames('rt-SelectGroup', props.className)) as unknown as string}
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
  (props, forwardedRef) => (
    <SelectPrimitive.Label
      {...mergeProps(
        prop(() => props as Record<string, unknown>),
        { className: undefined },
      )}
      ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLDivElement>)}
      class={prop(() => classNames('rt-SelectLabel', props.className)) as unknown as string}
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
  (props, forwardedRef) => (
    <SelectPrimitive.Separator
      {...mergeProps(
        prop(() => props as Record<string, unknown>),
        { className: undefined },
      )}
      ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLDivElement>)}
      class={prop(() => classNames('rt-SelectSeparator', props.className)) as unknown as string}
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
