import type { FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import {
  AccessibleIcon as AccessibleIconUI,
  Accordion as AccordionUI,
  AlertDialog as AlertDialogUI,
  AspectRatio as AspectRatioUI,
  Avatar as AvatarUI,
  Checkbox as CheckboxUI,
  Collapsible as CollapsibleUI,
  ContextMenu as ContextMenuUI,
  Dialog as DialogUI,
  Direction as DirectionUI,
  DropdownMenu as DropdownMenuUI,
  Form as FormUI,
  HoverCard as HoverCardUI,
  Label as LabelUI,
  Menubar as MenubarUI,
  NavigationMenu as NavigationMenuUI,
  unstable_OneTimePasswordField as OneTimePasswordFieldUI,
  unstable_PasswordToggleField as PasswordToggleFieldUI,
  Popover as PopoverUI,
  Portal as PortalUI,
  Progress as ProgressUI,
  RadioGroup as RadioGroupUI,
  ScrollArea as ScrollAreaUI,
  Select as SelectUI,
  Separator as SeparatorUI,
  Slider as SliderUI,
  Slot as SlotUI,
  Switch as SwitchUI,
  Tabs as TabsUI,
  Toast as ToastUI,
  Toggle as ToggleUI,
  ToggleGroup as ToggleGroupUI,
  Toolbar as ToolbarUI,
  Tooltip as TooltipUI,
  VisuallyHidden as VisuallyHiddenUI,
} from '@fictjs/radix-ui'

const AVATAR_SRC =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="26" fill="#c66b35"/><circle cx="48" cy="36" r="18" fill="#fffaf3"/><path d="M18 82c8-15 19-22 30-22s22 7 30 22" fill="#fffaf3"/></svg>',
  )

const packageGroups = [
  {
    title: 'Accessibility',
    items: ['accessible-icon', 'label', 'separator', 'slot', 'visually-hidden', 'direction'],
  },
  {
    title: 'Layout & Media',
    items: ['aspect-ratio', 'avatar', 'portal', 'progress', 'scroll-area'],
  },
  {
    title: 'Inputs & Forms',
    items: [
      'accordion',
      'collapsible',
      'checkbox',
      'switch',
      'slider',
      'radio-group',
      'tabs',
      'toggle',
      'toggle-group',
      'form',
      'one-time-password-field',
      'password-toggle-field',
    ],
  },
  {
    title: 'Menus & Overlays',
    items: [
      'navigation-menu',
      'dropdown-menu',
      'context-menu',
      'menubar',
      'select',
      'toolbar',
      'dialog',
      'alert-dialog',
      'popover',
      'hover-card',
      'tooltip',
      'toast',
    ],
  },
] as const

function Surface(props: {
  eyebrow: string
  title: string
  detail: string
  children?: FictNode | FictNode[]
}): FictNode {
  return (
    <section class="surface">
      <div class="surface-head">
        <span class="surface-eyebrow">{props.eyebrow}</span>
        <h2>{props.title}</h2>
        <p>{props.detail}</p>
      </div>
      <div class="surface-body">{props.children}</div>
    </section>
  )
}

function DemoCard(props: {
  title: string
  packages: string[]
  note: string
  span?: 'wide'
  children?: FictNode | FictNode[]
}): FictNode {
  return (
    <article class="demo-card" data-span={props.span}>
      <div class="demo-card-head">
        <div class="demo-packages">
          {props.packages.map((entry) => (
            <span class="demo-pill">{entry}</span>
          ))}
        </div>
        <h3>{props.title}</h3>
        <p class="surface-note">{props.note}</p>
      </div>
      <div class="demo-stage">{props.children}</div>
    </article>
  )
}

function AccessibilityFoundationsShowcase(): FictNode {
  return (
    <div class="stack-list foundation-stack">
      <div class="icon-row">
        <button class="icon-button" type="button">
          <AccessibleIconUI.Root label="Close panel">
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
            >
              <path d="M6 6 L18 18 M18 6 L6 18" />
            </svg>
          </AccessibleIconUI.Root>
        </button>
        <button class="icon-button" type="button">
          <span aria-hidden="true">?</span>
          <VisuallyHiddenUI.Root>Open release help</VisuallyHiddenUI.Root>
        </button>
      </div>

      <div class="field-stack">
        <LabelUI.Root class="field-label" htmlFor="preview-foundation-input">
          Release query
        </LabelUI.Root>
        <input
          id="preview-foundation-input"
          class="text-input"
          placeholder="search primitives"
          value="overlay"
        />
      </div>

      <SeparatorUI.Root class="separator-line" />

      <div class="token-row">
        <span>Core</span>
        <SeparatorUI.Root decorative class="separator-vertical" orientation="vertical" />
        <span>Layout</span>
        <SeparatorUI.Root decorative class="separator-vertical" orientation="vertical" />
        <span>A11y</span>
      </div>
    </div>
  )
}

