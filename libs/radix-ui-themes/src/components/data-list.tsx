import { classNames } from '../helpers/reactive-class-names.js'
import { mergeProps, prop } from 'fict'
import * as React from '../helpers/element.js'

import { Text } from './text.js'
import {
  dataListRootPropDefs,
  dataListItemPropDefs,
  dataListLabelPropDefs,
} from './data-list.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type DataListRootElement = HTMLDListElement
type DataListRootOwnProps = GetPropDefTypes<typeof dataListRootPropDefs>
interface DataListRootProps
  extends ComponentPropsWithout<'dl', RemovedProps>, MarginProps, DataListRootOwnProps {}
const DataListRoot = React.forwardRef<DataListRootElement, DataListRootProps>(
  (props, forwardedRef) => {
    const { className, ...dataListProps } = extractProps(
      props,
      dataListRootPropDefs,
      marginPropDefs,
    )
    return (
      <Text asChild>
        <dl
          {...dataListProps}
          ref={React.coerceRef(forwardedRef)}
          class={classNames('rt-DataListRoot', className)}
        />
      </Text>
    )
  },
)
DataListRoot.displayName = 'DataList.Root'

type DataListItemElement = HTMLDivElement
type DataListItemOwnProps = GetPropDefTypes<typeof dataListItemPropDefs>
interface DataListItemProps
  extends ComponentPropsWithout<'div', RemovedProps>, DataListItemOwnProps {}
const DataListItem = React.forwardRef<DataListItemElement, DataListItemProps>(
  (props, forwardedRef) => {
    const { className, ...itemProps } = extractProps(props, dataListItemPropDefs)
    return (
      <div
        {...itemProps}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-DataListItem', className)}
      />
    )
  },
)
DataListItem.displayName = 'DataList.Item'

type DataListLabelElement = React.ElementRef<'dt'>
type DataListLabelOwnProps = GetPropDefTypes<typeof dataListLabelPropDefs>
interface DataListLabelProps
  extends ComponentPropsWithout<'dt', RemovedProps>, DataListLabelOwnProps {}
const DataListLabel = React.forwardRef<DataListLabelElement, DataListLabelProps>(
  (props, forwardedRef) => {
    const { className, color, ...labelProps } = extractProps(props, dataListLabelPropDefs)
    return (
      <dt
        {...labelProps}
        data-accent-color={color}
        ref={React.coerceRef(forwardedRef)}
        class={classNames('rt-DataListLabel', className)}
      />
    )
  },
)
DataListLabel.displayName = 'DataList.Label'

type DataListValueElement = React.ElementRef<'dd'>
interface DataListValueProps extends ComponentPropsWithout<'dd', RemovedProps> {}
const DataListValue = React.forwardRef<DataListValueElement, DataListValueProps>(
  (props, forwardedRef) => (
    <dd
      {...mergeProps(
        prop(() => props as Record<string, unknown>),
        {
          children: undefined,
          className: undefined,
        },
      )}
      ref={React.coerceRef(forwardedRef)}
      class={prop(() => classNames(props.className, 'rt-DataListValue')) as unknown as string}
    >
      {props.children}
    </dd>
  ),
)
DataListValue.displayName = 'DataList.Value'

export {
  DataListRoot as Root,
  DataListItem as Item,
  DataListLabel as Label,
  DataListValue as Value,
}
export type {
  DataListRootProps as RootProps,
  DataListItemProps as ItemProps,
  DataListLabelProps as LabelProps,
  DataListValueProps as ValueProps,
}
