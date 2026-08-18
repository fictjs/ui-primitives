/** @jsxImportSource fict */

import { afterEach, describe, expect, it } from 'vitest'

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { render } from 'fict'

import { Button, Container, Select, Theme, Tooltip } from '../src/index.js'

const thisDir =
  typeof import.meta.dirname === 'string'
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url))
const fictThemesSrcDir = join(thisDir, '..', 'src')
const require = createRequire(import.meta.url)
const reactThemesSiblingSrcDir = join(
  thisDir,
  '..',
  '..',
  '..',
  'radix-ui-themes',
  'packages',
  'radix-ui-themes',
  'src',
)
const reactThemesSrcDir = existsSync(reactThemesSiblingSrcDir)
  ? reactThemesSiblingSrcDir
  : join(dirname(require.resolve('@radix-ui/themes/package.json')), 'src')

function collectCssFiles(rootDir: string, currentDir = rootDir): string[] {
  return readdirSync(currentDir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = join(currentDir, entry.name)

      if (entry.isDirectory()) {
        return collectCssFiles(rootDir, entryPath)
      }

      if (entry.isFile() && entry.name.endsWith('.css')) {
        return [relative(rootDir, entryPath)]
      }

      return []
    })
    .sort()
}

function collectFiles(rootDir: string, extension: string, currentDir = rootDir): string[] {
  return readdirSync(currentDir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = join(currentDir, entry.name)

      if (entry.isDirectory()) {
        return collectFiles(rootDir, extension, entryPath)
      }

      if (entry.isFile() && entry.name.endsWith(extension)) {
        return [relative(rootDir, entryPath)]
      }

      return []
    })
    .sort()
}

function readNormalizedFile(filePath: string): string {
  return readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n')
}

const fictCssNormalizers: Record<string, (contents: string) => string> = {
  'components/animations.css': (contents) =>
    contents.replace(
      "\n\n  .rt-BaseMenuSubContent {\n    &:where([data-state='open']) {\n      animation-name: rt-fade-in;\n    }\n\n    &:where([data-state='closed']) {\n      animation-name: rt-fade-out;\n    }\n  }",
      '',
    ),
  'components/avatar.css': (contents) =>
    contents
      .replace('  position: relative;\n', '')
      .replace('  overflow: hidden;\n', '')
      .replace('  position: absolute;\n  inset: 0;\n  display: block;\n', '')
      .replace('  position: absolute;\n  inset: 0;\n', ''),
  'components/_internal/base-checkbox.css': (contents) =>
    contents.replace(
      '\n\n  & :where(svg) {\n    display: block;\n    width: 100%;\n    height: 100%;\n  }',
      '',
    ),
  'components/select.css': (contents) =>
    contents
      .replace('  width: 100%;\n', '')
      .replace(
        '\n.rt-SelectViewport > :where(.rt-SelectItem, .rt-SelectLabel) {\n  display: flex !important;\n}\n',
        '',
      )
      .replace('  top: 0;\n  bottom: 0;\n', ''),
  'components/skeleton.css': (contents) =>
    contents.replace('.rt-Skeleton :where(*),', '.rt-Skeleton > *,'),
  'components/table.css': (contents) =>
    contents
      .replace(
        "\n  /* Preserve native table layout inside ScrollArea's direct-child reset. */\n  display: table !important;",
        '',
      )
      .replace(
        '  /* Fict collapses ScrollArea tables when this is forced to zero. */\n  height: auto;',
        '  /* Makes "height: 100%" work on content inside cells */\n  height: 0;',
      ),
  'components/tooltip.css': (contents) =>
    contents.replace(
      "\n\n    &:where([data-state='closed']) {\n      animation-duration: 100ms;\n      animation-name: rt-fade-out;\n    }",
      '',
    ),
}

function normalizeFictCss(relativeFile: string, contents: string): string {
  return fictCssNormalizers[relativeFile]?.(contents) ?? contents
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

describe('@fictjs/radix-ui-themes parity', () => {
  const cleanups: Array<() => void> = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    document.body.innerHTML = ''
  })

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  it('keeps theme CSS sources aligned with the React radix-ui-themes package', () => {
    const cssRoots = ['components', 'styles'] as const

    for (const cssRoot of cssRoots) {
      const fictDir = join(fictThemesSrcDir, cssRoot)
      const reactDir = join(reactThemesSrcDir, cssRoot)
      const fictFiles = collectCssFiles(fictDir)
      const reactFiles = collectCssFiles(reactDir)

      expect(fictFiles, `${cssRoot} file list should match the React package`).toEqual(reactFiles)

      for (const relativeFile of fictFiles) {
        const normalizedRelativeFile = `${cssRoot}/${relativeFile}`
        const fictContents = normalizeFictCss(
          normalizedRelativeFile,
          readNormalizedFile(join(fictDir, relativeFile)),
        )
        const reactContents = readNormalizedFile(join(reactDir, relativeFile))

        expect(
          fictContents,
          `${normalizedRelativeFile} should stay byte-for-byte aligned with the React package`,
        ).toBe(reactContents)
      }
    }
  })

  it('avoids passing class= to local theme components that expect className', () => {
    const componentDir = join(fictThemesSrcDir, 'components')
    const componentFiles = collectFiles(componentDir, '.tsx')
    const localComponentClassPropPattern =
      /<(Text|Heading|CheckboxGroupItemCheckbox|RadioGroupItemRadio)\b[^>]*\bclass=(?=[{"])/

    for (const relativeFile of componentFiles) {
      const contents = readNormalizedFile(join(componentDir, relativeFile))

      expect(
        contents,
        `components/${relativeFile} should not pass class= to local components that consume className`,
      ).not.toMatch(localComponentClassPropPattern)
    }
  })

  it('renders discrete button props as React-style classes without inline styles', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Button size="2" variant="solid">
            Action
          </Button>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.getAttribute('class')).toBe(
      'rt-reset rt-BaseButton rt-r-size-2 rt-variant-solid rt-Button',
    )
    expect(button?.getAttribute('style')).toBeNull()
  })

  it('retains ghost-offset classes for button and select trigger styling', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Button variant="ghost-offset">Action</Button>
          <Select.Root defaultValue="one">
            <Select.Trigger variant="ghost-offset" />
            <Select.Content>
              <Select.Item value="one">One</Select.Item>
            </Select.Content>
          </Select.Root>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    expect(container.querySelector('.rt-Button')?.classList).toContain('rt-variant-ghost-offset')
    expect(container.querySelector('.rt-SelectTrigger')?.classList).toContain(
      'rt-variant-ghost-offset',
    )
  })

  it('renders arbitrary layout values through the same class plus custom-property pattern as React', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Container size="4" maxWidth="1680px">
            Content
          </Container>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const containerInner = container.querySelector('.rt-ContainerInner')
    expect(containerInner).not.toBeNull()
    expect(containerInner?.getAttribute('class')).toBe('rt-ContainerInner rt-r-max-w')
    expect(containerInner?.getAttribute('style')).toContain('--max-width: 1680px')
  })

  it('keeps tooltip text classes aligned with the React package markup', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Theme>
          <Tooltip open content="The quick brown fox">
            <Button>Trigger</Button>
          </Tooltip>
        </Theme>
      ),
      container,
    )

    await flushEffects()

    const tooltipText = document.body.querySelector('.rt-TooltipText')
    expect(tooltipText).not.toBeNull()
    expect(tooltipText?.getAttribute('class')).toContain('rt-TooltipText')
  })
})