function AspectAvatarShowcase(): FictNode {
  return (
    <div class="stack-list foundation-stack">
      <AspectRatioUI.Root class="aspect-frame" ratio={16 / 9}>
        <div class="media-art">
          <span>16:9</span>
          <strong>Aspect ratio surface</strong>
        </div>
      </AspectRatioUI.Root>

      <div class="avatar-row">
        <AvatarUI.Root class="avatar-shell">
          <AvatarUI.Fallback class="avatar-fallback">FX</AvatarUI.Fallback>
          <AvatarUI.Image alt="Fict avatar" class="avatar-image" src={AVATAR_SRC} />
        </AvatarUI.Root>
        <div class="profile-row">
          <strong>Workspace Preview</strong>
          <p>Avatar fallback and image loading stay aligned with the public Radix API.</p>
        </div>
      </div>
    </div>
  )
}

function DirectionBadge(): FictNode {
  const dir = DirectionUI.useDirection()
  return <div class="direction-badge">{dir().toUpperCase()}</div>
}

function SlotPortalDirectionShowcase(): FictNode {
  const portalHost = createSignal<HTMLDivElement | null>(null)

  return (
    <div class="stack-list foundation-stack">
      <SlotUI.Root class="slot-shell" data-slot="preview">
        <span class="slot-piece">left</span>
        <SlotUI.Slottable>
          <button class="slot-target" type="button">
            center
          </button>
        </SlotUI.Slottable>
        <span class="slot-piece">right</span>
      </SlotUI.Root>

      <div class="portal-shell">
        <div class="portal-host" ref={(node) => portalHost(node)} />
        {portalHost() ? (
          <PortalUI.Root container={portalHost()}>
            <div class="portal-badge">Portaled into local host</div>
          </PortalUI.Root>
        ) : null}
      </div>

      <div class="direction-grid">
        <DirectionUI.DirectionProvider dir="ltr">
          <DirectionBadge />
        </DirectionUI.DirectionProvider>
        <DirectionUI.DirectionProvider dir="rtl">
          <DirectionBadge />
        </DirectionUI.DirectionProvider>
      </div>
    </div>
  )
}

function ProgressScrollShowcase(): FictNode {
  const value = createSignal(64)

  return (
    <div class="stack-list foundation-stack">
      <div class="progress-row">
        <ProgressUI.Root class="progress-root" max={100} value={() => value()}>
          <ProgressUI.Indicator class="progress-indicator" style={{ width: `${value()}%` }} />
        </ProgressUI.Root>
        <button
          class="ghost-button"
          type="button"
          onClick={() => value((value() + 12) % 101)}
        >
          Advance
        </button>
      </div>

      <ScrollAreaUI.Root class="scroll-root">
        <ScrollAreaUI.Viewport class="scroll-viewport">
          <div class="scroll-content">
            {Array.from({ length: 12 }, (_, index) => (
              <div class="scroll-item">Primitive sample {index + 1}</div>
            ))}
          </div>
        </ScrollAreaUI.Viewport>
        <ScrollAreaUI.Scrollbar class="scrollbar" orientation="vertical">
          <ScrollAreaUI.Thumb class="scroll-thumb" />
        </ScrollAreaUI.Scrollbar>
        <ScrollAreaUI.Scrollbar class="scrollbar scrollbar-horizontal" orientation="horizontal">
          <ScrollAreaUI.Thumb class="scroll-thumb" />
        </ScrollAreaUI.Scrollbar>
        <ScrollAreaUI.Corner class="scroll-corner" />
      </ScrollAreaUI.Root>
    </div>
  )
}

