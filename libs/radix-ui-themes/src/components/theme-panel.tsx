import { createEffect } from 'fict'
import { createSignal } from 'fict/advanced'

import * as React from '../helpers/element.js'

import { Box } from './box.js'
import { Button } from './button.js'
import { Flex } from './flex.js'
import { Heading } from './heading.js'
import { Kbd } from './kbd.js'
import { Text } from './text.js'
import { Theme, useThemeContext, type ThemeContextValue } from './theme.js'
import { themePropDefs } from './theme.props.js'

import type { ComponentPropsWithout, RemovedProps } from '../helpers/component-props.js'

interface ThemePanelProps extends ComponentPropsWithout<'div', RemovedProps> {
  defaultOpen?: boolean
  onAppearanceChange?: (value: 'light' | 'dark') => void
}

interface ThemePanelImplPrivateProps {
  open: () => boolean
  setOpen: (value: boolean) => void
  triggerRef: { current: HTMLButtonElement | null }
}

interface ThemePanelImplProps
  extends ComponentPropsWithout<'div', RemovedProps>,
    ThemePanelImplPrivateProps {
  onAppearanceChange?: (value: 'light' | 'dark') => void
}

interface ThemePanelContentProps extends ComponentPropsWithout<'div', RemovedProps> {
  context?: ThemeContextValue
  onAppearanceChange?: (value: 'light' | 'dark') => void
}

function ThemePanel(props: ThemePanelProps): React.ReactNode {
  const { defaultOpen = true, onAppearanceChange, ...panelProps } = props
  const open = createSignal(defaultOpen)
  const triggerRef = { current: null as HTMLButtonElement | null }
  const previousFocus = { current: null as HTMLElement | null }

  createEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingTarget =
        target?.closest('input, textarea, select, [contenteditable="true"]') !== null
      if (event.key.toUpperCase() !== 'T' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return
      }
      if (isTypingTarget) {
        return
      }

      const nextOpen = !open()
      open(nextOpen)

      if (nextOpen) {
        previousFocus.current = document.activeElement as HTMLElement | null
        triggerRef.current?.focus()
      } else {
        previousFocus.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  })

  return (
    <ThemePanelImpl
      {...panelProps}
      open={open}
      setOpen={open}
      triggerRef={triggerRef}
      onAppearanceChange={onAppearanceChange}
    />
  )
}

function ThemePanelImpl(props: ThemePanelImplProps): React.ReactNode {
  const { open, setOpen, triggerRef, onAppearanceChange, ...panelProps } = props
  const themeContext = useThemeContext()

  return (
    <Theme asChild radius="medium" scaling="100%">
      <div
        {...panelProps}
        style={{
          position: 'fixed',
          top: 'var(--space-2)',
          right: 'var(--space-2)',
          width: 'min(360px, calc(100vw - var(--space-4)))',
          maxHeight: 'calc(100vh - var(--space-4))',
          overflow: 'auto',
          borderRadius: 'var(--radius-4)',
          backgroundColor: 'var(--color-panel-solid)',
          boxShadow: open() ? 'var(--shadow-5)' : 'var(--shadow-2)',
          transform: open() ? 'translateX(0)' : 'translateX(calc(100% + var(--space-2)))',
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          zIndex: 999999999,
          ...(typeof panelProps.style === 'object' && panelProps.style !== null ? panelProps.style : {}),
        }}
      >
        <Flex direction="column" gap="4" p="4">
          <Flex align="center" justify="between" gap="3">
            <Heading as="h2" size="4">
              Theme
            </Heading>
            <Kbd>
              <button
                type="button"
                ref={triggerRef}
                onClick={() => setOpen(!open())}
                aria-label="Toggle the Theme Panel"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                T
              </button>
            </Kbd>
          </Flex>
          <ThemePanelContent context={themeContext} onAppearanceChange={onAppearanceChange} />
        </Flex>
      </div>
    </Theme>
  )
}

