import * as React from '../helpers/element.js'
import classNames from 'classnames'
import { NavigationMenu } from '@fictjs/radix-ui'
import { prop } from 'fict'

import { Slot } from './slot.js'
import { tabNavRootPropDefs } from './tab-nav.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { getSubtree } from '../helpers/get-subtree.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { tabNavLinkPropDefs } from './tab-nav.props.js'
import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

type MaybeAccessor<T> = T | (() => T)
type TabNavRootElement = React.ElementRef<typeof NavigationMenu.Root>
type TabNavRootElementProps = ComponentPropsWithout<'nav', RemovedProps>
type TabNavOwnProps = GetPropDefTypes<typeof tabNavRootPropDefs>
interface TabNavRootProps
  extends
    Omit<TabNavRootElementProps, 'defaultValue' | 'dir' | 'color'>,
    MarginProps,
    TabNavOwnProps {}
const TabNavRoot = React.forwardRef<TabNavRootElement, TabNavRootProps>((props, forwardedRef) => {
  const { children, className, color, ...rootProps } = extractProps(
    props,
    tabNavRootPropDefs,
    marginPropDefs,
  )
  return (
    <NavigationMenu.Root
      class="rt-TabNavRoot"
      data-accent-color={color}
      {...rootProps}
      ref={React.coerceRef(forwardedRef)}
    >
      <NavigationMenu.List
        class={classNames('rt-reset', 'rt-BaseTabList', 'rt-TabNavList', className)}
      >
        {children}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  )
})
TabNavRoot.displayName = 'TabNav.Root'

const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

function readValue<T>(value: MaybeAccessor<T>): T {
  if (
    typeof value === 'function' &&
    (value.length === 0 ||
      (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  ) {
    return (value as () => T)()
  }

  return value as T
}

type TabNavLinkElement = React.ElementRef<typeof NavigationMenu.Link>
type TabNavLinkOwnProps = GetPropDefTypes<typeof tabNavLinkPropDefs>
interface TabNavLinkProps
  extends ComponentPropsWithout<'a', RemovedProps | 'active'>,
    Omit<TabNavLinkOwnProps, 'active'> {
  active?: MaybeAccessor<boolean | undefined>
}
const TabNavLink = React.forwardRef<TabNavLinkElement, TabNavLinkProps>((props, forwardedRef) => {
  const { asChild, active = false, children, className, ...linkProps } = props
  const activeValue = () => Boolean(readValue(active) ?? false)
  const content = getSubtree({ asChild, children }, (innerChildren) => (
    <>
      <span class="rt-BaseTabListTriggerInner rt-TabNavLinkInner">{innerChildren}</span>
      <span class="rt-BaseTabListTriggerInnerHidden rt-TabNavLinkInnerHidden">{innerChildren}</span>
    </>
  ))

  return (
    <NavigationMenu.Item class="rt-TabNavItem">
      {asChild ? (
        <Slot
          {...linkProps}
          ref={React.coerceRef(forwardedRef)}
          data-active={prop(() => (activeValue() ? 'true' : 'false'))}
          class={classNames('rt-reset', 'rt-BaseTabListTrigger', 'rt-TabNavLink', className)}
        >
          {content}
        </Slot>
      ) : (
        <a
          {...linkProps}
          ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLAnchorElement>)}
          data-active={prop(() => (activeValue() ? 'true' : 'false'))}
          class={classNames('rt-reset', 'rt-BaseTabListTrigger', 'rt-TabNavLink', className)}
        >
          {content}
        </a>
      )}
    </NavigationMenu.Item>
  )
})
TabNavLink.displayName = 'TabNav.Link'

export { TabNavRoot as Root, TabNavLink as Link }
export type { TabNavRootProps as RootProps, TabNavLinkProps as LinkProps }