function AccordionCollapsibleShowcase(): FictNode {
  return (
    <div class="stack-list">
      <AccordionUI.Root class="stack-list" type="multiple" defaultValue={['scope']}>
        <AccordionUI.Item class="stack-item" value="scope">
          <AccordionUI.Header>
            <AccordionUI.Trigger class="stack-trigger">Scope creation</AccordionUI.Trigger>
          </AccordionUI.Header>
          <AccordionUI.Content class="stack-content">
            Shared context scopes keep nested primitives composable without leaking state across
            unrelated trees.
          </AccordionUI.Content>
        </AccordionUI.Item>
        <AccordionUI.Item class="stack-item" value="portal">
          <AccordionUI.Header>
            <AccordionUI.Trigger class="stack-trigger">Portal layering</AccordionUI.Trigger>
          </AccordionUI.Header>
          <AccordionUI.Content class="stack-content">
            Dialog, hover-card, popover, and toast all reuse the same portal and presence spine.
          </AccordionUI.Content>
        </AccordionUI.Item>
      </AccordionUI.Root>

      <CollapsibleUI.Root class="collapse-panel">
        <CollapsibleUI.Trigger class="chip-button collapse-trigger">
          Toggle implementation note
        </CollapsibleUI.Trigger>
        <CollapsibleUI.Content class="stack-content">
          Collapsible exposes the lower-level open-state contract that accordion layers on top.
        </CollapsibleUI.Content>
      </CollapsibleUI.Root>
    </div>
  )
}

function TabsShowcase(): FictNode {
  return (
    <TabsUI.Root class="tabs-root" defaultValue="api">
      <TabsUI.List class="tabs-list">
        <TabsUI.Trigger class="tabs-trigger" value="api">
          API
        </TabsUI.Trigger>
        <TabsUI.Trigger class="tabs-trigger" value="a11y">
          A11y
        </TabsUI.Trigger>
        <TabsUI.Trigger class="tabs-trigger" value="testing">
          Testing
        </TabsUI.Trigger>
      </TabsUI.List>
      <TabsUI.Content class="tabs-panel" value="api">
        Public exports mirror Radix naming, including `Root` aliases and scoped factory helpers.
      </TabsUI.Content>
      <TabsUI.Content class="tabs-panel" value="a11y">
        Roles, labels, focus movement, dismissal behavior, and hidden content are carried over.
      </TabsUI.Content>
      <TabsUI.Content class="tabs-panel" value="testing">
        Every replicated package landed with docs plus package-level tests before commit.
      </TabsUI.Content>
    </TabsUI.Root>
  )
}

function SelectionControlsShowcase(): FictNode {
  const checkbox = createSignal<boolean | 'indeterminate'>(true)
  const notifications = createSignal(true)
  const density = createSignal([42])

  return (
    <div class="controls-grid controls-grid-compact">
      <div class="control-block">
        <label class="control-label">Checkbox</label>
        <div class="toggle-row">
          <CheckboxUI.Root
            aria-label="Enable previews"
            checked={checkbox}
            class="checkbox-root"
            onCheckedChange={checkbox}
          >
            <CheckboxUI.Indicator class="checkbox-indicator">✓</CheckboxUI.Indicator>
          </CheckboxUI.Root>
          <span class="control-copy">Preview content enabled</span>
        </div>
      </div>

      <div class="control-block">
        <label class="control-label">Switch</label>
        <div class="toggle-row">
          <SwitchUI.Root
            aria-label="Enable release notifications"
            checked={notifications}
            class="switch-root"
            onCheckedChange={notifications}
          >
            <SwitchUI.Thumb class="switch-thumb" />
          </SwitchUI.Root>
          <span class="control-copy">
            Notifications {notifications() ? 'active' : 'muted'}
          </span>
        </div>
      </div>

      <div class="control-block">
        <label class="control-label">Radio group</label>
        <RadioGroupUI.Root class="radio-list" defaultValue="beta">
          <RadioGroupUI.Item class="radio-item" value="alpha">
            <RadioGroupUI.Indicator class="indicator-dot" />
            Alpha
          </RadioGroupUI.Item>
          <RadioGroupUI.Item class="radio-item" value="beta">
            <RadioGroupUI.Indicator class="indicator-dot" />
            Beta
          </RadioGroupUI.Item>
        </RadioGroupUI.Root>
      </div>

      <div class="control-block control-slider-block">
        <label class="control-label">Slider</label>
        <SliderUI.Root
          aria-label="Preview density"
          class="slider-root"
          max={100}
          onValueChange={density}
          step={1}
          value={density}
        >
          <SliderUI.Track class="slider-track">
            <SliderUI.Range class="slider-range" />
          </SliderUI.Track>
          <SliderUI.Thumb class="slider-thumb" />
        </SliderUI.Root>
        <span class="surface-note">Density target: {density()[0] ?? 0}%</span>
      </div>
    </div>
  )
}

