/** @jsxImportSource fict */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { onMount, prop, render } from 'fict'
import { createSignal } from 'fict/advanced'
import * as PublicHelpers from '@fictjs/radix-ui-themes/helpers'

import {
  Avatar,
  Badge,
  Blockquote,
  Box,
  Button,
  Callout,
  Card,
  CheckboxGroup,
  Code,
  Container,
  ContextMenu,
  DropdownMenu,
  Em,
  IconButton,
  Inset,
  Kbd,
  Link,
  Popover,
  Progress,
  Quote,
  ScrollArea,
  Select,
  Section,
  Skeleton,
  Spinner,
  Strong,
  TabNav,
  Table,
  Text,
  TextField,
  Theme,
  ThemePanel,
  Tooltip,
} from '../src/index.js'
import { extractProps, readPropValue } from '../src/helpers/extract-props.js'
import { classNames } from '../src/helpers/reactive-class-names.js'

type ResponsiveBoolean =
  | boolean
  | Partial<Record<'initial' | 'xs' | 'sm' | 'md' | 'lg' | 'xl', boolean>>

const responsiveBooleanPropDefs = {
  active: {
    type: 'boolean',
    className: 'is-active',
    default: true,
    responsive: true,
  },
} as const

function ResponsiveBooleanProbe(props: { active?: ResponsiveBoolean; 'data-testid'?: string }) {
  const { className, ...probeProps } = extractProps(props, responsiveBooleanPropDefs)
  return <div {...probeProps} class={classNames('responsive-boolean-probe', className)} />
}

const OriginalImage = window.Image
const resizeObservers: MockResizeObserver[] = []

class MockResizeObserver {
  readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    resizeObservers.push(this)
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}

  trigger(): void {
    this.callback([], this as unknown as ResizeObserver)
  }
}

class MockImage extends EventTarget {
  protected currentSrc = ''

  get src(): string {
    return this.currentSrc
  }

  set src(src: string) {
    this.currentSrc = src
    window.setTimeout(() => {
      this.dispatchEvent(new Event('load'))
    }, 0)
  }
}

class MockErrorImage extends MockImage {
  override get src(): string {
    return this.currentSrc
  }

  override set src(src: string) {
    this.currentSrc = src
    window.setTimeout(() => {
      this.dispatchEvent(new Event('error'))
    }, 0)
  }
}

function click(target: Element): void {
  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerType: 'mouse',
    }),
  )
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

function rightClick(target: Element): void {
  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 2,
      pointerType: 'mouse',
    }),
  )
  target.dispatchEvent(
    new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      button: 2,
    }),
  )
}

function keydown(target: EventTarget, key: string): void {
  const eventTarget =
    target instanceof Document ? (target.body ?? target.documentElement ?? target) : target

  eventTarget.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
    }),
  )
}

async function flushEffects(cycles = 6): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  for (let index = 0; index < cycles; index++) {
    await new Promise<void>((resolve) => {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(resolve)
        return
      }

      Promise.resolve().then(resolve)
    })
  }
}

