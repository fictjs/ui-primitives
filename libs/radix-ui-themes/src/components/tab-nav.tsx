import * as React from '../helpers/element.js'
import classNames from 'classnames'
import { NavigationMenu } from '@fictjs/radix-ui'

import { Slot } from './slot.js'
import { tabNavRootPropDefs } from './tab-nav.props.js'
import { extractProps } from '../helpers/extract-props.js'
import { getSubtree } from '../helpers/get-subtree.js'
import { marginPropDefs } from '../props/margin.props.js'

import type { tabNavLinkPropDefs } from './tab-nav.props.js'
import type { MarginProps } from '../props/margin.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'
import type { GetPropDefTypes } from '../props/prop-def.js'

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

type TabNavLinkElement = React.ElementRef<typeof NavigationMenu.Link>
type TabNavLinkOwnProps = GetPropDefTypes<typeof tabNavLinkPropDefs>
interface TabNavLinkProps
  extends ComponentPropsWithout<'a', RemovedProps | 'active'>, TabNavLinkOwnProps {}
const TabNavLink = React.forwardRef<TabNavLinkElement, TabNavLinkProps>((props, forwardedRef) => {
  const { asChild, active = false, children, className, ...linkProps } = props
  const content = getSubtree({ asChild, children }, (innerChildren) => (
    <>
      <span class="rt-BaseTabListTriggerInner rt-TabNavLinkInner">{innerChildren}</span>
      <span class="rt-BaseTabListTriggerInnerHidden rt-TabNavLinkInnerHidden">{innerChildren}</span>
    </>
  ))

  return (
    <NavigationMenu.Item class="rt-TabNavItem">
      <NavigationMenu.Link asChild>
        {asChild ? (
          <Slot
            {...linkProps}
            ref={React.coerceRef(forwardedRef)}
            data-active={active ? 'true' : 'false'}
            class={classNames('rt-reset', 'rt-BaseTabListTrigger', 'rt-TabNavLink', className)}
          >
            {content}
          </Slot>
        ) : (
          <a
            {...linkProps}
            ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLAnchorElement>)}
            data-active={active ? 'true' : 'false'}
            class={classNames('rt-reset', 'rt-BaseTabListTrigger', 'rt-TabNavLink', className)}
          >
            {content}
          </a>
        )}
      </NavigationMenu.Link>
    </NavigationMenu.Item>
  )
})
TabNavLink.displayName = 'TabNav.Link'

export { TabNavRoot as Root, TabNavLink as Link }
export type { TabNavRootProps as RootProps, TabNavLinkProps as LinkProps }