function ToggleShowcase(): FictNode {
  const pressed = createSignal(true)
  const modes = createSignal(['italic'])

  return (
    <div class="stack-list foundation-stack">
      <div class="toggle-row toggle-row-wide">
        <ToggleUI.Root
          aria-label="Pin release notes"
          class="toggle-chip"
          onPressedChange={pressed}
          pressed={pressed}
        >
          Pin release notes
        </ToggleUI.Root>
        <span class="surface-note">{pressed() ? 'Pinned' : 'Unpinned'}</span>
      </div>

      <ToggleGroupUI.Root
        class="toggle-group-root"
        onValueChange={modes}
        type="multiple"
        value={modes}
      >
        <ToggleGroupUI.Item class="toggle-chip" value="bold">
          Bold
        </ToggleGroupUI.Item>
        <ToggleGroupUI.Item class="toggle-chip" value="italic">
          Italic
        </ToggleGroupUI.Item>
        <ToggleGroupUI.Item class="toggle-chip" value="underline">
          Underline
        </ToggleGroupUI.Item>
      </ToggleGroupUI.Root>
    </div>
  )
}

function FormShowcase(): FictNode {
  return (
    <FormUI.Root class="form-shell">
      <FormUI.Field class="form-field" name="email">
        <FormUI.Label class="field-label">Email</FormUI.Label>
        <FormUI.Control class="text-input" placeholder="you@fict.dev" required />
        <FormUI.Message class="validation-text" match="valueMissing">
          Email is required
        </FormUI.Message>
      </FormUI.Field>

      <FormUI.Submit class="primary-button form-submit">Submit form</FormUI.Submit>
    </FormUI.Root>
  )
}

function CredentialFieldsShowcase(): FictNode {
  return (
    <div class="stack-list foundation-stack">
      <OneTimePasswordFieldUI.Root class="otp-shell">
        <div class="otp-row">
          <OneTimePasswordFieldUI.Input class="otp-input" />
          <OneTimePasswordFieldUI.Input class="otp-input" />
          <OneTimePasswordFieldUI.Input class="otp-input" />
          <OneTimePasswordFieldUI.Input class="otp-input" />
        </div>
        <OneTimePasswordFieldUI.HiddenInput name="verification-code" />
      </OneTimePasswordFieldUI.Root>

      <div class="password-shell">
        <PasswordToggleFieldUI.Root>
          <PasswordToggleFieldUI.Input class="text-input" defaultValue="swordfish" />
          <div class="toggle-row toggle-row-wide">
            <PasswordToggleFieldUI.Toggle class="chip-button">Reveal</PasswordToggleFieldUI.Toggle>
            <PasswordToggleFieldUI.Slot
              hidden={<span class="surface-note">Currently hidden</span>}
              visible={<span class="surface-note">Currently visible</span>}
            />
          </div>
        </PasswordToggleFieldUI.Root>
      </div>
    </div>
  )
}

function NavigationShowcase(): FictNode {
  return (
    <NavigationMenuUI.Root defaultValue="docs" class="nav-root">
      <NavigationMenuUI.List class="nav-list">
        <NavigationMenuUI.Item value="docs">
          <NavigationMenuUI.Trigger class="nav-trigger">Docs</NavigationMenuUI.Trigger>
          <NavigationMenuUI.Content class="nav-panel">
            <article>
              <span class="mini-kicker">Documentation</span>
              <h3>Readable structure for every primitive</h3>
              <p>
                Keep the public surface aligned with Radix while retaining Fict-native
                implementation details under the hood.
              </p>
            </article>
            <div class="mini-grid">
              <div class="mini-tile">
                <strong>README</strong>
                <span>per package</span>
              </div>
              <div class="mini-tile">
                <strong>Tests</strong>
                <span>behavior-first</span>
              </div>
            </div>
          </NavigationMenuUI.Content>
        </NavigationMenuUI.Item>
        <NavigationMenuUI.Item value="systems">
          <NavigationMenuUI.Trigger class="nav-trigger">Systems</NavigationMenuUI.Trigger>
          <NavigationMenuUI.Content class="nav-panel">
            <article>
              <span class="mini-kicker">Composition</span>
              <h3>Layered dependencies, still navigable</h3>
              <p>
                Core utilities stay small while dialog, select, and menubar build from the same
                internal pieces.
              </p>
            </article>
            <div class="mini-grid">
              <div class="mini-tile">
                <strong>35</strong>
                <span>public component families previewed here</span>
              </div>
              <div class="mini-tile">
                <strong>59</strong>
                <span>mirrored package replicas in the workspace</span>
              </div>
            </div>
          </NavigationMenuUI.Content>
        </NavigationMenuUI.Item>
        <NavigationMenuUI.Item value="workflow">
          <NavigationMenuUI.Trigger class="nav-trigger">Workflow</NavigationMenuUI.Trigger>
          <NavigationMenuUI.Content class="nav-panel">
            <article>
              <span class="mini-kicker">Iteration</span>
              <h3>Use the site while editing the local repo</h3>
              <p>
                The preview app points at the workspace source tree so UI checks stay next to the
                implementation work.
              </p>
            </article>
            <a class="inline-cta" href="#lab">
              Jump to the full matrix
            </a>
          </NavigationMenuUI.Content>
        </NavigationMenuUI.Item>
      </NavigationMenuUI.List>
      <NavigationMenuUI.Indicator class="nav-indicator">•</NavigationMenuUI.Indicator>
      <NavigationMenuUI.Viewport class="nav-viewport" />
    </NavigationMenuUI.Root>
  )
}