describe('@fictjs/radix-ui-themes', () => {
  const cleanups: Array<() => void> = []

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
    document.body.innerHTML = ''
    window.Image = OriginalImage
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  it('preserves the established public helper contract', () => {
    expect(PublicHelpers).not.toHaveProperty('classNames')
    expect(PublicHelpers.extractProps).toBeTypeOf('function')
    expect(PublicHelpers.readPropValue).toBeTypeOf('function')
  })

  it('applies root and nested theme data attributes', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme accentColor="ruby" radius="large">
          <Button>Outer</Button>
          <Theme accentColor="blue" scaling="110%">
            <Button>Inner</Button>
          </Theme>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const themes = Array.from(container.querySelectorAll('.radix-themes'))
    expect(themes).toHaveLength(2)
    expect(themes[0]?.getAttribute('data-accent-color')).toBe('ruby')
    expect(themes[0]?.getAttribute('data-radius')).toBe('large')
    expect(themes[1]?.getAttribute('data-accent-color')).toBe('blue')
    expect(themes[1]?.getAttribute('data-scaling')).toBe('110%')
    expect(container.textContent).toContain('Outer')
    expect(container.textContent).toContain('Inner')
  })

  it('updates theme data attributes from getter-backed props', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const accentColor = createSignal<'ruby' | 'blue'>('ruby')

    mount(
      () => (
        <Theme accentColor={prop(() => accentColor()) as unknown as 'ruby'}>
          <Button>Action</Button>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const theme = container.querySelector('.radix-themes')
    expect(theme?.getAttribute('data-accent-color')).toBe('ruby')

    accentColor('blue')
    await flushEffects()
    expect(theme?.getAttribute('data-accent-color')).toBe('blue')
  })

  it('preserves getter-backed DOM props through extractProps wrappers', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const label = createSignal('first')

    mount(
      () => (
        <Theme>
          <Text
            as="span"
            data-testid="reactive-text"
            aria-label={prop(() => label()) as unknown as string}
          >
            Label
          </Text>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const text = container.querySelector('[data-testid="reactive-text"]')
    expect(text?.getAttribute('aria-label')).toBe('first')

    label('second')
    await flushEffects()
    expect(text?.getAttribute('aria-label')).toBe('second')
  })

  it('does not enumerate non-enumerable props when extracting props', () => {
    const props: { visible: string; hidden?: string } = { visible: 'forwarded' }
    Object.defineProperty(props, 'hidden', {
      configurable: true,
      enumerable: false,
      value: 'internal',
    })

    const extractedProps = extractProps(props)

    expect(Object.getOwnPropertyDescriptor(extractedProps, 'hidden')?.enumerable).toBe(false)
    expect({ ...extractedProps }).not.toHaveProperty('hidden')
    expect({ ...extractedProps }).toHaveProperty('visible')
  })

  it('updates propDef enum classes without replacing the mounted control', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const size = createSignal<'1' | '3'>('1')

    mount(
      () => (
        <Theme>
          <Button data-testid="reactive-size-button" size={prop(() => size()) as unknown as '1'}>
            Action
          </Button>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const button = container.querySelector(
      '[data-testid="reactive-size-button"]',
    ) as HTMLButtonElement
    expect(button.classList.contains('rt-r-size-1')).toBe(true)

    button.focus()
    size('3')
    await flushEffects()

    const updatedButton = container.querySelector('[data-testid="reactive-size-button"]')
    expect(updatedButton).toBe(button)
    expect(button.classList.contains('rt-r-size-1')).toBe(false)
    expect(button.classList.contains('rt-r-size-3')).toBe(true)
    expect(document.activeElement).toBe(button)
  })

  it('updates forwarded propDef color and radius data attributes', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const color = createSignal<'ruby' | 'blue'>('ruby')
    const radius = createSignal<'small' | 'large'>('small')

    mount(
      () => (
        <Theme>
          <Badge
            data-testid="reactive-badge"
            color={prop(() => color()) as unknown as 'ruby'}
            radius={prop(() => radius()) as unknown as 'small'}
          >
            Status
          </Badge>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const badge = container.querySelector('[data-testid="reactive-badge"]')
    expect(badge?.getAttribute('data-accent-color')).toBe('ruby')
    expect(badge?.getAttribute('data-radius')).toBe('small')

    color('blue')
    radius('large')
    await flushEffects()

    expect(badge?.getAttribute('data-accent-color')).toBe('blue')
    expect(badge?.getAttribute('data-radius')).toBe('large')
  })

  it('updates arbitrary and responsive propDef styles', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const margin = createSignal<string | { initial?: string; md?: string }>('12px')

    mount(
      () => (
        <Theme>
          <Box data-testid="reactive-margin-box" m={prop(() => margin()) as unknown as '12px'}>
            Content
          </Box>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const box = container.querySelector('[data-testid="reactive-margin-box"]') as HTMLElement
    expect(box.classList.contains('rt-r-m')).toBe(true)
    expect(box.style.getPropertyValue('--m')).toBe('12px')

    margin({ initial: '4', md: '20px' })
    await flushEffects()

    expect(box.classList.contains('rt-r-m')).toBe(false)
    expect(box.classList.contains('rt-r-m-4')).toBe(true)
    expect(box.classList.contains('md:rt-r-m')).toBe(true)
    expect(box.style.getPropertyValue('--m')).toBe('')
    expect(box.style.getPropertyValue('--m-md')).toBe('20px')
  })

  it('updates nested callout text and table layout classes', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const calloutSize = createSignal<'1' | '3'>('1')
    const tableLayout = createSignal<'auto' | { md: 'fixed' }>('auto')

    mount(
      () => (
        <Theme>
          <Callout.Root
            data-testid="reactive-callout"
            size={prop(() => calloutSize()) as unknown as '1'}
          >
            <Callout.Text>Notice</Callout.Text>
          </Callout.Root>
          <Table.Root
            data-testid="reactive-table"
            layout={prop(() => tableLayout()) as unknown as 'auto'}
          >
            <Table.Body>
              <Table.Row>
                <Table.Cell>Cell</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const callout = container.querySelector('[data-testid="reactive-callout"]') as HTMLElement
    const calloutText = callout.querySelector('.rt-CalloutText') as HTMLElement
    const table = container.querySelector('.rt-TableRootTable') as HTMLElement
    expect(callout.classList.contains('rt-r-size-1')).toBe(true)
    expect(calloutText.classList.contains('rt-r-size-2')).toBe(true)
    expect(table.classList.contains('rt-r-tl-auto')).toBe(true)

    calloutSize('3')
    tableLayout({ md: 'fixed' })
    await flushEffects()

    expect(callout.classList.contains('rt-r-size-3')).toBe(true)
    expect(calloutText.classList.contains('rt-r-size-3')).toBe(true)
    expect(table.classList.contains('rt-r-tl-auto')).toBe(false)
    expect(table.classList.contains('md:rt-r-tl-fixed')).toBe(true)
  })

  it('keeps a loading button spinner in sync with its responsive size', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const size = createSignal<'1' | '4'>('1')

    mount(
      () => (
        <Theme>
          <Button loading size={prop(() => size()) as unknown as '1'}>
            Action
          </Button>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const button = container.querySelector('.rt-Button') as HTMLButtonElement
    const spinner = button.querySelector('.rt-Spinner') as HTMLElement
    expect(spinner.classList.contains('rt-r-size-1')).toBe(true)

    size('4')
    await flushEffects()

    expect(container.querySelector('.rt-Button')).toBe(button)
    expect(spinner.classList.contains('rt-r-size-3')).toBe(true)
  })

  it('keeps an explicitly undefined progress value in determinate mode', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Progress data-testid="determinate-progress" duration="1s" value={undefined} />
          <Progress data-testid="indeterminate-progress" duration="1s" />
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const determinate = container.querySelector(
      '[data-testid="determinate-progress"]',
    ) as HTMLElement
    const indeterminate = container.querySelector(
      '[data-testid="indeterminate-progress"]',
    ) as HTMLElement
    expect(determinate.style.getPropertyValue('--progress-duration')).toBe('')
    expect(determinate.style.getPropertyValue('--progress-value')).toBe('')
    expect(indeterminate.style.getPropertyValue('--progress-duration')).toBe('1s')
  })

  it('retains state and focus across styling prop updates', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const size = createSignal<'1' | '3'>('1')

    mount(
      () => (
        <Theme>
          <TextField.Root
            data-testid="reactive-text-field"
            defaultValue="initial"
            size={prop(() => size()) as unknown as '1'}
          />
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const input = container.querySelector('[data-testid="reactive-text-field"]') as HTMLInputElement
    const root = input.parentElement as HTMLElement
    input.value = 'edited'
    input.focus()

    size('3')
    await flushEffects()

    expect(container.querySelector('[data-testid="reactive-text-field"]')).toBe(input)
    expect(input.value).toBe('edited')
    expect(root.classList.contains('rt-r-size-3')).toBe(true)
    expect(document.activeElement).toBe(input)
  })

  it('updates responsive boolean classes including initial defaults', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const initialValue: ResponsiveBoolean = { md: true }
    const active = createSignal<ResponsiveBoolean>(initialValue)

    mount(
      () => (
        <ResponsiveBooleanProbe
          data-testid="responsive-boolean"
          active={prop(() => active()) as unknown as boolean}
        />
      ),
      container,
    )

    await flushEffects()

    const probe = container.querySelector('[data-testid="responsive-boolean"]') as HTMLElement
    expect(initialValue).toEqual({ md: true })
    expect(probe.classList.contains('is-active')).toBe(true)
    expect(probe.classList.contains('md:is-active')).toBe(true)

    active({ initial: false, sm: true })
    await flushEffects()

    expect(probe.classList.contains('is-active')).toBe(false)
    expect(probe.classList.contains('md:is-active')).toBe(false)
    expect(probe.classList.contains('sm:is-active')).toBe(true)

    active({})
    await flushEffects()

    expect(probe.classList.contains('is-active')).toBe(true)
    expect(probe.classList.contains('sm:is-active')).toBe(false)
  })

  it('resolves structural as and asChild accessors without treating getters as tags', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const tag = createSignal<'div' | 'span'>('div')
    const asChild = createSignal(false)

    mount(
      () => (
        <Theme>
          <Box data-testid="reactive-tag" as={prop(() => tag()) as unknown as 'div'}>
            Tag
          </Box>
          <Box
            data-testid="reactive-as-child"
            asChild={prop(() => asChild()) as unknown as boolean}
          >
            <button type="button">Child</button>
          </Box>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const tagRoot = container.querySelector('[data-testid="reactive-tag"]')
    const asChildRoot = container.querySelector('[data-testid="reactive-as-child"]')
    expect(tagRoot?.tagName).toBe('DIV')
    expect(asChildRoot?.tagName).toBe('DIV')

    tag('span')
    asChild(true)
    await flushEffects()

    expect(container.querySelector('[data-testid="reactive-tag"]')).toBe(tagRoot)
    expect(container.querySelector('[data-testid="reactive-as-child"]')).toBe(asChildRoot)
  })

  it('invokes the latest getter-backed event handler', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const first = vi.fn()
    const second = vi.fn()
    const handler = createSignal<(event: MouseEvent) => void>(first)

    mount(
      () => (
        <Theme>
          <Button data-testid="latest-handler" onClick={prop(() => handler())}>
            Action
          </Button>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const button = container.querySelector('[data-testid="latest-handler"]') as HTMLButtonElement
    click(button)
    expect(first).toHaveBeenCalledTimes(1)

    handler(second)
    click(button)

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('updates a getter-backed select placeholder propDef', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const placeholder = createSignal('Choose one')

    mount(
      () => (
        <Theme>
          <Select.Root>
            <Select.Trigger placeholder={prop(() => placeholder()) as unknown as string} />
          </Select.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const trigger = container.querySelector('.rt-SelectTrigger') as HTMLElement
    expect(trigger.textContent).toContain('Choose one')

    placeholder('Pick an option')
    await flushEffects()

    expect(trigger.textContent).toContain('Pick an option')
  })

  it('keeps local render props lazy and distinguishes ordinary callbacks', () => {
    const child = createSignal('first')
    const renderCallback = vi.fn(() => 'rendered')
    const extractedProps = extractProps({
      children: prop(() => child()),
      content: renderCallback,
    })

    expect(renderCallback).not.toHaveBeenCalled()
    expect(readPropValue(extractedProps.children)).toBe('first')
    expect(readPropValue(extractedProps.content)).toBe(renderCallback)
    expect(renderCallback).not.toHaveBeenCalled()

    child('second')
    expect(readPropValue(extractedProps.children)).toBe('second')
    expect(readPropValue(extractedProps.content)).toBe(renderCallback)
  })

  it('keeps local loading structure synchronous while render props stay reactive', async () => {
    const skeletonLoading = createSignal(true)
    const skeletonChild = createSignal('Skeleton first')
    const spinnerLoading = createSignal(true)
    const buttonLoading = createSignal(false)
    const tooltipContent = createSignal('Tooltip first')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Skeleton loading={prop(() => skeletonLoading()) as unknown as boolean}>
            {prop(() => skeletonChild()) as unknown as string}
          </Skeleton>
          <Spinner loading={prop(() => spinnerLoading()) as unknown as boolean}>
            Spinner content
          </Spinner>
          <Button
            data-testid="reactive-loading-button"
            loading={prop(() => buttonLoading()) as unknown as boolean}
          >
            Button content
          </Button>
          <Tooltip open content={prop(() => tooltipContent()) as unknown as string}>
            <button data-testid="reactive-tooltip-trigger" type="button">
              Trigger
            </button>
          </Tooltip>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const button = container.querySelector(
      '[data-testid="reactive-loading-button"]',
    ) as HTMLButtonElement
    const tooltipText = document.body.querySelector('.rt-TooltipText') as HTMLElement
    expect(container.querySelector('.rt-Skeleton')?.textContent).toBe('Skeleton first')
    expect(container.querySelector('.rt-Spinner')).not.toBeNull()
    expect(button.querySelector('.rt-Spinner')).toBeNull()
    expect(tooltipText.textContent).toBe('Tooltip first')

    skeletonLoading(false)
    skeletonChild('Skeleton second')
    spinnerLoading(false)
    buttonLoading(true)
    tooltipContent('Tooltip second')
    await flushEffects()

    expect(container.querySelector('.rt-Skeleton')?.textContent).toBe('Skeleton second')
    expect(container.querySelector('.rt-Spinner')).not.toBeNull()
    expect(button.querySelector('.rt-Spinner')).not.toBeNull()
    expect(container.querySelector('[data-testid="reactive-loading-button"]')).toBe(button)
    expect(document.body.querySelector('.rt-TooltipText')).toBe(tooltipText)
    expect(tooltipText.textContent).toBe('Tooltip second')

    skeletonLoading(true)
    spinnerLoading(true)
    buttonLoading(false)
    tooltipContent('Tooltip third')
    await flushEffects()

    expect(container.querySelector('.rt-Skeleton')?.textContent).toBe('Skeleton second')
    expect(container.querySelectorAll('.rt-Spinner')).toHaveLength(1)
    expect(button.querySelector('.rt-Spinner')).toBeNull()
    expect(container.querySelector('[data-testid="reactive-loading-button"]')).toBe(button)
    expect(document.body.querySelector('.rt-TooltipText')).toBe(tooltipText)
    expect(tooltipText.textContent).toBe('Tooltip third')
  })

  it('mounts the themed tooltip trigger synchronously while its DOM props stay reactive', async () => {
    const label = createSignal('First trigger')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Tooltip open content="Tooltip content">
            <button data-label={prop(() => label()) as unknown as string} type="button">
              Trigger
            </button>
          </Tooltip>
        </Theme>
      ),
      container,
    )

    await flushEffects()
    const trigger = container.querySelector('button')
    expect(trigger?.getAttribute('data-label')).toBe('First trigger')

    label('Second trigger')
    await flushEffects()

    expect(container.querySelector('button')).toBe(trigger)
    expect(trigger?.getAttribute('data-label')).toBe('Second trigger')
  })

  it('mounts synchronous loading branches only after their DOM is connected', () => {
    const mountedWhileConnected: boolean[] = []
    const container = document.createElement('div')
    document.body.append(container)

    const Probe = (props: { id: string }) => {
      let node: HTMLButtonElement | null = null

      onMount(() => {
        mountedWhileConnected.push(node?.isConnected ?? false)
      })

      return (
        <button
          ref={(nextNode) => {
            node = nextNode
          }}
          data-testid={props.id}
          type="button"
        >
          Ready
        </button>
      )
    }

    mount(
      () => [
        <Skeleton loading={false}>
          <Probe id="skeleton-ready" />
        </Skeleton>,
        <Spinner loading={false}>
          <Probe id="spinner-ready" />
        </Spinner>,
        <Skeleton loading>
          <Probe id="skeleton-loading" />
        </Skeleton>,
        <Spinner loading>
          <Probe id="spinner-loading" />
        </Spinner>,
      ],
      container,
    )

    expect(container.querySelector('[data-testid="skeleton-ready"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="spinner-ready"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="skeleton-loading"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="spinner-loading"]')).not.toBeNull()
    expect(mountedWhileConnected).toEqual([true, true, true, true])
  })

  it('mounts synchronous VNode children in the target owner document', () => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const iframeDocument = iframe.contentDocument!
    const container = iframeDocument.createElement('div')
    iframeDocument.body.append(container)
    const mountedState: Array<{ connected: boolean; ownerDocument: Document | null }> = []

    const Probe = (props: { id: string }) => {
      let node: HTMLButtonElement | null = null

      onMount(() => {
        mountedState.push({
          connected: node?.isConnected ?? false,
          ownerDocument: node?.ownerDocument ?? null,
        })
      })

      return (
        <button
          ref={(nextNode) => {
            node = nextNode
          }}
          data-testid={props.id}
          type="button"
        >
          Ready
        </button>
      )
    }

    mount(
      () => [
        <Card>
          <Probe id="iframe-card" />
        </Card>,
        <Spinner loading>
          <Probe id="iframe-spinner" />
        </Spinner>,
      ],
      container,
    )

    expect(container.querySelector('[data-testid="iframe-card"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="iframe-spinner"]')).not.toBeNull()
    expect(mountedState).toEqual([
      { connected: true, ownerDocument: iframeDocument },
      { connected: true, ownerDocument: iframeDocument },
    ])
  })

  it('updates an errored avatar fallback without replacing its root', async () => {
    window.Image = MockErrorImage as unknown as typeof window.Image
    const fallback = createSignal('AB')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Avatar
            alt="User avatar"
            fallback={prop(() => fallback()) as unknown as string}
            src="/api/reactive-missing-avatar"
          />
        </Theme>
      ),
      container,
    )

    await flushEffects()
    await flushEffects()

    const root = container.querySelector('.rt-AvatarRoot')
    const fallbackElement = container.querySelector('.rt-AvatarFallback')
    expect(fallbackElement?.textContent).toBe('AB')
    expect(fallbackElement?.classList.contains('rt-two-letters')).toBe(true)

    fallback('C')
    await flushEffects()

    expect(container.querySelector('.rt-AvatarRoot')).toBe(root)
    expect(container.querySelector('.rt-AvatarFallback')).toBe(fallbackElement)
    expect(fallbackElement?.textContent).toBe('C')
    expect(fallbackElement?.classList.contains('rt-one-letter')).toBe(true)
  })

  it('renders avatar fallback content without an image source', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Avatar fallback="AB" />
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const fallback = container.querySelector('.rt-AvatarFallback')
    expect(fallback?.textContent).toBe('AB')
    expect(container.querySelector('.rt-AvatarImage')).toBeNull()
  })

  it('renders avatar image only after the source loads', async () => {
    window.Image = MockImage as unknown as typeof window.Image
    const onLoadingStatusChange = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Avatar
            alt="User avatar"
            fallback="AB"
            onLoadingStatusChange={onLoadingStatusChange}
            src="/api/avatar"
          />
        </Theme>
      ),
      container,
    )

    await flushEffects()
    await flushEffects()

    const image = container.querySelector('.rt-AvatarImage')
    expect(image?.getAttribute('src')).toBe('/api/avatar')
    expect(image?.getAttribute('alt')).toBe('User avatar')
    expect(container.textContent).not.toContain('AB')
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith('loaded')
  })

  it('forwards avatar image load errors from the preload image', async () => {
    window.Image = MockErrorImage as unknown as typeof window.Image
    const onError = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Avatar alt="User avatar" fallback="AB" onError={onError} src="/api/missing-avatar" />
        </Theme>
      ),
      container,
    )

    await flushEffects()
    await flushEffects()

    expect(container.querySelector('.rt-AvatarImage')).toBeNull()
    expect(container.querySelector('.rt-AvatarFallback')?.textContent).toBe('AB')
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('applies skeleton props to element children without adding a wrapper', async () => {
    const ref = { current: null as Element | null }
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Skeleton ref={ref}>
          <div data-testid="skeleton-child">
            <span>Submit</span>
          </div>
        </Skeleton>
      ),
      container,
    )

    await flushEffects()

    const child = container.querySelector('[data-testid="skeleton-child"]')
    expect(container.firstElementChild).toBe(child)
    expect(child?.classList.contains('rt-Skeleton')).toBe(true)
    expect(child?.getAttribute('aria-hidden')).not.toBeNull()
    expect(ref.current).toBe(child)
  })

  it('wraps painted form controls so the real control can be hidden', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Skeleton>
          <Button data-testid="skeleton-button">Submit</Button>
        </Skeleton>
      ),
      container,
    )

    await flushEffects()

    const wrapper = container.firstElementChild
    const button = container.querySelector('[data-testid="skeleton-button"]')
    expect(wrapper?.tagName).toBe('SPAN')
    expect(wrapper).not.toBe(button)
    expect(wrapper?.classList.contains('rt-Skeleton')).toBe(true)
    expect(button?.closest('.rt-Skeleton')).toBe(wrapper)
  })

  it('wraps replaced skeleton children so the painted element can be hidden', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Skeleton>
          <img alt="" data-testid="skeleton-image" src="/avatar.png" />
        </Skeleton>
      ),
      container,
    )

    await flushEffects()

    const wrapper = container.firstElementChild
    const image = container.querySelector('[data-testid="skeleton-image"]')
    expect(wrapper?.tagName).toBe('SPAN')
    expect(wrapper).not.toBe(image)
    expect(wrapper?.classList.contains('rt-Skeleton')).toBe(true)
  })

  it('updates checkbox group values through themed items', async () => {
    const onValueChange = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <CheckboxGroup.Root defaultValue={['alpha']} onValueChange={onValueChange}>
            <CheckboxGroup.Item value="alpha">Alpha</CheckboxGroup.Item>
            <CheckboxGroup.Item value="beta">Beta</CheckboxGroup.Item>
          </CheckboxGroup.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const checkboxes = Array.from(container.querySelectorAll('button[role="checkbox"]'))
    expect(checkboxes).toHaveLength(2)

    click(checkboxes[1] as HTMLButtonElement)
    await flushEffects()
    expect(onValueChange).toHaveBeenLastCalledWith(['alpha', 'beta'])

    expect((checkboxes[0] as HTMLButtonElement).getAttribute('aria-checked')).toBe('true')
  })

  it('updates themed checkbox items from a controlled getter-backed value', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const value = createSignal<string[]>(['alpha'])

    mount(
      () => (
        <Theme>
          <CheckboxGroup.Root value={prop(() => value())}>
            <CheckboxGroup.Item value="alpha">Alpha</CheckboxGroup.Item>
            <CheckboxGroup.Item value="beta">Beta</CheckboxGroup.Item>
          </CheckboxGroup.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const checkboxes = Array.from(container.querySelectorAll('button[role="checkbox"]'))
    expect(checkboxes.map((checkbox) => checkbox.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
    ])

    value(['beta'])
    await flushEffects()
    expect(checkboxes.map((checkbox) => checkbox.getAttribute('aria-checked'))).toEqual([
      'false',
      'true',
    ])
  })

  it('renders select content with themed scroll viewport classes', async () => {
    resizeObservers.length = 0
    vi.stubGlobal('ResizeObserver', MockResizeObserver)

    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Select.Root defaultValue="apple" defaultOpen>
            <Select.Trigger />
            <Select.Content position="popper">
              <Select.Item value="apple">Apple</Select.Item>
              <Select.Item value="orange">Orange</Select.Item>
            </Select.Content>
          </Select.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const content = document.body.querySelector('.rt-SelectContent')
    expect(content).not.toBeNull()
    expect(content?.querySelector('.rt-ScrollAreaRoot')).not.toBeNull()
    expect(content?.querySelector('.rt-SelectViewport')).not.toBeNull()
    const viewport = content?.querySelector('.rt-ScrollAreaViewport') as HTMLDivElement | null
    expect(viewport).not.toBeNull()

    Object.defineProperties(viewport, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 400 },
    })
    resizeObservers.forEach((observer) => observer.trigger())
    await flushEffects()

    const scrollbar = content?.querySelector(
      '.rt-ScrollAreaScrollbar.rt-r-size-1',
    ) as HTMLDivElement | null
    expect(scrollbar).not.toBeNull()

    Object.defineProperty(scrollbar, 'clientHeight', { configurable: true, value: 80 })
    resizeObservers.forEach((observer) => observer.trigger())
    await flushEffects()

    expect(content?.querySelector('.rt-ScrollAreaThumb')).not.toBeNull()
  })

  it('forwards direction to the themed scroll area root', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <ScrollArea dir="rtl">Scrollable content</ScrollArea>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    expect(container.querySelector('.rt-ScrollAreaRoot')?.getAttribute('dir')).toBe('rtl')
  })

  it('forwards visibility settings to the themed scroll area root', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <ScrollArea type="always" scrollHideDelay={120} scrollbars="horizontal">
            Scrollable content
          </ScrollArea>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const viewport = container.querySelector('.rt-ScrollAreaViewport')
    expect(viewport?.hasAttribute('type')).toBe(false)
    expect(viewport?.hasAttribute('scrollhidedelay')).toBe(false)
    expect(
      container
        .querySelector('.rt-ScrollAreaScrollbar[data-orientation="horizontal"]')
        ?.getAttribute('data-state'),
    ).toBe('visible')
  })

  it('updates themed scroll area presentation and root props without replacing its structure', async () => {
    const asChild = createSignal(false)
    const className = createSignal('scroll-first')
    const margin = createSignal<'1' | '3'>('1')
    const style = createSignal<Record<string, string>>({ color: 'red' })
    const size = createSignal<'1' | '3'>('1')
    const radius = createSignal<'small' | 'large'>('small')
    const scrollbars = createSignal<'vertical' | 'horizontal' | 'both'>('vertical')
    const dir = createSignal<'ltr' | 'rtl'>('ltr')
    const type = createSignal<'always' | 'hover'>('always')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <ScrollArea
            asChild={prop(() => asChild()) as unknown as boolean}
            aria-label="Reactive scroll area"
            className={prop(() => className()) as unknown as string}
            dir={prop(() => dir()) as unknown as 'ltr'}
            m={prop(() => margin()) as unknown as '1'}
            radius={prop(() => radius()) as unknown as 'small'}
            scrollbars={prop(() => scrollbars()) as unknown as 'vertical'}
            size={prop(() => size()) as unknown as '1'}
            style={prop(() => style()) as unknown as Record<string, string>}
            type={prop(() => type()) as unknown as 'always'}
          >
            <section data-testid="scroll-area-child">
              <span>Scrollable content</span>
            </section>
          </ScrollArea>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const root = container.querySelector('.rt-ScrollAreaRoot') as HTMLElement
    let viewport = root.querySelector('.rt-ScrollAreaViewport') as HTMLElement
    const verticalScrollbar = root.querySelector(
      '.rt-ScrollAreaScrollbar[data-orientation="vertical"]',
    ) as HTMLElement
    expect(root.tagName).toBe('DIV')
    expect(root.classList.contains('scroll-first')).toBe(true)
    expect(root.classList.contains('rt-r-m-1')).toBe(true)
    expect(root.style.color).toBe('red')
    expect(root.getAttribute('dir')).toBe('ltr')
    expect(verticalScrollbar.classList.contains('rt-r-size-1')).toBe(true)
    expect(verticalScrollbar.getAttribute('data-radius')).toBe('small')
    expect(root.querySelector('[data-orientation="horizontal"]')).toBeNull()
    expect(viewport.getAttribute('aria-label')).toBe('Reactive scroll area')
    expect(viewport.hasAttribute('dir')).toBe(false)
    expect(viewport.hasAttribute('type')).toBe(false)

    className('scroll-second')
    margin('3')
    style({ color: 'blue' })
    size('3')
    radius('large')
    scrollbars('both')
    dir('rtl')
    await flushEffects()

    expect(container.querySelector('.rt-ScrollAreaRoot')).toBe(root)
    expect(root.classList.contains('scroll-first')).toBe(false)
    expect(root.classList.contains('scroll-second')).toBe(true)
    expect(root.classList.contains('rt-r-m-1')).toBe(false)
    expect(root.classList.contains('rt-r-m-3')).toBe(true)
    expect(root.style.color).toBe('blue')
    expect(root.getAttribute('dir')).toBe('rtl')
    const scrollbarsAfterUpdate = Array.from(
      root.querySelectorAll('.rt-ScrollAreaScrollbar'),
    ) as HTMLElement[]
    expect(scrollbarsAfterUpdate).toHaveLength(1)
    expect(scrollbarsAfterUpdate.every((node) => node.classList.contains('rt-r-size-3'))).toBe(true)
    expect(
      scrollbarsAfterUpdate.every((node) => node.getAttribute('data-radius') === 'large'),
    ).toBe(true)
    type('hover')
    await flushEffects()
    expect(root.querySelector('.rt-ScrollAreaScrollbar')).toBeNull()

    type('always')
    scrollbars('horizontal')
    await flushEffects()
    expect(root.querySelector('[data-orientation="vertical"]')).not.toBeNull()
    expect(root.querySelector('[data-orientation="horizontal"]')).toBeNull()

    asChild(true)
    await flushEffects()

    expect(container.querySelector('.rt-ScrollAreaRoot')).toBe(root)
    viewport = root.querySelector('.rt-ScrollAreaViewport') as HTMLElement
    expect(root.tagName).toBe('DIV')
    expect(viewport.querySelector('[data-testid="scroll-area-child"]')).not.toBeNull()
    expect(viewport.textContent).toContain('Scrollable content')

    asChild(false)
    await flushEffects()
    expect(container.querySelector('.rt-ScrollAreaRoot')).toBe(root)
  })

  it('uses the latest themed scroll area hide delay', async () => {
    const delay = createSignal(120)
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <ScrollArea
            scrollHideDelay={prop(() => delay()) as unknown as number}
            scrollbars="vertical"
            type="scroll"
          >
            Scrollable content
          </ScrollArea>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const viewport = container.querySelector('.rt-ScrollAreaViewport') as HTMLElement
    Object.defineProperties(viewport, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, value: 0, writable: true },
    })
    const timeoutSpy = vi
      .spyOn(window, 'setTimeout')
      .mockImplementation(() => 1 as unknown as ReturnType<typeof window.setTimeout>)

    viewport.scrollTop = 1
    viewport.dispatchEvent(new Event('scroll'))
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100)

    delay(360)
    const scrollEnd = timeoutSpy.mock.calls[0]?.[0]
    expect(typeof scrollEnd).toBe('function')
    if (typeof scrollEnd === 'function') scrollEnd()

    expect(timeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 360)
  })

  it('renders themed select default value while content is closed', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    function FruitItemsDemo() {
      return (
        <>
          <Select.Group>
            <Select.Label>Fruits</Select.Label>
            <Select.Item value="orange">Orange</Select.Item>
            <Select.Item value="apple">Apple</Select.Item>
          </Select.Group>
        </>
      )
    }

    mount(
      () => (
        <Theme>
          <Select.Root defaultValue="apple">
            <Select.Trigger />
            <Select.Content>
              <FruitItemsDemo />
            </Select.Content>
          </Select.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    expect(document.body.querySelector('.rt-SelectContent')).toBeNull()
    expect(container.querySelector('.rt-SelectTrigger')?.textContent).toContain('Apple')
  })

  it('updates a themed select from a controlled getter-backed value', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const value = createSignal('apple')

    mount(
      () => (
        <Theme>
          <Select.Root value={prop(() => value())}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="apple">Apple</Select.Item>
              <Select.Item value="orange">Orange</Select.Item>
            </Select.Content>
          </Select.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const trigger = container.querySelector('.rt-SelectTrigger')
    expect(trigger?.textContent).toContain('Apple')

    value('orange')
    await flushEffects()
    expect(trigger?.textContent).toContain('Orange')
  })

  it('copies a theme snippet from the theme panel', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme accentColor="teal" radius="large">
          <ThemePanel defaultOpen />
        </Theme>
      ),
      container,
    )

    await flushEffects()

    expect(container.querySelector('.rt-ThemePanelShortcut')).not.toBeNull()
    expect(container.querySelectorAll('.rt-ThemePanelSwatch').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.rt-ThemePanelSwatchInput').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.rt-ThemePanelRadioCard').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.rt-ThemePanelRadioCardInput').length).toBeGreaterThan(0)

    const buttons = Array.from(container.querySelectorAll('button'))
    const copyButton = buttons.find((button) => button.textContent === 'Copy Theme')
    expect(copyButton).not.toBeUndefined()

    click(copyButton as HTMLButtonElement)
    await flushEffects()
    await flushEffects()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      '<Theme accentColor="teal" radius="large">',
    )
  })

  it('updates the root theme from the theme panel controls', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme accentColor="teal">
          <ThemePanel defaultOpen />
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const rootTheme = container.querySelector('.radix-themes[data-is-root-theme="true"]')
    const blueInput = Array.from(
      container.querySelectorAll<HTMLInputElement>('.rt-ThemePanelSwatchInput'),
    ).find((input) => input.value === 'blue')

    expect(rootTheme?.getAttribute('data-accent-color')).toBe('teal')
    expect(blueInput).not.toBeUndefined()

    blueInput?.click()
    await flushEffects()
    expect(rootTheme?.getAttribute('data-accent-color')).toBe('blue')
  })

  it('renders only the active tab nav link with the active attribute', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const current = createSignal('account')

    mount(
      () => (
        <Theme>
          <TabNav.Root size="1">
            <TabNav.Link href="/account" active={() => current() === 'account'}>
              Account
            </TabNav.Link>
            <TabNav.Link asChild active={() => current() === 'documents'}>
              <a href="/documents">Documents</a>
            </TabNav.Link>
          </TabNav.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const root = container.querySelector('.rt-TabNavRoot')
    const links = Array.from(container.querySelectorAll('.rt-TabNavLink'))

    expect(root).not.toBeNull()
    expect(links).toHaveLength(2)
    expect(root?.querySelectorAll('.rt-TabNavLink[data-active]')).toHaveLength(1)
    expect(links[0]?.getAttribute('data-active')).toBe('')
    expect(links[1]?.hasAttribute('data-active')).toBe(false)

    current('documents')
    await flushEffects()

    expect(root?.querySelectorAll('.rt-TabNavLink[data-active]')).toHaveLength(1)
    expect(links[0]?.hasAttribute('data-active')).toBe(false)
    expect(links[1]?.getAttribute('data-active')).toBe('')
  })

  it('updates getter-backed DOM props through themed buttons', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const expanded = createSignal(false)

    mount(
      () => (
        <Theme>
          <Button
            data-testid="getter-button"
            aria-expanded={prop(() => (expanded() ? 'true' : 'false'))}
          >
            Toggle
          </Button>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const button = container.querySelector('[data-testid="getter-button"]') as HTMLButtonElement
    expect(button.getAttribute('aria-expanded')).toBe('false')

    expanded(true)
    await flushEffects()
    expect(button.getAttribute('aria-expanded')).toBe('true')

    expanded(false)
    await flushEffects()
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('updates themed button classes and children without replacing controls', async () => {
    const buttonClassName = createSignal('button-first')
    const buttonChildren = createSignal('Button first')
    const iconClassName = createSignal('icon-first')
    const iconChildren = createSignal('Icon first')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Button
            data-testid="reactive-button-presentation"
            className={prop(() => buttonClassName()) as unknown as string}
          >
            {prop(() => buttonChildren()) as unknown as string}
          </Button>
          <IconButton
            aria-label="Icon action"
            data-testid="reactive-icon-presentation"
            className={prop(() => iconClassName()) as unknown as string}
          >
            {prop(() => iconChildren()) as unknown as string}
          </IconButton>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const button = container.querySelector(
      '[data-testid="reactive-button-presentation"]',
    ) as HTMLButtonElement
    const iconButton = container.querySelector(
      '[data-testid="reactive-icon-presentation"]',
    ) as HTMLButtonElement
    expect(button.classList.contains('button-first')).toBe(true)
    expect(button.textContent).toBe('Button first')
    expect(iconButton.classList.contains('icon-first')).toBe(true)
    expect(iconButton.textContent).toBe('Icon first')

    button.focus()
    buttonClassName('button-second')
    buttonChildren('Button second')
    iconClassName('icon-second')
    iconChildren('Icon second')
    await flushEffects()

    expect(container.querySelector('[data-testid="reactive-button-presentation"]')).toBe(button)
    expect(container.querySelector('[data-testid="reactive-icon-presentation"]')).toBe(iconButton)
    expect(button.classList.contains('button-first')).toBe(false)
    expect(button.classList.contains('button-second')).toBe(true)
    expect(button.textContent).toBe('Button second')
    expect(iconButton.classList.contains('icon-first')).toBe(false)
    expect(iconButton.classList.contains('icon-second')).toBe(true)
    expect(iconButton.textContent).toBe('Icon second')
    expect(document.activeElement).toBe(button)
  })

  it('renders slotted themed children through asChild wrappers', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Card asChild>
            <a data-testid="card-child" href="#card">
              Card
            </a>
          </Card>
          <Button asChild>
            <a data-testid="button-child" href="#button">
              Action
            </a>
          </Button>
          <IconButton asChild>
            <button data-testid="icon-button-child" type="button" aria-label="Open">
              +
            </button>
          </IconButton>
          <Link asChild>
            <button data-testid="link-child" type="button">
              Link
            </button>
          </Link>
          <Kbd asChild>
            <button data-testid="kbd-child" type="button">
              Enter
            </button>
          </Kbd>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const card = container.querySelector('[data-testid="card-child"]')
    const button = container.querySelector('[data-testid="button-child"]')
    const iconButton = container.querySelector('[data-testid="icon-button-child"]')
    const link = container.querySelector('[data-testid="link-child"]')
    const kbd = container.querySelector('[data-testid="kbd-child"]')

    expect(card?.textContent).toBe('Card')
    expect(card?.className).toContain('rt-Card')
    expect(button?.textContent).toBe('Action')
    expect(button?.className).toContain('rt-BaseButton')
    expect(iconButton?.getAttribute('aria-label')).toBe('Open')
    expect(iconButton?.className).toContain('rt-IconButton')
    expect(link?.textContent).toBe('Link')
    expect(link?.className).toContain('rt-Text')
    expect(kbd?.textContent).toBe('Enter')
    expect(kbd?.className).toContain('rt-Kbd')
  })

  it('resolves getter-backed asChild props synchronously across themed consumers', async () => {
    const asChild = createSignal(true)
    const dynamicAsChild = prop(() => asChild()) as unknown as boolean
    const avatarRef = { current: null as Element | null }
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Badge asChild={dynamicAsChild}>
            <button data-testid="dynamic-badge" type="button">
              Badge
            </button>
          </Badge>
          <Card asChild={dynamicAsChild}>
            <article data-testid="dynamic-card">Card</article>
          </Card>
          <Callout.Root asChild={dynamicAsChild}>
            <aside data-testid="dynamic-callout">
              <Callout.Text>Callout</Callout.Text>
            </aside>
          </Callout.Root>
          <Container asChild={dynamicAsChild}>
            <main data-testid="dynamic-container">Container</main>
          </Container>
          <Code asChild={dynamicAsChild}>
            <button data-testid="dynamic-code" type="button">
              Code
            </button>
          </Code>
          <Em asChild={dynamicAsChild}>
            <span data-testid="dynamic-em">Em</span>
          </Em>
          <Inset asChild={dynamicAsChild}>
            <article data-testid="dynamic-inset">Inset</article>
          </Inset>
          <Kbd asChild={dynamicAsChild}>
            <button data-testid="dynamic-kbd" type="button">
              Kbd
            </button>
          </Kbd>
          <Quote asChild={dynamicAsChild}>
            <span data-testid="dynamic-quote">Quote</span>
          </Quote>
          <Section asChild={dynamicAsChild}>
            <article data-testid="dynamic-section">Section</article>
          </Section>
          <Strong asChild={dynamicAsChild}>
            <span data-testid="dynamic-strong">Strong</span>
          </Strong>
          <Link asChild={dynamicAsChild}>
            <button data-testid="dynamic-link" type="button">
              Link
            </button>
          </Link>
          <Avatar ref={avatarRef} asChild={dynamicAsChild} fallback="A">
            <span data-testid="dynamic-avatar">Avatar</span>
          </Avatar>
          <Button asChild={dynamicAsChild}>
            <a data-testid="dynamic-button" href="#dynamic-button">
              Button
            </a>
          </Button>
          <Blockquote asChild={dynamicAsChild}>
            <div data-testid="dynamic-blockquote">Blockquote</div>
          </Blockquote>
          <TabNav.Root>
            <TabNav.Link asChild={dynamicAsChild} active>
              <button data-testid="dynamic-tab-nav" type="button">
                Tab nav
              </button>
            </TabNav.Link>
          </TabNav.Root>
          <Theme asChild={dynamicAsChild} accentColor="blue">
            <main data-testid="dynamic-theme">
              <Badge>Nested theme</Badge>
            </main>
          </Theme>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const themedChildren = [
      ['dynamic-badge', 'rt-Badge'],
      ['dynamic-card', 'rt-Card'],
      ['dynamic-callout', 'rt-CalloutRoot'],
      ['dynamic-container', 'rt-Container'],
      ['dynamic-code', 'rt-Code'],
      ['dynamic-em', 'rt-Em'],
      ['dynamic-inset', 'rt-Inset'],
      ['dynamic-kbd', 'rt-Kbd'],
      ['dynamic-quote', 'rt-Quote'],
      ['dynamic-section', 'rt-Section'],
      ['dynamic-strong', 'rt-Strong'],
      ['dynamic-link', 'rt-Link'],
      ['dynamic-avatar', 'rt-AvatarRoot'],
      ['dynamic-button', 'rt-BaseButton'],
      ['dynamic-blockquote', 'rt-Blockquote'],
      ['dynamic-tab-nav', 'rt-TabNavLink'],
      ['dynamic-theme', 'radix-themes'],
    ] as const

    const initialRoots = new Map<string, Element>()
    for (const [testId, className] of themedChildren) {
      const child = container.querySelector(`[data-testid="${testId}"]`)
      expect(child, `${testId} should render as the slotted root`).not.toBeNull()
      expect(
        child?.classList.contains(className),
        `${testId} should receive themed classes: ${child?.outerHTML}`,
      ).toBe(true)
      initialRoots.set(testId, child!)
    }
    expect(
      container.querySelector('[data-testid="dynamic-theme"]')?.getAttribute('data-accent-color'),
    ).toBe('blue')
    expect(avatarRef.current).toBe(container.querySelector('[data-testid="dynamic-avatar"]'))

    asChild(false)
    await flushEffects()

    for (const [testId, className] of themedChildren) {
      const child = container.querySelector(`[data-testid="${testId}"]`)
      expect(child, `${testId} should keep its initial root`).toBe(initialRoots.get(testId))
      expect(child?.classList.contains(className), `${testId} should remain slotted`).toBe(true)
    }
    expect(avatarRef.current).toBe(initialRoots.get('dynamic-avatar'))
  })

  it('mounts accessor-backed asChild descendants after their wrapper is connected', async () => {
    const asChild = createSignal(false)
    const mountedWhileConnected: boolean[] = []
    const container = document.createElement('div')
    document.body.append(container)
    let child: HTMLButtonElement | null = null

    const Child = () => {
      onMount(() => {
        mountedWhileConnected.push(child?.isConnected ?? false)
      })

      return (
        <button
          ref={(node) => {
            child = node
          }}
          type="button"
        >
          Child
        </button>
      )
    }

    mount(
      () => (
        <Card asChild={prop(() => asChild()) as unknown as boolean}>
          <Child />
        </Card>
      ),
      container,
    )

    const mountedChild = container.querySelector('button') as HTMLButtonElement
    const wrapper = mountedChild.parentElement
    expect(wrapper?.classList.contains('rt-Card')).toBe(true)
    expect(mountedWhileConnected).toEqual([true])

    asChild(true)
    await flushEffects()

    expect(mountedChild.parentElement).toBe(wrapper)
    expect(mountedWhileConnected).toEqual([true])
  })

  it('closes themed popover content when the trigger is pressed again', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Popover.Root>
            <Popover.Trigger>
              <Button data-testid="popover-trigger">Toggle</Button>
            </Popover.Trigger>
            <Popover.Content data-testid="popover-content">
              <Button>Inside</Button>
            </Popover.Content>
          </Popover.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const trigger = container.querySelector('[data-testid="popover-trigger"]') as HTMLButtonElement
    expect(trigger).not.toBeNull()

    click(trigger)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="popover-content"]')).not.toBeNull()

    const nextTrigger = container.querySelector(
      '[data-testid="popover-trigger"]',
    ) as HTMLButtonElement
    click(nextTrigger)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="popover-content"]')).toBeNull()
  })

  it('closes themed popover content with a plain trigger child', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Popover.Root>
            <Popover.Trigger>
              <button data-testid="plain-popover-trigger" type="button">
                Toggle
              </button>
            </Popover.Trigger>
            <Popover.Content data-testid="plain-popover-content">Content</Popover.Content>
          </Popover.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const trigger = container.querySelector(
      '[data-testid="plain-popover-trigger"]',
    ) as HTMLButtonElement

    click(trigger)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="plain-popover-content"]')).not.toBeNull()

    click(trigger)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="plain-popover-content"]')).toBeNull()
  })

  it('invokes themed popover trigger state changes once per click', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(false)
    const changes: boolean[] = []

    mount(
      () => (
        <Theme>
          <Popover.Root
            open={open}
            onOpenChange={(nextOpen) => {
              changes.push(nextOpen)
              open(nextOpen)
            }}
          >
            <Popover.Trigger>
              <Button data-testid="controlled-popover-trigger">Toggle</Button>
            </Popover.Trigger>
            <Popover.Content data-testid="controlled-popover-content">Content</Popover.Content>
          </Popover.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const trigger = container.querySelector(
      '[data-testid="controlled-popover-trigger"]',
    ) as HTMLButtonElement

    click(trigger)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="controlled-popover-content"]')).not.toBeNull()
    const nextTrigger = container.querySelector(
      '[data-testid="controlled-popover-trigger"]',
    ) as HTMLButtonElement
    click(nextTrigger)
    await flushEffects()

    expect(changes).toEqual([true, false])
    expect(container.querySelectorAll('[data-testid="controlled-popover-trigger"]')).toHaveLength(1)
    const finalTrigger = container.querySelector(
      '[data-testid="controlled-popover-trigger"]',
    ) as HTMLButtonElement
    expect(finalTrigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('reopens themed dropdown menu content from the same trigger after closing with escape', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button data-testid="dropdown-trigger">Open</Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content data-testid="dropdown-content">
              <DropdownMenu.Item data-testid="dropdown-item">Item</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const trigger = container.querySelector('[data-testid="dropdown-trigger"]') as HTMLButtonElement
    expect(trigger).not.toBeNull()

    click(trigger)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="dropdown-content"]')).not.toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('data-state')).toBe('open')

    keydown(document, 'Escape')
    await flushEffects()
    expect(document.body.querySelector('[data-testid="dropdown-content"]')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('data-state')).toBe('closed')

    const nextTrigger = container.querySelector(
      '[data-testid="dropdown-trigger"]',
    ) as HTMLButtonElement
    expect(nextTrigger).toBe(trigger)
    click(nextTrigger)
    await flushEffects()

    expect(document.body.querySelector('[data-testid="dropdown-content"]')).not.toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('data-state')).toBe('open')
    expect(container.querySelector('[data-testid="dropdown-trigger"]')).toBe(trigger)
  })

  it('preserves themed menu radio group classes', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <DropdownMenu.Root defaultOpen>
            <DropdownMenu.Trigger>
              <Button data-testid="dropdown-radio-trigger">Open</Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.RadioGroup className="custom-radio-group" value="one">
                <DropdownMenu.RadioItem value="one">One</DropdownMenu.RadioItem>
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <ContextMenu.Root>
            <ContextMenu.Trigger>
              <div data-testid="context-radio-trigger">Area</div>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
              <ContextMenu.RadioGroup className="custom-radio-group" value="one">
                <ContextMenu.RadioItem value="one">One</ContextMenu.RadioItem>
              </ContextMenu.RadioGroup>
            </ContextMenu.Content>
          </ContextMenu.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const dropdownGroup = document.body.querySelector('.rt-DropdownMenuRadioGroup')
    expect(dropdownGroup).not.toBeNull()
    expect(dropdownGroup?.className).toContain('rt-BaseMenuRadioGroup')
    expect(dropdownGroup?.className).toContain('custom-radio-group')

    const contextTrigger = container.querySelector('[data-testid="context-radio-trigger"]')
    expect(contextTrigger).not.toBeNull()

    rightClick(contextTrigger as Element)
    await flushEffects()

    const contextGroup = document.body.querySelector('.rt-ContextMenuRadioGroup')
    expect(contextGroup).not.toBeNull()
    expect(contextGroup?.className).toContain('rt-BaseMenuRadioGroup')
    expect(contextGroup?.className).toContain('custom-radio-group')
  })

  it('updates open overlay appearance classes without remounting content', async () => {
    const appearance = createSignal<'light' | 'dark'>('light')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme appearance={prop(() => appearance()) as unknown as 'light'}>
          <DropdownMenu.Root defaultOpen modal={false}>
            <DropdownMenu.Trigger>
              <button type="button">Dropdown trigger</button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item>Dropdown item</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <ContextMenu.Root defaultOpen modal={false}>
            <ContextMenu.Trigger>
              <div>Context trigger</div>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
              <ContextMenu.Item>Context item</ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Root>

          <Select.Root defaultOpen defaultValue="one">
            <Select.Trigger />
            <Select.Content forceMount>
              <Select.Item value="one">One</Select.Item>
            </Select.Content>
          </Select.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const contents = [
      document.body.querySelector('.rt-DropdownMenuContent'),
      document.body.querySelector('.rt-ContextMenuContent'),
      document.body.querySelector('.rt-SelectContent'),
    ]
    expect(contents).not.toContain(null)
    expect(contents.every((content) => content?.classList.contains('light'))).toBe(true)
    expect(contents.every((content) => !content?.classList.contains('dark'))).toBe(true)

    appearance('dark')
    await flushEffects()

    const updatedContents = [
      document.body.querySelector('.rt-DropdownMenuContent'),
      document.body.querySelector('.rt-ContextMenuContent'),
      document.body.querySelector('.rt-SelectContent'),
    ]
    expect(updatedContents).toEqual(contents)
    expect(contents.every((content) => content?.classList.contains('dark'))).toBe(true)
    expect(contents.every((content) => !content?.classList.contains('light'))).toBe(true)

    appearance('light')
    await flushEffects()
    expect(contents.every((content) => content?.classList.contains('light'))).toBe(true)
    expect(contents.every((content) => !content?.classList.contains('dark'))).toBe(true)
  })
})
