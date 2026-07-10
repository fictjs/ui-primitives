import { createContext, createEffect, mergeProps, prop, useContext } from 'fict'
import { createSignal } from 'fict/advanced'
import * as React from '../helpers/element.js'
import classNames from 'classnames'
import { Direction, Slot, Tooltip as TooltipPrimitive } from '@fictjs/radix-ui'

import { getMatchingGrayColor } from '../helpers/get-matching-gray-color.js'
import { themePropDefs } from './theme.props.js'

import type { ThemeOwnProps } from './theme.props.js'
import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'

const noop = () => {}

type ThemeAppearance = (typeof themePropDefs.appearance.values)[number]
type ThemeAccentColor = (typeof themePropDefs.accentColor.values)[number]
type ThemeGrayColor = (typeof themePropDefs.grayColor.values)[number]
type ThemePanelBackground = (typeof themePropDefs.panelBackground.values)[number]
type ThemeRadius = (typeof themePropDefs.radius.values)[number]
type ThemeScaling = (typeof themePropDefs.scaling.values)[number]

interface ThemeChangeHandlers {
  onAppearanceChange: (appearance: ThemeAppearance) => void
  onAccentColorChange: (accentColor: ThemeAccentColor) => void
  onGrayColorChange: (grayColor: ThemeGrayColor) => void
  onPanelBackgroundChange: (panelBackground: ThemePanelBackground) => void
  onRadiusChange: (radius: ThemeRadius) => void
  onScalingChange: (scaling: ThemeScaling) => void
}

interface ThemeContextValue extends ThemeChangeHandlers {
  readonly appearance: ThemeAppearance
  readonly accentColor: ThemeAccentColor
  readonly grayColor: ThemeGrayColor
  readonly resolvedGrayColor: ThemeGrayColor
  readonly panelBackground: ThemePanelBackground
  readonly radius: ThemeRadius
  readonly scaling: ThemeScaling
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function useThemeContext() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('`useThemeContext` must be used within a `Theme`')
  }
  return context
}

interface ThemeProps extends ThemeImplPublicProps {}

const Theme = React.forwardRef<ThemeImplElement, ThemeProps>((props, forwardedRef) => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    return (
      <TooltipPrimitive.Provider delayDuration={200}>
        <Direction.DirectionProvider dir="ltr">
          <ThemeRoot
            {...mergeProps(prop(() => props as Record<string, unknown>))}
            ref={React.coerceRef(forwardedRef)}
          />
        </Direction.DirectionProvider>
      </TooltipPrimitive.Provider>
    )
  }

  return (
    <ThemeImpl
      {...mergeProps(prop(() => props as Record<string, unknown>))}
      ref={React.coerceRef(forwardedRef)}
    />
  )
})

Theme.displayName = 'Theme'

const ThemeRoot = React.forwardRef<ThemeImplElement, ThemeImplPublicProps>(
  (props, forwardedRef) => {
    const appearance = createSignal(props.appearance ?? themePropDefs.appearance.default)
    const accentColor = createSignal(props.accentColor ?? themePropDefs.accentColor.default)
    const grayColor = createSignal(props.grayColor ?? themePropDefs.grayColor.default)
    const panelBackground = createSignal(
      props.panelBackground ?? themePropDefs.panelBackground.default,
    )
    const radius = createSignal(props.radius ?? themePropDefs.radius.default)
    const scaling = createSignal(props.scaling ?? themePropDefs.scaling.default)

    createEffect(() => {
      appearance(props.appearance ?? themePropDefs.appearance.default)
      accentColor(props.accentColor ?? themePropDefs.accentColor.default)
      grayColor(props.grayColor ?? themePropDefs.grayColor.default)
      panelBackground(props.panelBackground ?? themePropDefs.panelBackground.default)
      radius(props.radius ?? themePropDefs.radius.default)
      scaling(props.scaling ?? themePropDefs.scaling.default)
    })

    return (
      <ThemeImpl
        {...mergeProps(
          prop(() => props as Record<string, unknown>),
          {
            isRoot: true,
            hasBackground: prop(() => props.hasBackground ?? themePropDefs.hasBackground.default),
            appearance: prop(appearance),
            accentColor: prop(accentColor),
            grayColor: prop(grayColor),
            panelBackground: prop(panelBackground),
            radius: prop(radius),
            scaling: prop(scaling),
            onAppearanceChange: appearance,
            onAccentColorChange: accentColor,
            onGrayColorChange: grayColor,
            onPanelBackgroundChange: panelBackground,
            onRadiusChange: radius,
            onScalingChange: scaling,
          },
        )}
        ref={React.coerceRef(forwardedRef)}
      />
    )
  },
)

ThemeRoot.displayName = 'ThemeRoot'

type ThemeImplElement = Element

interface ThemeImplProps extends ThemeImplPublicProps, ThemeImplPrivateProps {}

interface ThemeImplPublicProps
  extends ComponentPropsWithout<'div', RemovedProps | 'dir'>, ThemeOwnProps {}