function SelectDropdownShowcase(): FictNode {
  const lane = createSignal('beta')

  return (
    <div class="stack-list foundation-stack">
      <SelectUI.Root onValueChange={lane} value={lane}>
        <SelectUI.Trigger class="select-trigger">
          <SelectUI.Value placeholder="Choose a release lane" />
          <SelectUI.Icon>▾</SelectUI.Icon>
        </SelectUI.Trigger>
        <SelectUI.Content class="select-content">
          <SelectUI.Item class="select-item" value="alpha">
            <SelectUI.ItemText>Alpha channel</SelectUI.ItemText>
            <SelectUI.ItemIndicator class="select-indicator">✓</SelectUI.ItemIndicator>
          </SelectUI.Item>
          <SelectUI.Item class="select-item" value="beta">
            <SelectUI.ItemText>Beta channel</SelectUI.ItemText>
            <SelectUI.ItemIndicator class="select-indicator">✓</SelectUI.ItemIndicator>
          </SelectUI.Item>
          <SelectUI.Item class="select-item" value="stable">
            <SelectUI.ItemText>Stable channel</SelectUI.ItemText>
            <SelectUI.ItemIndicator class="select-indicator">✓</SelectUI.ItemIndicator>
          </SelectUI.Item>
        </SelectUI.Content>
      </SelectUI.Root>

      <DropdownMenuUI.Root>
        <DropdownMenuUI.Trigger class="chip-button">Open actions</DropdownMenuUI.Trigger>
        <DropdownMenuUI.Content class="menu-card">
          <DropdownMenuUI.Item class="menu-item">Open package README</DropdownMenuUI.Item>
          <DropdownMenuUI.Item class="menu-item">Run focused tests</DropdownMenuUI.Item>
          <DropdownMenuUI.Item class="menu-item">Build current package</DropdownMenuUI.Item>
        </DropdownMenuUI.Content>
      </DropdownMenuUI.Root>

      <p class="surface-note">Current release lane: {lane()}</p>
    </div>
  )
}

function ContextMenuShowcase(): FictNode {
  return (
    <ContextMenuUI.Root>
      <ContextMenuUI.Trigger class="context-zone">
        Right click this surface to inspect a context-menu primitive.
      </ContextMenuUI.Trigger>
      <ContextMenuUI.Content class="menu-card">
        <ContextMenuUI.Label class="menu-label">Context Actions</ContextMenuUI.Label>
        <ContextMenuUI.Item class="menu-item">Duplicate surface</ContextMenuUI.Item>
        <ContextMenuUI.Item class="menu-item">Open source package</ContextMenuUI.Item>
        <ContextMenuUI.Separator class="menu-separator" />
        <ContextMenuUI.Item class="menu-item">Run local preview build</ContextMenuUI.Item>
      </ContextMenuUI.Content>
    </ContextMenuUI.Root>
  )
}

