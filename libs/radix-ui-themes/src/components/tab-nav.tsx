import * as React from '../helpers/element.js'
import { classNames } from '../helpers/reactive-class-names.js'
import { NavigationMenu, Slot as SlotPrimitive } from '@fictjs/radix-ui'
import { prop } from 'fict'

import { tabNavLinkPropDefs, tabNavRootPropDefs } from './tab-nav.props.js'
import { extractProps, readPropValue } from '../helpers/extract-props.js'
import { getSubtree } from '../helpers/get-subtree.js'
import { renderWithAsChild } from '../helpers/render-with-as-child.js'
import { marginPropDefs } from '../props/margin.props.js'

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
const REACTIVE_FN_MARKER = Symbol.for('fict:reactive-fn')

function readValue<T>(value: MaybeAccessor<T>): T {
  let currentValue: unknown = value

  for (let depth = 0; depth < 10 && typeof currentValue === 'function'; depth += 1) {
    const taggedValue = currentValue as unknown as Record<symbol, unknown>
    if (
      currentValue.length !== 0 &&
      taggedValue[SIGNAL_MARKER] !== true &&
      taggedValue[COMPUTED_MARKER] !== true &&
      taggedValue[PROP_GETTER_MARKER] !== true &&
      taggedValue[REACTIVE_FN_MARKER] !== true
    ) {
      break
    }

    currentValue = (currentValue as () => unknown)()
  }

  return currentValue as T
}

type TabNavLinkElement = React.ElementRef<typeof NavigationMenu.Link>
type TabNavLinkOwnProps = GetPropDefTypes<typeof tabNavLinkPropDefs>
interface TabNavLinkProps
  extends ComponentPropsWithout<'a', RemovedProps | 'active'>, Omit<TabNavLinkOwnProps, 'active'> {
  active?: MaybeAccessor<boolean | undefined>
}
const TabNavLink = React.forwardRef<TabNavLinkElement, TabNavLinkProps>((props, forwardedRef) => {
  const {
    asChild: _asChild,
    active,
    children,
    className,
    ...linkProps
  } = extractProps(props, tabNavLinkPropDefs)
  const activeValue = () => Boolean(readValue(active) ?? false)
  return renderWithAsChild(props, (asChild) => {
    const content = getSubtree(
      { asChild, children: asChild ? readPropValue(children) : children },
      (innerChildren) => (
        <>
          <span class="rt-BaseTabListTriggerInner rt-TabNavLinkInner">{innerChildren}</span>
          <span class="rt-BaseTabListTriggerInnerHidden rt-TabNavLinkInnerHidden">
            {innerChildren}
          </span>
        </>
      ),
    )

    return (
      <NavigationMenu.Item class="rt-TabNavItem">
        {asChild ? (
          <SlotPrimitive.Root
            {...linkProps}
            ref={React.coerceRef(forwardedRef)}
            data-active={prop(() => (activeValue() ? '' : undefined)) as unknown as string}
            class={classNames('rt-reset', 'rt-BaseTabListTrigger', 'rt-TabNavLink', className)}
          >
            {content}
          </SlotPrimitive.Root>
        ) : (
          <a
            {...linkProps}
            ref={React.coerceRef(forwardedRef as React.PossibleRef<HTMLAnchorElement>)}
            data-active={prop(() => (activeValue() ? '' : undefined))}
            class={classNames('rt-reset', 'rt-BaseTabListTrigger', 'rt-TabNavLink', className)}
          >
            {content}
          </a>
        )}
      </NavigationMenu.Item>
    )
  })
})
TabNavLink.displayName = 'TabNav.Link'

export { TabNavRoot as Root, TabNavLink as Link }
export type { TabNavRootProps as RootProps, TabNavLinkProps as LinkProps }
