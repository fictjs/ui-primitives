import { createContext, createEffect, useContext } from 'fict'
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
          <ThemeRoot {...props} ref={React.coerceRef(forwardedRef)} />
        </Direction.DirectionProvider>
      </TooltipPrimitive.Provider>
    )
  }

  return <ThemeImpl {...props} ref={React.coerceRef(forwardedRef)} />
})

Theme.displayName = 'Theme'

const ThemeRoot = React.forwardRef<ThemeImplElement, ThemeImplPublicProps>((props, forwardedRef) => {
  const {
    appearance: appearanceProp = themePropDefs.appearance.default,
    accentColor: accentColorProp = themePropDefs.accentColor.default,
    grayColor: grayColorProp = themePropDefs.grayColor.default,
    panelBackground: panelBackgroundProp = themePropDefs.panelBackground.default,
    radius: radiusProp = themePropDefs.radius.default,
    scaling: scalingProp = themePropDefs.scaling.default,
    hasBackground = themePropDefs.hasBackground.default,
    ...rootProps
  } = props

  const appearance = createSignal(appearanceProp)
  const accentColor = createSignal(accentColorProp)
  const grayColor = createSignal(grayColorProp)
  const panelBackground = createSignal(panelBackgroundProp)
  const radius = createSignal(radiusProp)
  const scaling = createSignal(scalingProp)

  createEffect(() => {
    appearance(appearanceProp)
    accentColor(accentColorProp)
    grayColor(grayColorProp)
    panelBackground(panelBackgroundProp)
    radius(radiusProp)
    scaling(scalingProp)
  })

  return (
    <ThemeImpl
      {...rootProps}
      ref={React.coerceRef(forwardedRef)}
      isRoot
      hasBackground={hasBackground}
      appearance={appearance()}
      accentColor={accentColor()}
      grayColor={grayColor()}
      panelBackground={panelBackground()}
      radius={radius()}
      scaling={scaling()}
      onAppearanceChange={appearance}
      onAccentColorChange={accentColor}
      onGrayColorChange={grayColor}
      onPanelBackgroundChange={panelBackground}
      onRadiusChange={radius}
      onScalingChange={scaling}
    />
  )
})

ThemeRoot.displayName = 'ThemeRoot'

type ThemeImplElement = Element

interface ThemeImplProps extends ThemeImplPublicProps, ThemeImplPrivateProps {}

interface ThemeImplPublicProps extends ComponentPropsWithout<'div', RemovedProps | 'dir'>, ThemeOwnProps {}

interface ThemeImplPrivateProps extends Partial<ThemeChangeHandlers> {
  isRoot?: boolean
}

const ThemeImpl = React.forwardRef<ThemeImplElement, ThemeImplProps>((props, forwardedRef) => {
  const context = useContext(ThemeContext)

  const appearance = () => props.appearance ?? context?.appearance ?? themePropDefs.appearance.default
  const accentColor = () =>
    props.accentColor ?? context?.accentColor ?? themePropDefs.accentColor.default
  const grayColor = () => props.grayColor ?? context?.resolvedGrayColor ?? themePropDefs.grayColor.default
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
    onAppearanceChange: props.onAppearanceChange ?? noop,
    onAccentColorChange: props.onAccentColorChange ?? noop,
    onGrayColorChange: props.onGrayColorChange ?? noop,
    onPanelBackgroundChange: props.onPanelBackgroundChange ?? noop,
    onRadiusChange: props.onRadiusChange ?? noop,
    onScalingChange: props.onScalingChange ?? noop,
  }

  const {
    asChild,
    isRoot,
    hasBackground: _hasBackground,
    onAppearanceChange,
    onAccentColorChange,
    onGrayColorChange,
    onPanelBackgroundChange,
    onRadiusChange,
    onScalingChange,
    ...themeProps
  } = props
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
    'data-accent-color': accentColor(),
    'data-gray-color': resolvedGrayColor(),
    'data-has-background': hasBackground() ? 'true' : 'false',
    'data-panel-background': panelBackground(),
    'data-radius': radius(),
    'data-scaling': scaling(),
    className: classNames(
      'radix-themes',
      {
        light: appearance() === 'light',
        dark: appearance() === 'dark',
      },
      (themeProps as { className?: string }).className,
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

export { Theme, ThemeContext, useThemeContext }
export type { ThemeProps, ThemeContextValue }