interface ThemeImplPrivateProps extends Partial<ThemeChangeHandlers> {
  isRoot?: boolean
}

const ThemeImpl = React.forwardRef<ThemeImplElement, ThemeImplProps>((props, forwardedRef) => {
  const context = useContext(ThemeContext)

  const appearance = () =>
    props.appearance ?? context?.appearance ?? themePropDefs.appearance.default
  const accentColor = () =>
    props.accentColor ?? context?.accentColor ?? themePropDefs.accentColor.default
  const grayColor = () =>
    props.grayColor ?? context?.resolvedGrayColor ?? themePropDefs.grayColor.default
  const panelBackground = () =>
    props.panelBackground ?? context?.panelBackground ?? themePropDefs.panelBackground.default
  const radius = () => props.radius ?? context?.radius ?? themePropDefs.radius.default
  const scaling = () => props.scaling ?? context?.scaling ?? themePropDefs.scaling.default
  const resolvedGrayColor = () => {
    const value = grayColor()
    return value === 'auto' ? getMatchingGrayColor(accentColor()) : value
  }
  const isExplicitAppearance = () => props.appearance === 'light' || props.appearance === 'dark'
  const hasBackground = () =>
    props.hasBackground === undefined
      ? Boolean(props.isRoot || isExplicitAppearance())
      : props.hasBackground

  const themeContextValue: ThemeContextValue = {
    get appearance() {
      return appearance()
    },
    get accentColor() {
      return accentColor()
    },
    get grayColor() {
      return grayColor()
    },
    get resolvedGrayColor() {
      return resolvedGrayColor()
    },
    get panelBackground() {
      return panelBackground()
    },
    get radius() {
      return radius()
    },
    get scaling() {
      return scaling()
    },
    onAppearanceChange: (value) => (props.onAppearanceChange ?? noop)(value),
    onAccentColorChange: (value) => (props.onAccentColorChange ?? noop)(value),
    onGrayColorChange: (value) => (props.onGrayColorChange ?? noop)(value),
    onPanelBackgroundChange: (value) => (props.onPanelBackgroundChange ?? noop)(value),
    onRadiusChange: (value) => (props.onRadiusChange ?? noop)(value),
    onScalingChange: (value) => (props.onScalingChange ?? noop)(value),
  }

  const asChild = props.asChild
  const isRoot = props.isRoot
  const themeProps = copyReactiveProps(
    props as unknown as Record<string, unknown>,
    THEME_INTERNAL_PROPS,
  )
  const forwardedElementRef =
    forwardedRef == null
      ? undefined
      : (node: Element | null) => {
          if (typeof forwardedRef === 'function') {
            forwardedRef(node)
            return
          }

          forwardedRef.current = node
        }
  const forwardedDivRef =
    forwardedRef == null
      ? undefined
      : (node: HTMLDivElement | null) => {
          if (typeof forwardedRef === 'function') {
            forwardedRef(node)
            return
          }

          forwardedRef.current = node
        }
  const sharedProps = {
    'data-is-root-theme': isRoot ? 'true' : 'false',
    'data-accent-color': prop(accentColor),
    'data-gray-color': prop(resolvedGrayColor),
    'data-has-background': prop(() => (hasBackground() ? 'true' : 'false')),
    'data-panel-background': prop(panelBackground),
    'data-radius': prop(radius),
    'data-scaling': prop(scaling),
    className: prop(() =>
      classNames(
        'radix-themes',
        {
          light: appearance() === 'light',
          dark: appearance() === 'dark',
        },
        props.className,
      ),
    ),
  }

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {asChild ? (
        <Slot.Root
          {...(themeProps as Record<string, unknown>)}
          {...sharedProps}
          {...(forwardedElementRef ? { ref: forwardedElementRef } : {})}
        />
      ) : (
        <div
          {...(themeProps as Record<string, unknown>)}
          {...sharedProps}
          {...(forwardedDivRef ? { ref: forwardedDivRef } : {})}
        />
      )}
    </ThemeContext.Provider>
  )
})

ThemeImpl.displayName = 'ThemeImpl'

const THEME_INTERNAL_PROPS = new Set([
  'accentColor',
  'appearance',
  'asChild',
  'grayColor',
  'hasBackground',
  'isRoot',
  'onAccentColorChange',
  'onAppearanceChange',
  'onGrayColorChange',
  'onPanelBackgroundChange',
  'onRadiusChange',
  'onScalingChange',
  'panelBackground',
  'radius',
  'scaling',
])

function copyReactiveProps(
  source: Record<string, unknown>,
  excluded: ReadonlySet<string>,
): Record<string, unknown> {
  const target: Record<string, unknown> = {}

  for (const key of Reflect.ownKeys(source)) {
    if (typeof key !== 'string' || excluded.has(key)) {
      continue
    }

    target[key] = prop(() => source[key])
  }

  return target
}

export { Theme, ThemeContext, useThemeContext }
export type { ThemeProps, ThemeContextValue }
