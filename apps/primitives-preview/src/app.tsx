import { createEffect, onCleanup, onMount, type FictNode } from '@fictjs/runtime'
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
  span?: 'wide' | undefined
  testId?: string
  children?: FictNode | FictNode[]
}): FictNode {
  return (
    <article class="demo-card" data-showcase={props.testId} data-span={props.span}>
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
        <>
          {() => {
            const host = portalHost()
            return host ? (
              <PortalUI.Root container={host}>
                <div class="portal-badge">Portaled into local host</div>
              </PortalUI.Root>
            ) : null
          }}
        </>
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
      <>
        {() => (
          <div class="progress-row">
            <ProgressUI.Root class="progress-root" max={100} value={value()}>
              <ProgressUI.Indicator class="progress-indicator" style={{ width: `${value()}%` }} />
            </ProgressUI.Root>
            <button class="ghost-button" type="button" onClick={() => value((value() + 12) % 101)}>
              Advance
            </button>
          </div>
        )}
      </>

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
  const releaseChannel = createSignal('beta')
  const density = createSignal([42])

  return (
    <>
      {() => (
        <div class="controls-grid controls-grid-compact">
          <div class="control-block">
            <label class="control-label">Checkbox</label>
            <div class="toggle-row">
              <CheckboxUI.Root
                aria-label="Enable previews"
                checked={checkbox()}
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
                checked={notifications()}
                class="switch-root"
                onCheckedChange={notifications}
              >
                <SwitchUI.Thumb class="switch-thumb" />
              </SwitchUI.Root>
              <span class="control-copy">Notifications {notifications() ? 'active' : 'muted'}</span>
            </div>
          </div>

          <div class="control-block">
            <label class="control-label">Radio group</label>
            <RadioGroupUI.Root
              class="radio-list"
              onValueChange={releaseChannel}
              value={releaseChannel()}
            >
              <RadioGroupUI.Item
                class="radio-item"
                onMouseUp={() => releaseChannel('alpha')}
                value="alpha"
              >
                <RadioGroupUI.Indicator class="indicator-dot" />
                Alpha
              </RadioGroupUI.Item>
              <RadioGroupUI.Item
                class="radio-item"
                onMouseUp={() => releaseChannel('beta')}
                value="beta"
              >
                <RadioGroupUI.Indicator class="indicator-dot" />
                Beta
              </RadioGroupUI.Item>
            </RadioGroupUI.Root>
          </div>

          <div class="control-block control-slider-block">
            <label class="control-label">Slider</label>
            <SliderUI.Root
              class="slider-root"
              max={100}
              onValueChange={density}
              step={1}
              value={density()}
            >
              <SliderUI.Track class="slider-track">
                <SliderUI.Range class="slider-range" />
              </SliderUI.Track>
              <SliderUI.Thumb aria-label="Preview density" class="slider-thumb" />
            </SliderUI.Root>
            <span class="surface-note">Density target: {density()[0] ?? 0}%</span>
          </div>
        </div>
      )}
    </>
  )
}

function ToggleShowcase(): FictNode {
  const pressed = createSignal(true)
  const modes = createSignal(['italic'])
  const toggleMode = (mode: string) => {
    const currentModes = modes()
    modes(
      currentModes.includes(mode)
        ? currentModes.filter((entry) => entry !== mode)
        : [...currentModes, mode],
    )
  }

  return (
    <>
      {() => (
        <div class="stack-list foundation-stack">
          <div class="toggle-row toggle-row-wide">
            <ToggleUI.Root
              aria-label="Pin release notes"
              class="toggle-chip"
              onPressedChange={pressed}
              pressed={pressed()}
            >
              Pin release notes
            </ToggleUI.Root>
            <span class="surface-note">{pressed() ? 'Pinned' : 'Unpinned'}</span>
          </div>

          <ToggleGroupUI.Root
            class="toggle-group-root"
            onValueChange={modes}
            type="multiple"
            value={modes()}
          >
            <ToggleGroupUI.Item
              class="toggle-chip"
              onMouseDown={() => toggleMode('bold')}
              value="bold"
            >
              Bold
            </ToggleGroupUI.Item>
            <ToggleGroupUI.Item
              class="toggle-chip"
              onMouseDown={() => toggleMode('italic')}
              value="italic"
            >
              Italic
            </ToggleGroupUI.Item>
            <ToggleGroupUI.Item
              class="toggle-chip"
              onMouseDown={() => toggleMode('underline')}
              value="underline"
            >
              Underline
            </ToggleGroupUI.Item>
          </ToggleGroupUI.Root>
        </div>
      )}
    </>
  )
}

function FormShowcase(): FictNode {
  const email = createSignal('')
  const submitted = createSignal(false)

  return (
    <>
      {() => (
        <FormUI.Root
          class="form-shell"
          onSubmit={(event) => {
            submitted(true)
            if (!email().trim()) {
              event.preventDefault()
            }
          }}
        >
          <FormUI.Field
            class="form-field"
            name="email"
            serverInvalid={submitted() && email().trim().length === 0}
          >
            <FormUI.Label class="field-label">Email</FormUI.Label>
            <FormUI.Control
              class="text-input"
              onInput={(event) => email((event.currentTarget as HTMLInputElement).value)}
              placeholder="you@fict.dev"
              required
              value={email()}
            />
            <FormUI.Message
              class="validation-text"
              forceMatch={submitted() && email().trim().length === 0}
              match="valueMissing"
            >
              Email is required
            </FormUI.Message>
          </FormUI.Field>

          <FormUI.Submit class="primary-button form-submit">Submit form</FormUI.Submit>
        </FormUI.Root>
      )}
    </>
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
            <a class="inline-cta" href="#/overview">
              Browse overview
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
    <>
      {() => (
        <div class="stack-list foundation-stack">
          <SelectUI.Root onValueChange={lane} value={lane()}>
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
      )}
    </>
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
        <ToolbarUI.Link class="chip-button" href="#/overview">
          Overview
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
        <DialogUI.Overlay class="dialog-overlay" style={{ zIndex: 120 }} />
        <DialogUI.Content class="dialog-content" style={{ pointerEvents: 'auto', zIndex: 121 }}>
          <DialogUI.Title>Ship a primitive with confidence</DialogUI.Title>
          <DialogUI.Description>
            Start from the local package, verify the README and tests, and finish with a clean build
            before cutting the commit.
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
        <AlertDialogUI.Overlay class="dialog-overlay" style={{ zIndex: 120 }} />
        <AlertDialogUI.Content
          class="dialog-content alert-dialog-content"
          style={{ pointerEvents: 'auto', zIndex: 121 }}
        >
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
          <PopoverUI.Content class="floating-panel" style={{ pointerEvents: 'auto', zIndex: 96 }}>
            <strong>Popover content</strong>
            <p>Anchored content can host forms, actions, or diagnostics.</p>
            <PopoverUI.Close class="ghost-button">Dismiss</PopoverUI.Close>
            <PopoverUI.Arrow />
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
          <HoverCardUI.Content class="hover-panel" style={{ pointerEvents: 'auto', zIndex: 96 }}>
            <strong>Hover card</strong>
            <p>Pointer-driven surface for rich previews without fully opening a dialog.</p>
            <HoverCardUI.Arrow />
          </HoverCardUI.Content>
        </HoverCardUI.Portal>
      </HoverCardUI.Root>

      <TooltipUI.Provider delayDuration={100}>
        <TooltipUI.Root>
          <TooltipUI.Trigger class="chip-button">Hover for tooltip</TooltipUI.Trigger>
          <TooltipUI.Portal>
            <TooltipUI.Content class="tooltip-bubble" style={{ pointerEvents: 'auto', zIndex: 96 }}>
              Fast status detail
              <TooltipUI.Arrow />
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
      <>
        {() => (
          <>
            <div class="toast-launch">
              <button class="primary-button" onClick={() => open(true)} type="button">
                Queue toast
              </button>
              <p class="surface-note">Launches a workspace-scoped release notification.</p>
            </div>
            <ToastUI.Viewport class="toast-viewport" />
            <ToastUI.Root class="toast-root" onOpenChange={open} open={open()}>
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
          </>
        )}
      </>
    </ToastUI.Provider>
  )
}

type GroupDefinition = {
  slug: string
  navTitle: string
  eyebrow: string
  title: string
  detail: string
  summary: string
  packages: string[]
}

type PackageMeta = {
  exportName: string
  summary: string
  workspacePackage: string
}

type PackageDefinition = PackageMeta & {
  slug: string
  group: string
  showcaseId: string
}

type ShowcaseDefinition = {
  id: string
  group: string
  title: string
  packages: string[]
  note: string
  span?: 'wide'
  render: () => FictNode
}

type Route =
  | { kind: 'overview' }
  | { kind: 'group'; slug: string }
  | { kind: 'package'; slug: string }
  | { kind: 'not-found'; slug: string }

const MIRRORED_PACKAGE_COUNT = 59

const GROUPS: GroupDefinition[] = [
  {
    slug: 'foundation',
    navTitle: 'Foundation',
    eyebrow: 'Foundation',
    title: 'Accessibility, layout, and low-level composition',
    detail:
      'These cards cover the non-flashy primitives that the higher-level packages rely on: semantics, layout shells, directional context, portals, slots, and scroll/progress surfaces.',
    summary:
      'Semantics, layout wrappers, portals, and directional context for the rest of the stack.',
    packages: [
      'accessible-icon',
      'label',
      'separator',
      'visually-hidden',
      'aspect-ratio',
      'avatar',
      'slot',
      'portal',
      'direction',
      'progress',
      'scroll-area',
    ],
  },
  {
    slug: 'state',
    navTitle: 'State',
    eyebrow: 'State',
    title: 'Disclosure, selection, and form mechanics',
    detail:
      'This section covers the high-frequency controls: disclosure widgets, toggles, binary inputs, range inputs, tabs, and compound form fields.',
    summary:
      'Open state, selection state, and form-oriented controls that show most interaction contracts.',
    packages: [
      'accordion',
      'collapsible',
      'tabs',
      'checkbox',
      'switch',
      'radio-group',
      'slider',
      'toggle',
      'toggle-group',
      'form',
      'one-time-password-field',
      'password-toggle-field',
    ],
  },
  {
    slug: 'navigation',
    navTitle: 'Navigation',
    eyebrow: 'Navigation',
    title: 'Menus, navigation, and command surfaces',
    detail:
      'This is the densest dependency cluster in the repo. Navigation and menu packages stack on top of shared focus, dismissal, portal, and collection primitives.',
    summary:
      'Menus, list-like command surfaces, and navigation shells built on shared focus and layering.',
    packages: ['navigation-menu', 'select', 'dropdown-menu', 'context-menu', 'menubar', 'toolbar'],
  },
  {
    slug: 'overlay',
    navTitle: 'Overlay',
    eyebrow: 'Overlay',
    title: 'Modal, non-modal, and ephemeral layers',
    detail:
      'Dialogs, popovers, hover cards, tooltips, and toast are all represented here so portal-backed behavior can be checked from one place.',
    summary:
      'Layered UI surfaces ranging from modal dialogs to short-lived tooltips and toast notifications.',
    packages: ['dialog', 'alert-dialog', 'popover', 'hover-card', 'tooltip', 'toast'],
  },
]

const PACKAGE_META: Record<string, PackageMeta> = {
  'accessible-icon': {
    exportName: 'AccessibleIcon',
    summary:
      'Adds an accessible text label to icon-only controls without changing the visible glyph.',
    workspacePackage: '@fictjs/accessible-icon',
  },
  label: {
    exportName: 'Label',
    summary: 'Associates text labels with form controls while preserving native labeling behavior.',
    workspacePackage: '@fictjs/label',
  },
  separator: {
    exportName: 'Separator',
    summary:
      'Renders semantic horizontal or vertical dividers with decorative and non-decorative modes.',
    workspacePackage: '@fictjs/separator',
  },
  slot: {
    exportName: 'Slot',
    summary:
      'Merges props into a child target so composition can stay declarative without wrapper noise.',
    workspacePackage: '@fictjs/slot',
  },
  'visually-hidden': {
    exportName: 'VisuallyHidden',
    summary:
      'Keeps content accessible to assistive technology while removing it from the visual layout.',
    workspacePackage: '@fictjs/visually-hidden',
  },
  direction: {
    exportName: 'Direction',
    summary:
      'Provides LTR and RTL direction context to primitives that need directional awareness.',
    workspacePackage: '@fictjs/direction',
  },
  'aspect-ratio': {
    exportName: 'AspectRatio',
    summary:
      'Locks media and embedded surfaces to a predictable proportion as their width changes.',
    workspacePackage: '@fictjs/aspect-ratio',
  },
  avatar: {
    exportName: 'Avatar',
    summary: 'Coordinates image loading and fallback rendering for profile-like identity surfaces.',
    workspacePackage: '@fictjs/avatar',
  },
  portal: {
    exportName: 'Portal',
    summary: 'Mounts content into `document.body` or a supplied container for layered interfaces.',
    workspacePackage: '@fictjs/portal',
  },
  progress: {
    exportName: 'Progress',
    summary: 'Exposes an accessible progressbar with determinate and indeterminate state handling.',
    workspacePackage: '@fictjs/progress',
  },
  'scroll-area': {
    exportName: 'ScrollArea',
    summary:
      'Separates viewport, scrollbars, thumbs, and corner rendering for custom scrolling shells.',
    workspacePackage: '@fictjs/scroll-area',
  },
  accordion: {
    exportName: 'Accordion',
    summary: 'Builds structured disclosure stacks in single or multiple-open modes.',
    workspacePackage: '@fictjs/accordion',
  },
  collapsible: {
    exportName: 'Collapsible',
    summary:
      'Exposes the lower-level open-state disclosure primitive that accordion layers on top of.',
    workspacePackage: '@fictjs/collapsible',
  },
  checkbox: {
    exportName: 'Checkbox',
    summary: 'Implements checked and indeterminate states with native form participation.',
    workspacePackage: '@fictjs/checkbox',
  },
  switch: {
    exportName: 'Switch',
    summary: 'Represents binary on/off state with switch semantics and hidden form integration.',
    workspacePackage: '@fictjs/switch',
  },
  'radio-group': {
    exportName: 'RadioGroup',
    summary: 'Coordinates exclusive selection and keyboard focus movement across grouped options.',
    workspacePackage: '@fictjs/radio-group',
  },
  slider: {
    exportName: 'Slider',
    summary: 'Handles ranged values with one or more thumbs, track math, and keyboard interaction.',
    workspacePackage: '@fictjs/slider',
  },
  tabs: {
    exportName: 'Tabs',
    summary: 'Provides tablist, trigger, and panel primitives for compact view switching.',
    workspacePackage: '@fictjs/tabs',
  },
  toggle: {
    exportName: 'Toggle',
    summary: 'Represents a single pressed-state control with button semantics.',
    workspacePackage: '@fictjs/toggle',
  },
  'toggle-group': {
    exportName: 'ToggleGroup',
    summary: 'Coordinates pressed-state items in single or multiple selection models.',
    workspacePackage: '@fictjs/toggle-group',
  },
  form: {
    exportName: 'Form',
    summary:
      'Composes labels, controls, messages, and submit behavior on top of native validity APIs.',
    workspacePackage: '@fictjs/form',
  },
  'one-time-password-field': {
    exportName: 'unstable_OneTimePasswordField',
    summary: 'Splits one-time code entry across slots while preserving a single hidden form value.',
    workspacePackage: '@fictjs/one-time-password-field',
  },
  'password-toggle-field': {
    exportName: 'unstable_PasswordToggleField',
    summary: 'Wraps password visibility state so reveal toggles stay aligned with the input field.',
    workspacePackage: '@fictjs/password-toggle-field',
  },
  'navigation-menu': {
    exportName: 'NavigationMenu',
    summary: 'Renders information-dense navigation with viewport, indicator, and content panels.',
    workspacePackage: '@fictjs/navigation-menu',
  },
  'dropdown-menu': {
    exportName: 'DropdownMenu',
    summary: 'Opens an action menu from a trigger button while preserving menu semantics.',
    workspacePackage: '@fictjs/dropdown-menu',
  },
  'context-menu': {
    exportName: 'ContextMenu',
    summary: 'Uses the same menu model for right-click or context-triggered interaction surfaces.',
    workspacePackage: '@fictjs/context-menu',
  },
  menubar: {
    exportName: 'Menubar',
    summary: 'Keeps top-level application menus persistent and keyboard navigable.',
    workspacePackage: '@fictjs/menubar',
  },
  select: {
    exportName: 'Select',
    summary: 'Coordinates trigger, content, items, and value display for single-choice selection.',
    workspacePackage: '@fictjs/select',
  },
  toolbar: {
    exportName: 'Toolbar',
    summary: 'Creates command strips with roving focus and mixed button, link, and toggle items.',
    workspacePackage: '@fictjs/toolbar',
  },
  dialog: {
    exportName: 'Dialog',
    summary: 'Implements modal and non-modal dialog patterns with focus management and portals.',
    workspacePackage: '@fictjs/dialog',
  },
  'alert-dialog': {
    exportName: 'AlertDialog',
    summary:
      'Specializes dialog behavior for confirmation and destructive flows with safer dismissal.',
    workspacePackage: '@fictjs/alert-dialog',
  },
  popover: {
    exportName: 'Popover',
    summary:
      'Anchors interactive floating content to a trigger while supporting dismissal layering.',
    workspacePackage: '@fictjs/popover',
  },
  'hover-card': {
    exportName: 'HoverCard',
    summary:
      'Shows richer pointer- or focus-driven previews without promoting them to full dialogs.',
    workspacePackage: '@fictjs/hover-card',
  },
  tooltip: {
    exportName: 'Tooltip',
    summary: 'Surfaces terse hint text with provider-managed delay and graceful pointer handling.',
    workspacePackage: '@fictjs/tooltip',
  },
  toast: {
    exportName: 'Toast',
    summary:
      'Mounts transient notifications into a dedicated viewport with action and close affordances.',
    workspacePackage: '@fictjs/toast',
  },
}

const SHOWCASES: ShowcaseDefinition[] = [
  {
    id: 'accessibility-helpers',
    group: 'foundation',
    title: 'Accessibility helpers',
    packages: ['accessible-icon', 'label', 'separator', 'visually-hidden'],
    note: 'Small primitives that carry a disproportionate amount of semantic weight.',
    render: AccessibilityFoundationsShowcase,
  },
  {
    id: 'media-framing',
    group: 'foundation',
    title: 'Media and framing',
    packages: ['aspect-ratio', 'avatar'],
    note: 'Aspect-ratio wrappers and avatar loading/fallback behavior share the same design language.',
    render: AspectAvatarShowcase,
  },
  {
    id: 'slot-portal-direction',
    group: 'foundation',
    title: 'Slot, portal, and direction',
    packages: ['slot', 'portal', 'direction'],
    note: 'Composition primitives stay visible here instead of being hidden behind larger components.',
    render: SlotPortalDirectionShowcase,
  },
  {
    id: 'progress-scroll',
    group: 'foundation',
    title: 'Progress and scroll surfaces',
    packages: ['progress', 'scroll-area'],
    note: 'Progress feedback and custom scrolling are separate packages but often travel together in app shells.',
    render: ProgressScrollShowcase,
  },
  {
    id: 'accordion-collapsible',
    group: 'state',
    title: 'Accordion and collapsible',
    packages: ['accordion', 'collapsible'],
    note: 'Accordion builds on the same core open-state mechanics exposed separately by collapsible.',
    render: AccordionCollapsibleShowcase,
  },
  {
    id: 'tabs',
    group: 'state',
    title: 'Tabs',
    packages: ['tabs'],
    note: 'Tabbed content keeps the controlled-state API familiar while expressing a navigation-specific pattern.',
    render: TabsShowcase,
  },
  {
    id: 'selection-controls',
    group: 'state',
    title: 'Binary, choice, and range controls',
    packages: ['checkbox', 'switch', 'radio-group', 'slider'],
    note: 'These four packages are the control-heavy edge of the library, including hidden form inputs and roving focus.',
    render: SelectionControlsShowcase,
  },
  {
    id: 'toggle-families',
    group: 'state',
    title: 'Toggle families',
    packages: ['toggle', 'toggle-group'],
    note: 'Single toggles and grouped toggles share pressed-state semantics but diverge on selection models.',
    render: ToggleShowcase,
  },
  {
    id: 'form',
    group: 'state',
    title: 'Form composition',
    packages: ['form'],
    note: 'Field, control, label, message, and submit stay composable while exposing built-in validity states.',
    render: FormShowcase,
  },
  {
    id: 'credential-fields',
    group: 'state',
    title: 'Credential fields',
    packages: ['one-time-password-field', 'password-toggle-field'],
    note: 'Purpose-built field packages cover multi-input OTP entry and password visibility controls.',
    render: CredentialFieldsShowcase,
  },
  {
    id: 'navigation-menu',
    group: 'navigation',
    title: 'Navigation menu',
    packages: ['navigation-menu'],
    note: 'Navigation-menu stays the most information-dense package in the public surface, so it gets a wider stage.',
    span: 'wide',
    render: NavigationShowcase,
  },
  {
    id: 'select-dropdown',
    group: 'navigation',
    title: 'Select and dropdown menu',
    packages: ['select', 'dropdown-menu'],
    note: 'Selection menus and action menus differ in semantics, but their layering and keyboard machinery rhyme.',
    render: SelectDropdownShowcase,
  },
  {
    id: 'context-menu',
    group: 'navigation',
    title: 'Context menu',
    packages: ['context-menu'],
    note: 'A right-click surface with the same item model as the rest of the menu family.',
    render: ContextMenuShowcase,
  },
  {
    id: 'menubar-toolbar',
    group: 'navigation',
    title: 'Menubar and toolbar',
    packages: ['menubar', 'toolbar'],
    note: 'Top-level menu triggers and command strips both depend on disciplined focus order.',
    render: MenubarToolbarShowcase,
  },
  {
    id: 'dialog',
    group: 'overlay',
    title: 'Dialog',
    packages: ['dialog'],
    note: 'The standard modal dialog remains the baseline for focus trapping and layered interaction.',
    render: DialogShowcase,
  },
  {
    id: 'alert-dialog',
    group: 'overlay',
    title: 'Alert dialog',
    packages: ['alert-dialog'],
    note: 'Alert-dialog narrows the dismissal model and promotes the cancel action into the primary focus target.',
    render: AlertDialogShowcase,
  },
  {
    id: 'floating-layers',
    group: 'overlay',
    title: 'Popover, hover card, and tooltip',
    packages: ['popover', 'hover-card', 'tooltip'],
    note: 'Three related floating surfaces with different intent: action panel, rich preview, and terse hint.',
    render: FloatingLayersShowcase,
  },
  {
    id: 'toast',
    group: 'overlay',
    title: 'Toast',
    packages: ['toast'],
    note: 'Transient feedback is mounted into a dedicated viewport so it can be verified without leaving the page.',
    render: ToastShowcase,
  },
]

const GROUP_BY_SLUG = Object.fromEntries(GROUPS.map((group) => [group.slug, group])) as Record<
  string,
  GroupDefinition
>

const SHOWCASE_BY_ID = Object.fromEntries(
  SHOWCASES.map((showcase) => [showcase.id, showcase]),
) as Record<string, ShowcaseDefinition>

const PACKAGE_DOCS = Object.fromEntries(
  Object.entries(PACKAGE_META).map(([slug, meta]) => {
    const showcase = SHOWCASES.find((entry) => entry.packages.includes(slug))

    if (!showcase) {
      throw new Error(`Missing showcase for package ${slug}`)
    }

    return [
      slug,
      {
        ...meta,
        slug,
        group: showcase.group,
        showcaseId: showcase.id,
      },
    ]
  }),
) as Record<string, PackageDefinition>

function getGroup(slug: string): GroupDefinition {
  const group = GROUP_BY_SLUG[slug]

  if (!group) {
    throw new Error(`Unknown group ${slug}`)
  }

  return group
}

function getShowcase(id: string): ShowcaseDefinition {
  const showcase = SHOWCASE_BY_ID[id]

  if (!showcase) {
    throw new Error(`Unknown showcase ${id}`)
  }

  return showcase
}

function getPackageDoc(slug: string): PackageDefinition {
  const doc = PACKAGE_DOCS[slug]

  if (!doc) {
    throw new Error(`Unknown package ${slug}`)
  }

  return doc
}

function isGroupRoute(route: Route, slug: string): boolean {
  return route.kind === 'group' && route.slug === slug
}

function isPackageRoute(route: Route, slug: string): boolean {
  return route.kind === 'package' && route.slug === slug
}

function normalizeHash(hash: string): string {
  const raw = hash.replace(/^#/, '')
  const path = (raw || '/overview').split('?')[0]?.trim() || '/overview'
  const normalized = path.startsWith('/') ? path : `/${path}`

  if (normalized === '/') {
    return '/overview'
  }

  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

function parseRoute(hash: string): Route {
  const path = normalizeHash(hash)

  if (path === '/overview') {
    return { kind: 'overview' }
  }

  if (path.startsWith('/group/')) {
    const slug = path.slice('/group/'.length)
    return GROUP_BY_SLUG[slug] ? { kind: 'group', slug } : { kind: 'not-found', slug }
  }

  if (path.startsWith('/package/')) {
    const slug = path.slice('/package/'.length)
    return PACKAGE_DOCS[slug] ? { kind: 'package', slug } : { kind: 'not-found', slug }
  }

  return { kind: 'not-found', slug: path.replace(/^\//, '') }
}

function routeHref(
  route:
    | Exclude<Route, { kind: 'not-found' }>
    | { kind: 'group'; slug: string }
    | { kind: 'package'; slug: string },
): string {
  if (route.kind === 'overview') {
    return '#/overview'
  }

  if (route.kind === 'group') {
    return `#/group/${route.slug}`
  }

  return `#/package/${route.slug}`
}

function pageTitle(route: Route): string {
  if (route.kind === 'overview') {
    return 'Preview Docs Overview'
  }

  if (route.kind === 'group') {
    return getGroup(route.slug).navTitle
  }

  if (route.kind === 'package') {
    return getPackageDoc(route.slug).exportName
  }

  return 'Preview Docs'
}

function routeLabel(route: Route): string {
  if (route.kind === 'overview') {
    return 'Overview'
  }

  if (route.kind === 'group') {
    return getGroup(route.slug).navTitle
  }

  if (route.kind === 'package') {
    return getPackageDoc(route.slug).workspacePackage
  }

  return 'Not found'
}

function matchesQuery(slug: string, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()

  if (normalizedQuery.length === 0) {
    return true
  }

  const doc = getPackageDoc(slug)
  const haystack = `${slug} ${doc.exportName} ${doc.summary} ${doc.workspacePackage}`.toLowerCase()

  return haystack.includes(normalizedQuery)
}

function renderShowcaseCard(showcase: ShowcaseDefinition): FictNode {
  const Showcase = showcase.render

  return (
    <DemoCard
      note={showcase.note}
      packages={showcase.packages}
      span={showcase.span}
      testId={showcase.id}
      title={showcase.title}
    >
      <Showcase />
    </DemoCard>
  )
}

function Breadcrumbs(props: { items: Array<{ label: string; href?: string }> }): FictNode {
  return (
    <nav aria-label="Breadcrumb" class="breadcrumbs">
      {props.items.map((item, index) => (
        <>
          {index > 0 ? <span class="breadcrumb-divider">/</span> : null}
          {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
        </>
      ))}
    </nav>
  )
}

function Sidebar(props: {
  route: () => Route
  query: () => string
  setQuery: (value: string) => void
}): FictNode {
  const currentRoute = () => props.route()
  const matchingCount = () =>
    Object.keys(PACKAGE_DOCS).filter((slug) => matchesQuery(slug, props.query())).length

  return (
    <aside class="docs-sidebar">
      <div class="sidebar-brand">
        <span class="hero-kicker">Workspace Docs</span>
        <strong class="brand-title">Fict UI primitives</strong>
        <p class="sidebar-meta">
          Hash-routed docs and playground pages for every public export in `@fictjs/radix-ui`.
        </p>
      </div>

      <a
        class="sidebar-overview"
        data-active={currentRoute().kind === 'overview' ? 'true' : undefined}
        href={routeHref({ kind: 'overview' })}
      >
        <span>Overview</span>
        <strong>{Object.keys(PACKAGE_DOCS).length}</strong>
      </a>

      <div class="search-shell">
        <label class="field-label" for="package-search">
          Filter packages
        </label>
        <input
          id="package-search"
          class="search-input"
          onInput={(event) => props.setQuery((event.currentTarget as HTMLInputElement).value)}
          placeholder="checkbox, dialog, tooltip..."
          type="search"
          value={props.query()}
        />
        <>{() => <span class="sidebar-hint">{matchingCount()} matching packages</span>}</>
      </div>

      <>
        {() =>
          GROUPS.map((group) => {
            const packages = group.packages.filter((slug) => matchesQuery(slug, props.query()))

            if (packages.length === 0) {
              return null
            }

            return (
              <section class="sidebar-section">
                <div class="sidebar-section-head">
                  <a
                    class="sidebar-group-link"
                    data-active={isGroupRoute(currentRoute(), group.slug) ? 'true' : undefined}
                    href={routeHref({ kind: 'group', slug: group.slug })}
                  >
                    {group.navTitle}
                  </a>
                  <span class="sidebar-count">{packages.length}</span>
                </div>

                <div class="sidebar-link-list">
                  {packages.map((slug) => {
                    const doc = getPackageDoc(slug)
                    return (
                      <a
                        class="sidebar-link"
                        data-active={isPackageRoute(currentRoute(), slug) ? 'true' : undefined}
                        href={routeHref({ kind: 'package', slug })}
                      >
                        <span>{slug}</span>
                        <small>{doc.exportName}</small>
                      </a>
                    )
                  })}
                </div>
              </section>
            )
          })
        }
      </>
    </aside>
  )
}

function OverviewPage(): FictNode {
  return (
    <div class="docs-stack" data-page-kind="overview">
      <section class="page-panel overview-hero">
        <div class="page-header">
          <span class="hero-kicker">Preview Docs</span>
          <h1 class="page-title">Component docs, routing, and live demos in one local site.</h1>
          <p class="page-summary">
            Every public component family exported by `@fictjs/radix-ui` now has an addressable docs
            page under `#/package/...`, plus grouped overview pages under `#/group/...`. Everything
            still renders directly against the local workspace sources.
          </p>
          <div class="hero-actions">
            <a class="primary-button" href={routeHref({ kind: 'group', slug: 'foundation' })}>
              Start with foundation
            </a>
            <a class="ghost-button" href={routeHref({ kind: 'package', slug: 'dialog' })}>
              Open a package page
            </a>
            <code class="command-chip">pnpm preview:dev</code>
          </div>
        </div>

        <div class="overview-metrics">
          <div class="metric-row">
            <strong>{MIRRORED_PACKAGE_COUNT}</strong>
            <span>Workspace packages mirrored from Radix primitives</span>
          </div>
          <div class="metric-row">
            <strong>{Object.keys(PACKAGE_DOCS).length}</strong>
            <span>Public component families with dedicated docs routes</span>
          </div>
          <div class="metric-row">
            <strong>{SHOWCASES.length}</strong>
            <span>Live demo surfaces shared across overview, group, and package pages</span>
          </div>
        </div>
      </section>

      <section class="group-summary-grid">
        {GROUPS.map((group) => (
          <a class="group-summary-card" href={routeHref({ kind: 'group', slug: group.slug })}>
            <span class="catalog-title">{group.navTitle}</span>
            <strong>{group.packages.length} packages</strong>
            <p>{group.summary}</p>
            <div class="catalog-list">
              {group.packages.slice(0, 4).map((slug) => (
                <span class="catalog-pill">{slug}</span>
              ))}
              {group.packages.length > 4 ? (
                <span class="catalog-pill">+{group.packages.length - 4} more</span>
              ) : null}
            </div>
          </a>
        ))}
      </section>

      {GROUPS.map((group) => (
        <Surface detail={group.detail} eyebrow={group.eyebrow} title={group.title}>
          <div class="showcase-grid">
            {SHOWCASES.filter((showcase) => showcase.group === group.slug).map(renderShowcaseCard)}
          </div>
        </Surface>
      ))}
    </div>
  )
}

function GroupPage(props: { group: GroupDefinition }): FictNode {
  return (
    <div class="docs-stack" data-page-kind="group" data-page-slug={props.group.slug}>
      <section class="page-panel">
        <div class="page-header">
          <Breadcrumbs
            items={[
              { href: routeHref({ kind: 'overview' }), label: 'Overview' },
              { label: props.group.navTitle },
            ]}
          />
          <span class="hero-kicker">{props.group.eyebrow}</span>
          <h1 class="page-title">{props.group.title}</h1>
          <p class="page-summary">{props.group.detail}</p>
        </div>

        <div class="facts-grid">
          <div class="fact-card">
            <span>Packages</span>
            <strong>{props.group.packages.length}</strong>
          </div>
          <div class="fact-card">
            <span>Showcases</span>
            <strong>
              {SHOWCASES.filter((showcase) => showcase.group === props.group.slug).length}
            </strong>
          </div>
          <div class="fact-card">
            <span>Section</span>
            <strong>{props.group.navTitle}</strong>
          </div>
        </div>
      </section>

      <section class="page-panel">
        <div class="section-head">
          <span class="catalog-title">Package Directory</span>
          <p class="surface-note">
            Each package page keeps the same live demo surface plus route-specific metadata.
          </p>
        </div>
        <div class="directory-grid">
          {props.group.packages.map((slug) => {
            const doc = getPackageDoc(slug)
            return (
              <a class="package-tile" href={routeHref({ kind: 'package', slug })}>
                <div class="package-tile-title">
                  <h3>{slug}</h3>
                  <span class="mini-pill">{doc.exportName}</span>
                </div>
                <p>{doc.summary}</p>
                <div class="package-meta">
                  <span class="catalog-pill">{doc.workspacePackage}</span>
                </div>
              </a>
            )
          })}
        </div>
      </section>

      <Surface
        detail={`These are the live demo surfaces currently grouped under ${props.group.navTitle}.`}
        eyebrow={props.group.eyebrow}
        title={`Live demos for ${props.group.navTitle}`}
      >
        <div class="showcase-grid">
          {SHOWCASES.filter((showcase) => showcase.group === props.group.slug).map(
            renderShowcaseCard,
          )}
        </div>
      </Surface>
    </div>
  )
}

function PackagePage(props: { doc: PackageDefinition }): FictNode {
  const showcase = getShowcase(props.doc.showcaseId)
  const group = getGroup(props.doc.group)
  const relatedPackages = showcase.packages.filter((slug) => slug !== props.doc.slug)
  const packageIndex = group.packages.indexOf(props.doc.slug)
  const previousPackage = packageIndex > 0 ? group.packages[packageIndex - 1] : undefined
  const nextPackage =
    packageIndex >= 0 && packageIndex < group.packages.length - 1
      ? group.packages[packageIndex + 1]
      : undefined

  return (
    <div class="docs-stack" data-page-kind="package" data-page-slug={props.doc.slug}>
      <section class="page-panel">
        <div class="page-header">
          <Breadcrumbs
            items={[
              { href: routeHref({ kind: 'overview' }), label: 'Overview' },
              { href: routeHref({ kind: 'group', slug: group.slug }), label: group.navTitle },
              { label: props.doc.slug },
            ]}
          />
          <span class="hero-kicker">{group.navTitle}</span>
          <h1 class="page-title">{props.doc.slug}</h1>
          <p class="page-summary">{props.doc.summary}</p>
        </div>

        <div class="facts-grid">
          <div class="fact-card">
            <span>Export</span>
            <strong>{props.doc.exportName}</strong>
          </div>
          <div class="fact-card">
            <span>Workspace package</span>
            <strong>{props.doc.workspacePackage}</strong>
          </div>
          <div class="fact-card">
            <span>Shared demo</span>
            <strong>{showcase.title}</strong>
          </div>
        </div>
      </section>

      <div class="detail-layout">
        <div class="detail-main">
          <section class="detail-card">
            <div class="section-head">
              <span class="catalog-title">Live Demo</span>
              <p class="surface-note">
                {relatedPackages.length > 0
                  ? `This package is previewed on a shared surface with ${relatedPackages.join(', ')}.`
                  : 'This package has a dedicated demo surface in the preview site.'}
              </p>
            </div>
            {renderShowcaseCard(showcase)}
          </section>
        </div>

        <aside class="detail-rail">
          <section class="detail-card">
            <div class="section-head">
              <span class="catalog-title">Package Facts</span>
            </div>
            <ul class="detail-list">
              <li>Docs route: `{routeHref({ kind: 'package', slug: props.doc.slug })}`</li>
              <li>Section: {group.navTitle}</li>
              <li>Preview source: `packages/{props.doc.slug}`</li>
            </ul>
          </section>

          <section class="detail-card">
            <div class="section-head">
              <span class="catalog-title">Related Routes</span>
            </div>
            <div class="link-list">
              <a
                class="sidebar-link route-link"
                href={routeHref({ kind: 'group', slug: group.slug })}
              >
                <span>{group.navTitle} section</span>
                <small>{group.packages.length} packages</small>
              </a>
              {relatedPackages.map((slug) => (
                <a class="sidebar-link route-link" href={routeHref({ kind: 'package', slug })}>
                  <span>{slug}</span>
                  <small>{getPackageDoc(slug).exportName}</small>
                </a>
              ))}
              {previousPackage ? (
                <a
                  class="sidebar-link route-link"
                  href={routeHref({ kind: 'package', slug: previousPackage })}
                >
                  <span>Previous: {previousPackage}</span>
                  <small>{getPackageDoc(previousPackage).exportName}</small>
                </a>
              ) : null}
              {nextPackage ? (
                <a
                  class="sidebar-link route-link"
                  href={routeHref({ kind: 'package', slug: nextPackage })}
                >
                  <span>Next: {nextPackage}</span>
                  <small>{getPackageDoc(nextPackage).exportName}</small>
                </a>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function NotFoundPage(props: { slug: string }): FictNode {
  return (
    <section class="page-panel not-found-panel" data-page-kind="not-found">
      <div class="page-header">
        <Breadcrumbs
          items={[
            { href: routeHref({ kind: 'overview' }), label: 'Overview' },
            { label: 'Not found' },
          ]}
        />
        <span class="hero-kicker">Missing Route</span>
        <h1 class="page-title">No preview route for `{props.slug}`.</h1>
        <p class="page-summary">
          Use the sidebar to jump to a known group or package page. The overview route still
          contains the full interactive matrix.
        </p>
      </div>
      <div class="hero-actions">
        <a class="primary-button" href={routeHref({ kind: 'overview' })}>
          Back to overview
        </a>
      </div>
    </section>
  )
}

export default function App(): FictNode {
  const route = createSignal<Route>(
    parseRoute(typeof window === 'undefined' ? '#/overview' : window.location.hash),
  )
  const query = createSignal('')

  onMount(() => {
    if (typeof window === 'undefined') {
      return
    }

    const sync = () => route(parseRoute(window.location.hash))

    sync()
    window.addEventListener('hashchange', sync)

    onCleanup(() => window.removeEventListener('hashchange', sync))
  })

  createEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `Fict UI Primitives Preview · ${pageTitle(route())}`
    }

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  })

  const renderCurrentPage = () => {
    const currentRoute = route()

    if (currentRoute.kind === 'overview') {
      return <OverviewPage />
    }

    if (currentRoute.kind === 'group') {
      return <GroupPage group={getGroup(currentRoute.slug)} />
    }

    if (currentRoute.kind === 'package') {
      return <PackagePage doc={getPackageDoc(currentRoute.slug)} />
    }

    return <NotFoundPage slug={currentRoute.slug} />
  }

  return (
    <div class="page-shell">
      <a class="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div class="ambient ambient-left" />
      <div class="ambient ambient-right" />

      <div class="docs-layout">
        <Sidebar query={query} route={route} setQuery={query} />

        <div class="docs-main-shell">
          <>
            {() => {
              const currentRoute = route()

              return (
                <header class="docs-topbar">
                  <div class="topbar-copy">
                    <span class="hero-kicker">Current Route</span>
                    <strong class="topbar-title">{routeLabel(currentRoute)}</strong>
                  </div>

                  <div class="topbar-links">
                    <a
                      class="topbar-link"
                      data-active={currentRoute.kind === 'overview' ? 'true' : undefined}
                      href={routeHref({ kind: 'overview' })}
                    >
                      Overview
                    </a>
                    {GROUPS.map((group) => (
                      <a
                        class="topbar-link"
                        data-active={isGroupRoute(currentRoute, group.slug) ? 'true' : undefined}
                        href={routeHref({ kind: 'group', slug: group.slug })}
                      >
                        {group.navTitle}
                      </a>
                    ))}
                    <code class="command-chip">pnpm preview:dev</code>
                  </div>
                </header>
              )
            }}
          </>

          <main class="docs-main" id="main-content">
            <>{() => renderCurrentPage()}</>
          </main>
        </div>
      </div>
    </div>
  )
}