function ThemePanelContent(props: ThemePanelContentProps): React.ReactNode {
  const { context: suppliedContext, onAppearanceChange, ...contentProps } = props
  const themeContext = suppliedContext ?? useThemeContext()
  const copyState = createSignal<'idle' | 'copied'>('idle')

  const appearance = () =>
    themeContext.appearance === 'inherit' ? ('light' as const) : themeContext.appearance

  const handleAppearanceChange = (value: 'light' | 'dark') => {
    themeContext.onAppearanceChange(value)
    onAppearanceChange?.(value)
  }

  const handleCopyTheme = async () => {
    const parts = [
      themeContext.appearance === themePropDefs.appearance.default
        ? undefined
        : `appearance="${themeContext.appearance}"`,
      themeContext.accentColor === themePropDefs.accentColor.default
        ? undefined
        : `accentColor="${themeContext.accentColor}"`,
      themeContext.grayColor === themePropDefs.grayColor.default
        ? undefined
        : `grayColor="${themeContext.grayColor}"`,
      themeContext.panelBackground === themePropDefs.panelBackground.default
        ? undefined
        : `panelBackground="${themeContext.panelBackground}"`,
      themeContext.radius === themePropDefs.radius.default ? undefined : `radius="${themeContext.radius}"`,
      themeContext.scaling === themePropDefs.scaling.default
        ? undefined
        : `scaling="${themeContext.scaling}"`,
    ].filter(Boolean)

    await navigator.clipboard.writeText(parts.length > 0 ? `<Theme ${parts.join(' ')}>` : '<Theme>')
    copyState('copied')
    setTimeout(() => copyState('idle'), 1500)
  }

  return (
    <Flex direction="column" gap="4" {...contentProps}>
      <ThemePanelRadioGroup
        label="Appearance"
        name="theme-panel-appearance"
        options={['light', 'dark']}
        value={appearance()}
        onChange={(nextValue) => handleAppearanceChange(nextValue as 'light' | 'dark')}
      />
      <ThemePanelRadioGroup
        label="Accent"
        name="theme-panel-accent"
        options={themePropDefs.accentColor.values}
        value={themeContext.accentColor}
        onChange={(nextValue) => themeContext.onAccentColorChange(nextValue as typeof themeContext.accentColor)}
      />
      <ThemePanelRadioGroup
        label="Gray"
        name="theme-panel-gray"
        options={themePropDefs.grayColor.values}
        value={themeContext.grayColor}
        onChange={(nextValue) => themeContext.onGrayColorChange(nextValue as typeof themeContext.grayColor)}
      />
      <ThemePanelRadioGroup
        label="Panel"
        name="theme-panel-panel"
        options={themePropDefs.panelBackground.values}
        value={themeContext.panelBackground}
        onChange={(nextValue) =>
          themeContext.onPanelBackgroundChange(nextValue as typeof themeContext.panelBackground)
        }
      />
      <ThemePanelRadioGroup
        label="Radius"
        name="theme-panel-radius"
        options={themePropDefs.radius.values}
        value={themeContext.radius}
        onChange={(nextValue) => themeContext.onRadiusChange(nextValue as typeof themeContext.radius)}
      />
      <ThemePanelRadioGroup
        label="Scaling"
        name="theme-panel-scaling"
        options={themePropDefs.scaling.values}
        value={themeContext.scaling}
        onChange={(nextValue) => themeContext.onScalingChange(nextValue as typeof themeContext.scaling)}
      />
      <Button onClick={() => void handleCopyTheme()}>{copyState() === 'copied' ? 'Copied' : 'Copy Theme'}</Button>
    </Flex>
  )
}

interface ThemePanelRadioGroupProps {
  label: string
  name: string
  onChange: (value: string) => void
  options: readonly string[]
  value: string
}

function ThemePanelRadioGroup(props: ThemePanelRadioGroupProps) {
  return (
    <Flex direction="column" gap="2">
      <Heading as="h3" size="2">
        {props.label}
      </Heading>
      <Flex wrap="wrap" gap="2">
        {props.options.map((option) => (
          <label key={option}>
            <Box
              as="span"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-3)',
                border: '1px solid var(--gray-a6)',
              }}
            >
              <input
                type="radio"
                name={props.name}
                value={option}
                checked={props.value === option}
                onChange={(event) => {
                  const target = event.currentTarget as HTMLInputElement
                  props.onChange(target.value)
                }}
              />
              <Text size="1">{upperFirst(option)}</Text>
            </Box>
          </label>
        ))}
      </Flex>
    </Flex>
  )
}

function upperFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

ThemePanel.displayName = 'ThemePanel'
ThemePanelImpl.displayName = 'ThemePanelImpl'
ThemePanelContent.displayName = 'ThemePanelContent'

export { ThemePanel, ThemePanelContent }
export type { ThemePanelProps, ThemePanelContentProps }
