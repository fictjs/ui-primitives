import type { FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import {
  Accordion as AccordionUI,
  Checkbox as CheckboxUI,
  Dialog as DialogUI,
  DropdownMenu as DropdownMenuUI,
  NavigationMenu as NavigationMenuUI,
  Select as SelectUI,
  Slider as SliderUI,
  Switch as SwitchUI,
  Tabs as TabsUI,
  Toast as ToastUI,
} from '@fictjs/radix-ui'

const packageGroups = [
  {
    title: 'Overlays',
    items: ['dialog', 'alert-dialog', 'popover', 'hover-card', 'toast', 'tooltip'],
  },
  {
    title: 'Menus',
    items: ['menu', 'dropdown-menu', 'context-menu', 'menubar', 'navigation-menu', 'select'],
  },
  {
    title: 'Controls',
    items: ['accordion', 'checkbox', 'switch', 'slider', 'radio-group', 'tabs', 'toolbar'],
  },
  {
    title: 'Foundations',
    items: ['portal', 'presence', 'primitive', 'slot', 'separator', 'visually-hidden'],
  },
]

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
                Core utilities stay small while higher-order pieces such as dialog,
                select, and menubar are composed from the same internal building blocks.
              </p>
            </article>
            <div class="mini-grid">
              <div class="mini-tile">
                <strong>59</strong>
                <span>upstream-equivalent packages</span>
              </div>
              <div class="mini-tile">
                <strong>2</strong>
                <span>Fict extras</span>
              </div>
            </div>
          </NavigationMenuUI.Content>
        </NavigationMenuUI.Item>
        <NavigationMenuUI.Item value="workflow">
          <NavigationMenuUI.Trigger class="nav-trigger">Workflow</NavigationMenuUI.Trigger>
          <NavigationMenuUI.Content class="nav-panel">
            <article>
              <span class="mini-kicker">Iteration</span>
              <h3>Use this site while editing the workspace</h3>
              <p>
                The preview app points at the local packages so visual checks and API checks
                can live next to the implementation work.
              </p>
            </article>
            <a class="inline-cta" href="#lab">
              Jump to the lab
            </a>
          </NavigationMenuUI.Content>
        </NavigationMenuUI.Item>
      </NavigationMenuUI.List>
      <NavigationMenuUI.Indicator class="nav-indicator">•</NavigationMenuUI.Indicator>
      <NavigationMenuUI.Viewport class="nav-viewport" />
    </NavigationMenuUI.Root>
  )
}

function AccordionShowcase(): FictNode {
  return (
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
          Dialog, hover-card, popover, and toast all use the same portal/presence spine.
        </AccordionUI.Content>
      </AccordionUI.Item>
      <AccordionUI.Item class="stack-item" value="signals">
        <AccordionUI.Header>
          <AccordionUI.Trigger class="stack-trigger">Signal-friendly state</AccordionUI.Trigger>
        </AccordionUI.Header>
        <AccordionUI.Content class="stack-content">
          Controlled and uncontrolled flows map cleanly onto Fict accessors and setters.
        </AccordionUI.Content>
      </AccordionUI.Item>
    </AccordionUI.Root>
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
        Roles, labels, focus movement, dismiss behaviors, and hidden content are carried over.
      </TabsUI.Content>
      <TabsUI.Content class="tabs-panel" value="testing">
        Every replicated package landed with docs plus package-level tests before being committed.
      </TabsUI.Content>
    </TabsUI.Root>
  )
}

function SelectShowcase(): FictNode {
  const lane = createSignal('beta')

  return (
    <div class="select-stack">
      <SelectUI.Root value={lane} onValueChange={lane}>
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
      <p class="surface-note">Current lane: {lane()}</p>
    </div>
  )
}

function OverlayShowcase(): FictNode {
  return (
    <div class="overlay-stack">
      <DialogUI.Root>
        <DialogUI.Trigger class="primary-button">Open release dialog</DialogUI.Trigger>
        <DialogUI.Portal>
          <DialogUI.Overlay class="dialog-overlay" />
          <DialogUI.Content class="dialog-content">
            <DialogUI.Title>Ship a primitive with confidence</DialogUI.Title>
            <DialogUI.Description>
              Start from the local package, verify the README and tests, and finish with a
              clean build before cutting the commit.
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

      <div class="hint-row">
        <DropdownMenuUI.Root>
          <DropdownMenuUI.Trigger class="chip-button">Open actions</DropdownMenuUI.Trigger>
          <DropdownMenuUI.Content class="menu-card">
            <DropdownMenuUI.Item class="menu-item">Open package README</DropdownMenuUI.Item>
            <DropdownMenuUI.Item class="menu-item">Run focused tests</DropdownMenuUI.Item>
            <DropdownMenuUI.Item class="menu-item">Build current package</DropdownMenuUI.Item>
          </DropdownMenuUI.Content>
        </DropdownMenuUI.Root>

        <p class="surface-note">
          Menus share the same low-level dismissal and focus machinery used by dialog and select.
        </p>
      </div>
    </div>
  )
}

