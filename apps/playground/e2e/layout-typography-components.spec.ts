import { expect, test, type Locator, type Page } from '@playwright/test'

import { expectTrackedBrowserErrors, gotoSinkSection, trackBrowserErrors } from './support'

type LayoutRoute =
  | 'blockquote'
  | 'container'
  | 'cursors'
  | 'grid'
  | 'heading'
  | 'kbd'
  | 'mixed-nested-themes-test'
  | 'nested-appearances-test'
  | 'nested-colors-test'
  | 'shadow-tokens'
  | 'skeleton'
  | 'text'
  | 'typography'

async function runSectionTest(
  page: Page,
  href: LayoutRoute,
  context: string,
  assertion: (section: Locator) => Promise<void>,
) {
  const section = await gotoSinkSection(page, href)
  const tracker = trackBrowserErrors(page)

  await assertion(section)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, context)
}

test('blockquote renders multiple quote variants', async ({ page }) => {
  await runSectionTest(page, 'blockquote', 'testing the blockquote demo', async (section) => {
    await expect(section.locator('blockquote')).toHaveCount(3)
    await expect(
      section.getByText('What proportion(s) will give us the best results?').first(),
    ).toBeVisible()
  })
})

test('container renders nested size examples', async ({ page }) => {
  await runSectionTest(page, 'container', 'testing the container demo', async (section) => {
    await expect(section.getByText('This should be size 4')).toBeVisible()
    await expect(section.getByText('This should be size 1')).toBeVisible()
  })
})

test('cursors toggles pointer cursor styles and opens the dropdown menu', async ({ page }) => {
  await runSectionTest(page, 'cursors', 'testing the cursors demo', async (section) => {
    await section.getByRole('checkbox').click()
    const cursorButton = await page
      .locator('[data-is-root-theme="true"]')
      .first()
      .evaluate((element) => getComputedStyle(element).getPropertyValue('--cursor-button').trim())
    expect(cursorButton).toBe('pointer')

    await section.getByRole('button', { name: /Dropdown Menu/ }).click()
    await expect(page.getByText('New Tab')).toBeVisible()
  })
})

test('grid renders the expected box collections', async ({ page }) => {
  await runSectionTest(page, 'grid', 'testing the grid demo', async (section) => {
    expect(await section.locator('[style*="var(--accent-9)"]').count()).toBeGreaterThan(40)
  })
})

test('heading renders the size ladder and color examples', async ({ page }) => {
  await runSectionTest(page, 'heading', 'testing the heading demo', async (section) => {
    expect(await section.getByText('The quick brown fox jumped').count()).toBeGreaterThan(6)
    await expect(section.getByText('This is some red text in high-contrast').first()).toBeVisible()
  })
})

test('kbd renders the shortcut buttons and table examples', async ({ page }) => {
  await runSectionTest(page, 'kbd', 'testing the kbd demo', async (section) => {
    await expect(section.getByRole('button', { name: 'Enter' })).toBeVisible()
    await expect(section.getByRole('button', { name: 'Shift + Tab' })).toBeVisible()
    expect(await section.locator('.rt-Kbd, kbd').count()).toBeGreaterThan(10)
  })
})

test('mixed nested themes renders all nested sample groups', async ({ page }) => {
  await runSectionTest(
    page,
    'mixed-nested-themes-test',
    'testing the mixed nested themes demo',
    async (section) => {
      await expect(section.getByText('Global theme')).toBeVisible()
      await expect(section.getByText('Dark, Mint, no radius, 90%')).toBeVisible()
      await expect(section.getByText('Light, Amber, full radius, 110%')).toBeVisible()
      await expect(section.getByText('Dark, Tomato, large radius, 100%')).toBeVisible()
      expect(await section.getByRole('button', { name: 'Submit' }).count()).toBeGreaterThan(3)
    },
  )
})

test('nested appearances renders each appearance layer', async ({ page }) => {
  await runSectionTest(
    page,
    'nested-appearances-test',
    'testing the nested appearances demo',
    async (section) => {
      await expect(section.getByText('Global appearance')).toBeVisible()
      expect(await section.getByText('Always dark').count()).toBeGreaterThan(1)
      await expect(section.getByText('Always light')).toBeVisible()
    },
  )
})

test('nested colors renders each accent color layer', async ({ page }) => {
  await runSectionTest(
    page,
    'nested-colors-test',
    'testing the nested colors demo',
    async (section) => {
      await expect(section.getByText('Global color')).toBeVisible()
      await expect(section.getByText('Always mint')).toBeVisible()
      await expect(section.getByText('Always amber')).toBeVisible()
      await expect(section.getByText('Always tomato')).toBeVisible()
    },
  )
})

test('shadow tokens renders all six depth samples', async ({ page }) => {
  await runSectionTest(page, 'shadow-tokens', 'testing the shadow tokens demo', async (section) => {
    for (const label of ['1', '2', '3', '4', '5', '6']) {
      await expect(section.getByText(label, { exact: true })).toBeVisible()
    }
  })
})

test('skeleton renders both live and skeletonized examples', async ({ page }) => {
  await runSectionTest(page, 'skeleton', 'testing the skeleton demo', async (section) => {
    expect(await section.locator('.rt-Skeleton').count()).toBeGreaterThan(5)
    await expect(section.getByRole('button', { name: /^Next$/ }).first()).toBeVisible()
    await expect(section.getByText('Configuration Guide').first()).toBeVisible()
  })
})

test('text renders the size ladder and color examples', async ({ page }) => {
  await runSectionTest(page, 'text', 'testing the text demo', async (section) => {
    expect(await section.getByText('The quick brown fox jumped').count()).toBeGreaterThan(6)
    await expect(section.getByText('This is some red text in high-contrast').first()).toBeVisible()
  })
})

test('typography renders the long-form typography showcase', async ({ page }) => {
  await runSectionTest(page, 'typography', 'testing the typography demo', async (section) => {
    await expect(
      section.locator('code').filter({ hasText: '-webkit-font-smoothing: antialiased;' }).first(),
    ).toBeVisible()
    await expect(
      section.getByText('The principles of the Typographic Craft are difficult to master').first(),
    ).toBeVisible()
    expect(await section.getByRole('link', { name: 'This is a link' }).count()).toBeGreaterThan(10)
  })
})
