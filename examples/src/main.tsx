import type { FictNode } from '@fictjs/runtime'
import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import {
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxRoot,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  ToastProvider,
  ToastViewport,
  useToast,
} from '@fictjs/ui-primitives'

interface SectionProps {
  title: string
  description: string
  children?: FictNode
}

function Section(props: SectionProps): FictNode {
  return (
    <section class="panel card">
      <header class="panel-head">
        <h2>{props.title}</h2>
        <p>{props.description}</p>
      </header>
      <div class="panel-body">{props.children}</div>
    </section>
  )
}

function ToastLauncher(): FictNode {
  const toast = useToast()

  return (
    <button
      type="button"
      class="button"
      data-testid="toast-trigger"
      onClick={() => {
        toast.show({
          title: 'Build queued',
          description: 'Screenshot baseline generation started.',
          duration: 3000,
        })
      }}
    >
      Push toast
    </button>
  )
}

function App(): FictNode {
  const activeTab = createSignal('tokens')
  const flavor = createSignal('starter')

  return (
    <main class="demo" data-testid="demo-ready">
      <section class="hero card">
        <p class="kicker">Fict UI Primitives</p>
        <h1>Executable Component Playground</h1>
        <p class="lede">
          This page runs real primitives in one place for behavior checks, demos, and screenshot baselines.
        </p>
      </section>

      <div class="grid">
        <Section
          title="Overlay"
          description="Dialog with focus, dismiss, and title/description wiring"
        >
          <DialogRoot>
            <DialogTrigger class="button" data-testid="dialog-trigger">
              Open dialog
            </DialogTrigger>
            <DialogOverlay class="dialog-overlay" data-testid="dialog-overlay" />
            <DialogContent class="dialog-content" data-testid="dialog-content">
              <DialogTitle>Release checklist</DialogTitle>
              <DialogDescription>
                Validate tests, docs, and screenshots before publishing.
              </DialogDescription>
              <div class="row">
                <DialogClose class="button secondary">Close</DialogClose>
              </div>
            </DialogContent>
          </DialogRoot>
        </Section>

        <Section title="Menu" description="Dropdown menu with actionable items and roving focus">
          <DropdownMenuRoot>
            <DropdownMenuTrigger class="button" data-testid="menu-trigger">
              Open menu
            </DropdownMenuTrigger>
            <DropdownMenuContent class="menu-content" data-testid="menu-content" side="bottom" align="start">
              <DropdownMenuItem class="menu-item">Duplicate</DropdownMenuItem>
              <DropdownMenuItem class="menu-item">Move to archive</DropdownMenuItem>
              <DropdownMenuItem class="menu-item">Share link</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
        </Section>

        <Section title="Disclosure" description="Controlled tabs for view switching">
          <TabsRoot value={() => activeTab()} onValueChange={next => activeTab(next)}>
            <TabsList class="tabs-list">
              <TabsTrigger class="tab-trigger" value="tokens">
                Tokens
              </TabsTrigger>
              <TabsTrigger class="tab-trigger" value="qa" data-testid="tab-qa-trigger">
                QA
              </TabsTrigger>
            </TabsList>
            <TabsContent class="tab-panel" value="tokens">
              Design tokens are synchronized across packages.
            </TabsContent>
            <TabsContent class="tab-panel" value="qa">
              QA checks include keyboard flow, aria states, and dismissal semantics.
            </TabsContent>
          </TabsRoot>
        </Section>

        <Section title="Form" description="Select, combobox, and semantic field relationships">
          <div class="stack">
            <SelectRoot value={() => flavor()} onValueChange={next => flavor(next)}>
              <SelectTrigger class="button secondary">
                <SelectValue placeholder="Choose plan" />
              </SelectTrigger>
              <SelectContent class="select-content">
                <SelectItem class="select-item" value="starter">
                  Starter
                </SelectItem>
                <SelectItem class="select-item" value="pro">
                  Pro
                </SelectItem>
                <SelectItem class="select-item" value="enterprise">
                  Enterprise
                </SelectItem>
              </SelectContent>
            </SelectRoot>

            <ComboboxRoot>
              <ComboboxInput class="input" placeholder="Search teammate" />
              <ComboboxList class="combo-list">
                <ComboboxItem class="combo-item" value="Alice">
                  Alice
                </ComboboxItem>
                <ComboboxItem class="combo-item" value="Bob">
                  Bob
                </ComboboxItem>
                <ComboboxItem class="combo-item" value="Celine">
                  Celine
                </ComboboxItem>
              </ComboboxList>
            </ComboboxRoot>

            <Form>
              <FormField name="email">
                <FormLabel class="label">Release email</FormLabel>
                <FormControl as="input" class="input" type="email" value="maintainer@fict.dev" />
                <FormDescription class="hint">Used for release notifications only.</FormDescription>
                <FormMessage class="message">Example validation message surface.</FormMessage>
              </FormField>
            </Form>
          </div>
        </Section>
      </div>

      <ToastProvider duration={3500}>
        <section class="toast-zone card">
          <h2>Feedback</h2>
          <p>Trigger a toast and verify live-region behavior.</p>
          <ToastLauncher />
        </section>
        <ToastViewport class="toast-viewport" />
      </ToastProvider>
    </main>
  )
}

const root = document.querySelector('#app')
if (!(root instanceof HTMLElement)) {
  throw new Error('Missing #app mount point')
}

render(() => <App />, root)