function ControlsShowcase(): FictNode {
  const checkbox = createSignal<boolean | 'indeterminate'>(true)
  const notifications = createSignal(true)
  const density = createSignal([42])

  return (
    <div class="controls-grid">
      <div class="control-block">
        <label class="control-label">Checkbox</label>
        <div class="toggle-row">
          <CheckboxUI.Root
            checked={checkbox}
            onCheckedChange={checkbox}
            class="checkbox-root"
            aria-label="Enable previews"
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
            checked={notifications}
            onCheckedChange={notifications}
            class="switch-root"
            aria-label="Enable release notifications"
          >
            <SwitchUI.Thumb class="switch-thumb" />
          </SwitchUI.Root>
          <span class="control-copy">
            Notifications {notifications() ? 'active' : 'muted'}
          </span>
        </div>
      </div>

      <div class="control-block control-slider-block">
        <label class="control-label">Slider</label>
        <SliderUI.Root
          class="slider-root"
          max={100}
          step={1}
          value={density}
          onValueChange={density}
          aria-label="Preview density"
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

function ToastShowcase(): FictNode {
  const open = createSignal(false)

  return (
    <ToastUI.Provider duration={2600}>
      <div class="toast-launch">
        <button class="primary-button" onClick={() => open(true)}>
          Queue toast
        </button>
        <p class="surface-note">Launches a local workspace release notification.</p>
      </div>
      <ToastUI.Viewport class="toast-viewport" />
      <ToastUI.Root class="toast-root" open={open} onOpenChange={open}>
        <ToastUI.Title class="toast-title">Preview site ready</ToastUI.Title>
        <ToastUI.Description class="toast-description">
          Local demos are now reading from the current `ui-primitives` workspace.
        </ToastUI.Description>
        <div class="toast-actions">
          <ToastUI.Action class="chip-button" altText="Open the preview section">
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
          <h1>Fict UI primitives, in a browsable lab.</h1>
          <p class="hero-summary">
            This page is a live preview shell for the replicated Radix-style package set inside
            `ui-primitives`, wired against the local workspace instead of a published bundle.
          </p>
          <div class="hero-actions">
            <a class="primary-button" href="#lab">
              Explore demos
            </a>
            <code class="command-chip">pnpm preview:dev</code>
          </div>
        </div>

        <aside class="hero-panel">
          <div class="metric-row">
            <strong>59</strong>
            <span>React-equivalent packages mirrored from Radix</span>
          </div>
          <div class="metric-row">
            <strong>2</strong>
            <span>Fict support packages added on top: `core-primitive`, `rect`</span>
          </div>
          <div class="metric-row">
            <strong>1</strong>
            <span>Aggregate entry: `@fictjs/radix-ui` with public and internal exports</span>
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
          eyebrow="Navigation"
          title="Menu surfaces"
          detail="Start with the upper-level navigation pieces that orchestrate larger information architecture."
        >
          <div class="dual-grid">
            <NavigationShowcase />
            <AccordionShowcase />
          </div>
        </Surface>

        <Surface
          eyebrow="Selection"
          title="Switch panels, lanes, and content"
          detail="Tabs and select both hinge on controlled state while exposing different interaction models."
        >
          <div class="dual-grid">
            <TabsShowcase />
            <SelectShowcase />
          </div>
        </Surface>

        <Surface
          eyebrow="Overlay"
          title="Dialog and menu layering"
          detail="Portal-backed surfaces can be checked together in one place, including modal focus trapping and menu dismissal."
        >
          <OverlayShowcase />
        </Surface>

        <Surface
          eyebrow="Controls"
          title="Binary and range inputs"
          detail="Checkbox, switch, and slider expose the lower-level control contracts used throughout the package set."
        >
          <ControlsShowcase />
        </Surface>

        <Surface
          eyebrow="Feedback"
          title="Toast delivery"
          detail="The notification stack is mounted in a dedicated viewport so transient events can be checked without leaving the page."
        >
          <ToastShowcase />
        </Surface>
      </main>
    </div>
  )
}