function MenubarToolbarShowcase(): FictNode {
  return (
    <div class="stack-list foundation-stack">
      <MenubarUI.Root class="menubar-root">
        <MenubarUI.Menu value="file">
          <MenubarUI.Trigger class="nav-trigger">File</MenubarUI.Trigger>
          <MenubarUI.Content class="menu-card">
            <MenubarUI.Item class="menu-item">New file</MenubarUI.Item>
            <MenubarUI.Item class="menu-item">Export snapshot</MenubarUI.Item>
          </MenubarUI.Content>
        </MenubarUI.Menu>
        <MenubarUI.Menu value="edit">
          <MenubarUI.Trigger class="nav-trigger">Edit</MenubarUI.Trigger>
          <MenubarUI.Content class="menu-card">
            <MenubarUI.Item class="menu-item">Copy styles</MenubarUI.Item>
            <MenubarUI.Item class="menu-item">Reset controls</MenubarUI.Item>
          </MenubarUI.Content>
        </MenubarUI.Menu>
      </MenubarUI.Root>

      <ToolbarUI.Root class="toolbar-shell" orientation="horizontal">
        <ToolbarUI.Button class="chip-button">Undo</ToolbarUI.Button>
        <ToolbarUI.Separator class="separator-vertical" />
        <ToolbarUI.Link class="chip-button" href="#lab">
          Jump to lab
        </ToolbarUI.Link>
        <ToolbarUI.ToggleGroup class="toggle-group-root" defaultValue="grid" type="single">
          <ToolbarUI.ToggleItem class="toggle-chip" value="grid">
            Grid
          </ToolbarUI.ToggleItem>
          <ToolbarUI.ToggleItem class="toggle-chip" value="list">
            List
          </ToolbarUI.ToggleItem>
        </ToolbarUI.ToggleGroup>
      </ToolbarUI.Root>
    </div>
  )
}

function DialogShowcase(): FictNode {
  return (
    <DialogUI.Root>
      <DialogUI.Trigger class="primary-button">Open release dialog</DialogUI.Trigger>
      <DialogUI.Portal>
        <DialogUI.Overlay class="dialog-overlay" />
        <DialogUI.Content class="dialog-content">
          <DialogUI.Title>Ship a primitive with confidence</DialogUI.Title>
          <DialogUI.Description>
            Start from the local package, verify the README and tests, and finish with a clean
            build before cutting the commit.
          </DialogUI.Description>
          <ul class="dialog-checks">
            <li>build</li>
            <li>typecheck</li>
            <li>test</li>
            <li>lint</li>
          </ul>
          <div class="dialog-actions">
            <DialogUI.Close class="ghost-button">Close</DialogUI.Close>
          </div>
        </DialogUI.Content>
      </DialogUI.Portal>
    </DialogUI.Root>
  )
}

function AlertDialogShowcase(): FictNode {
  return (
    <AlertDialogUI.Root>
      <AlertDialogUI.Trigger class="chip-button">Open alert dialog</AlertDialogUI.Trigger>
      <AlertDialogUI.Portal>
        <AlertDialogUI.Overlay class="dialog-overlay" />
        <AlertDialogUI.Content class="dialog-content alert-dialog-content">
          <AlertDialogUI.Title>Delete the generated preview?</AlertDialogUI.Title>
          <AlertDialogUI.Description>
            This action blocks outside dismissal and pushes the safe escape hatch to the cancel
            action.
          </AlertDialogUI.Description>
          <div class="dialog-actions dialog-actions-split">
            <AlertDialogUI.Cancel class="ghost-button">Cancel</AlertDialogUI.Cancel>
            <AlertDialogUI.Action class="primary-button">Confirm</AlertDialogUI.Action>
          </div>
        </AlertDialogUI.Content>
      </AlertDialogUI.Portal>
    </AlertDialogUI.Root>
  )
}

function FloatingLayersShowcase(): FictNode {
  return (
    <div class="stack-list foundation-stack">
      <PopoverUI.Root>
        <PopoverUI.Trigger class="chip-button">Open popover</PopoverUI.Trigger>
        <PopoverUI.Portal>
          <PopoverUI.Content class="floating-panel">
            <strong>Popover content</strong>
            <p>Anchored content can host forms, actions, or diagnostics.</p>
            <PopoverUI.Close class="ghost-button">Dismiss</PopoverUI.Close>
            <PopoverUI.Arrow class="floating-arrow">▲</PopoverUI.Arrow>
          </PopoverUI.Content>
        </PopoverUI.Portal>
      </PopoverUI.Root>

      <HoverCardUI.Root openDelay={120}>
        <HoverCardUI.Trigger
          class="text-link"
          href="#hover-preview"
          onClick={(event) => event.preventDefault()}
        >
          @fictjs hover preview
        </HoverCardUI.Trigger>
        <HoverCardUI.Portal>
          <HoverCardUI.Content class="hover-panel">
            <strong>Hover card</strong>
            <p>Pointer-driven surface for rich previews without fully opening a dialog.</p>
            <HoverCardUI.Arrow class="floating-arrow">▲</HoverCardUI.Arrow>
          </HoverCardUI.Content>
        </HoverCardUI.Portal>
      </HoverCardUI.Root>

      <TooltipUI.Provider delayDuration={100}>
        <TooltipUI.Root>
          <TooltipUI.Trigger class="chip-button">Hover for tooltip</TooltipUI.Trigger>
          <TooltipUI.Portal>
            <TooltipUI.Content class="tooltip-bubble">
              Fast status detail
              <TooltipUI.Arrow class="floating-arrow">▲</TooltipUI.Arrow>
            </TooltipUI.Content>
          </TooltipUI.Portal>
        </TooltipUI.Root>
      </TooltipUI.Provider>
    </div>
  )
}

function ToastShowcase(): FictNode {
  const open = createSignal(false)

  return (
    <ToastUI.Provider duration={2600}>
      <div class="toast-launch">
        <button class="primary-button" onClick={() => open(true)} type="button">
          Queue toast
        </button>
        <p class="surface-note">Launches a workspace-scoped release notification.</p>
      </div>
      <ToastUI.Viewport class="toast-viewport" />
      <ToastUI.Root class="toast-root" onOpenChange={open} open={open}>
        <ToastUI.Title class="toast-title">Preview site ready</ToastUI.Title>
        <ToastUI.Description class="toast-description">
          All public component families now have a live demo in this workspace preview.
        </ToastUI.Description>
        <div class="toast-actions">
          <ToastUI.Action altText="Open the preview section" class="chip-button">
            Review
          </ToastUI.Action>
          <ToastUI.Close class="ghost-button">Dismiss</ToastUI.Close>
        </div>
      </ToastUI.Root>
    </ToastUI.Provider>
  )
}

export default function App(): FictNode {
  return (
    <div class="page-shell">
      <div class="ambient ambient-left" />
      <div class="ambient ambient-right" />

      <header class="hero">
        <div class="hero-copy">
          <span class="hero-kicker">Local Workspace Preview</span>
          <h1>Fict UI primitives, now with full surface coverage.</h1>
          <p class="hero-summary">
            This page previews every public component family exported by `@fictjs/radix-ui`,
            wired directly to the local `ui-primitives` workspace instead of a published bundle.
          </p>
          <div class="hero-actions">
            <a class="primary-button" href="#lab">
              Explore all demos
            </a>
            <code class="command-chip">pnpm preview:dev</code>
          </div>
        </div>

        <aside class="hero-panel">
          <div class="metric-row">
            <strong>59</strong>
            <span>React-equivalent packages mirrored from Radix in the workspace</span>
          </div>
          <div class="metric-row">
            <strong>35</strong>
            <span>Public component families covered in this preview site</span>
          </div>
          <div class="metric-row">
            <strong>1</strong>
            <span>Live Vite app pointing at source packages instead of compiled releases</span>
          </div>
        </aside>
      </header>

      <section class="catalog-band">
        {packageGroups.map((group) => (
          <article class="catalog-group">
            <span class="catalog-title">{group.title}</span>
            <div class="catalog-list">
              {group.items.map((item) => (
                <span class="catalog-pill">{item}</span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <main class="lab" id="lab">
        <Surface
          eyebrow="Foundation"
          title="Accessibility, layout, and low-level composition"
          detail="These cards cover the non-flashy primitives that the higher-level packages rely on: semantics, layout shells, directional context, portals, slots, and scroll/progress surfaces."
        >
          <div class="showcase-grid">
            <DemoCard
              title="Accessibility helpers"
              packages={['accessible-icon', 'label', 'separator', 'visually-hidden']}
              note="Small primitives that carry a disproportionate amount of semantic weight."
            >
              <AccessibilityFoundationsShowcase />
            </DemoCard>

            <DemoCard
              title="Media and framing"
              packages={['aspect-ratio', 'avatar']}
              note="Aspect-ratio wrappers and avatar loading/fallback behavior share the same design language."
            >
              <AspectAvatarShowcase />
            </DemoCard>

            <DemoCard
              title="Slot, portal, and direction"
              packages={['slot', 'portal', 'direction']}
              note="Composition primitives stay visible here instead of being hidden behind larger components."
            >
              <SlotPortalDirectionShowcase />
            </DemoCard>

            <DemoCard
              title="Progress and scroll surfaces"
              packages={['progress', 'scroll-area']}
              note="Progress feedback and custom scrolling are separate packages but often travel together in app shells."
            >
              <ProgressScrollShowcase />
            </DemoCard>
          </div>
        </Surface>

        <Surface
          eyebrow="State"
          title="Disclosure, selection, and form mechanics"
          detail="This section covers the high-frequency controls: disclosure widgets, toggles, binary inputs, range inputs, tabs, and compound form fields."
        >
          <div class="showcase-grid">
            <DemoCard
              title="Accordion and collapsible"
              packages={['accordion', 'collapsible']}
              note="Accordion builds on the same core open-state mechanics exposed separately by collapsible."
            >
              <AccordionCollapsibleShowcase />
            </DemoCard>

            <DemoCard
              title="Tabs"
              packages={['tabs']}
              note="Tabbed content keeps the controlled-state API familiar while expressing a navigation-specific pattern."
            >
              <TabsShowcase />
            </DemoCard>

            <DemoCard
              title="Binary, choice, and range controls"
              packages={['checkbox', 'switch', 'radio-group', 'slider']}
              note="These four packages are the control-heavy edge of the library, including hidden form inputs and roving focus."
            >
              <SelectionControlsShowcase />
            </DemoCard>

            <DemoCard
              title="Toggle families"
              packages={['toggle', 'toggle-group']}
              note="Single toggles and grouped toggles share pressed-state semantics but diverge on selection models."
            >
              <ToggleShowcase />
            </DemoCard>

            <DemoCard
              title="Form composition"
              packages={['form']}
              note="Field, control, label, message, and submit stay composable while exposing built-in and custom validity states."
            >
              <FormShowcase />
            </DemoCard>

            <DemoCard
              title="Credential fields"
              packages={['one-time-password-field', 'password-toggle-field']}
              note="Purpose-built field packages cover multi-input OTP entry and password visibility controls."
            >
              <CredentialFieldsShowcase />
            </DemoCard>
          </div>
        </Surface>

        <Surface
          eyebrow="Navigation"
          title="Menus, navigation, and command surfaces"
          detail="This is the densest dependency cluster in the repo. Navigation and menu packages stack on top of shared focus, dismissal, portal, and collection primitives."
        >
          <div class="showcase-grid">
            <DemoCard
              note="Navigation-menu stays the most information-dense package in the public surface, so it gets a wider stage."
              packages={['navigation-menu']}
              span="wide"
              title="Navigation menu"
            >
              <NavigationShowcase />
            </DemoCard>

            <DemoCard
              title="Select and dropdown menu"
              packages={['select', 'dropdown-menu']}
              note="Selection menus and action menus differ in semantics, but their layering and keyboard machinery rhyme."
            >
              <SelectDropdownShowcase />
            </DemoCard>

            <DemoCard
              title="Context menu"
              packages={['context-menu']}
              note="A right-click surface with the same item model as the rest of the menu family."
            >
              <ContextMenuShowcase />
            </DemoCard>

            <DemoCard
              title="Menubar and toolbar"
              packages={['menubar', 'toolbar']}
              note="Top-level menu triggers and command strips both depend on disciplined focus order."
            >
              <MenubarToolbarShowcase />
            </DemoCard>
          </div>
        </Surface>

        <Surface
          eyebrow="Overlay"
          title="Modal, non-modal, and ephemeral layers"
          detail="Dialogs, popovers, hover cards, tooltips, and toast are all represented here so portal-backed behavior can be checked from one place."
        >
          <div class="showcase-grid">
            <DemoCard
              title="Dialog"
              packages={['dialog']}
              note="The standard modal dialog remains the baseline for focus trapping and layered interaction."
            >
              <DialogShowcase />
            </DemoCard>

            <DemoCard
              title="Alert dialog"
              packages={['alert-dialog']}
              note="Alert-dialog narrows the dismissal model and promotes the cancel action into the primary focus target."
            >
              <AlertDialogShowcase />
            </DemoCard>

            <DemoCard
              title="Popover, hover card, and tooltip"
              packages={['popover', 'hover-card', 'tooltip']}
              note="Three related floating surfaces with different intent: action panel, rich preview, and terse hint."
            >
              <FloatingLayersShowcase />
            </DemoCard>

            <DemoCard
              title="Toast"
              packages={['toast']}
              note="Transient feedback is mounted into a dedicated viewport so it can be verified without leaving the page."
            >
              <ToastShowcase />
            </DemoCard>
          </div>
        </Surface>
      </main>
    </div>
  )
}
