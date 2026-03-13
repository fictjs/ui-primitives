import { expect, test, type Locator, type Page } from '@playwright/test'

import { expectTrackedBrowserErrors, gotoSinkSection, trackBrowserErrors } from './support'

async function runSectionTest(
  page: Page,
  href:
    | 'aspect-ratio'
    | 'avatar'
    | 'badge'
    | 'button'
    | 'callout'
    | 'card'
    | 'code'
    | 'data-list'
    | 'icon-button'
    | 'link'
    | 'playground'
    | 'progress'
    | 'scroll-area'
    | 'separator'
    | 'spinner'
    | 'table',
  context: string,
  assertion: (section: Locator) => Promise<void>,
) {
  const section = await gotoSinkSection(page, href)
  const tracker = trackBrowserErrors(page)

  await assertion(section)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, context)
}

test('aspect ratio renders all image variants', async ({ page }) => {
  await runSectionTest(page, 'aspect-ratio', 'testing the aspect ratio demo', async (section) => {
    await expect(section.getByAltText('A house in a forest')).toHaveCount(4)
    await expect(section.getByText('16x9')).toBeVisible()
  })
})

test('avatar renders both image and fallback variants', async ({ page }) => {
  await runSectionTest(page, 'avatar', 'testing the avatar demo', async (section) => {
    expect(await section.locator('img[src*="avatar.svg"]').count()).toBeGreaterThan(0)
    await expect(section.getByText('BG').first()).toBeVisible()
  })
})

test('badge renders multiple color examples', async ({ page }) => {
  await runSectionTest(page, 'badge', 'testing the badge demo', async (section) => {
    await expect(section.getByText('Orange').first()).toBeVisible()
    await expect(section.getByText('Violet').first()).toBeVisible()
  })
})

test('button exposes enabled and disabled examples', async ({ page }) => {
  await runSectionTest(page, 'button', 'testing the button demo', async (section) => {
    const enabledButton = section.getByRole('button', { name: /Next/ }).first()
    const disabledButtons = section.locator('button:disabled')

    await expect(enabledButton).toBeVisible()
    await expect(enabledButton).toBeEnabled()
    expect(await disabledButtons.count()).toBeGreaterThan(0)
  })
})

test('callout renders guidance links inside the content', async ({ page }) => {
  await runSectionTest(page, 'callout', 'testing the callout demo', async (section) => {
    const link = section.getByRole('link', { name: 'Configuration Guide' }).first()

    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/')
  })
})

test('card renders linked contact cards', async ({ page }) => {
  await runSectionTest(page, 'card', 'testing the card demo', async (section) => {
    await expect(section.locator('a[href="#some-page"]').first()).toBeVisible()
    await expect(section.getByText('Poppy Nichols').first()).toBeVisible()
  })
})

test('code renders inline and linked snippets', async ({ page }) => {
  await runSectionTest(page, 'code', 'testing the code demo', async (section) => {
    await expect(section.locator('code').filter({ hasText: 'console.log()' }).first()).toBeVisible()
    await expect(
      section.locator('a[href*="developer.mozilla.org"]').locator('code').first(),
    ).toBeVisible()
  })
})

test('data list switches between the documented tabs', async ({ page }) => {
  await runSectionTest(page, 'data-list', 'testing the data list demo', async (section) => {
    const orientationsTab = section.getByRole('tab', { name: 'All orientations' })
    const sizesTab = section.getByRole('tab', { name: 'All sizes' })

    await orientationsTab.click()
    await expect(section.getByText('Horizontal')).toBeVisible()

    await sizesTab.click()
    await expect(section.getByText('Size 3')).toBeVisible()
  })
})

test('icon button renders interactive and disabled examples', async ({ page }) => {
  await runSectionTest(page, 'icon-button', 'testing the icon button demo', async (section) => {
    const buttons = section.locator('button')
    const enabledButtons = section.locator('button:not(:disabled)')

    expect(await buttons.count()).toBeGreaterThan(0)
    expect(await section.locator('button:disabled').count()).toBeGreaterThan(0)
    expect(await enabledButtons.count()).toBeGreaterThan(0)
  })
})

test('link preserves href on themed links', async ({ page }) => {
  await runSectionTest(page, 'link', 'testing the link demo', async (section) => {
    const link = section.getByRole('link', { name: 'This is a link' }).first()

    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/')
  })
})

test('playground form accepts typed values', async ({ page }) => {
  await runSectionTest(page, 'playground', 'testing the playground form demo', async (section) => {
    const email = section.getByPlaceholder('Your email').first()
    const feedback = section.getByPlaceholder('Your feedback').first()

    await email.fill('playground@example.com')
    await feedback.fill('All systems nominal')

    await expect(email).toHaveValue('playground@example.com')
    await expect(feedback).toHaveValue('All systems nominal')
  })
})

test('progress exposes determinate values', async ({ page }) => {
  await runSectionTest(page, 'progress', 'testing the progress demo', async (section) => {
    await expect(section.locator('[role="progressbar"][aria-valuenow="33"]').first()).toBeVisible()
    expect(await section.getByRole('progressbar').count()).toBeGreaterThan(4)
  })
})

test('scroll area viewport can scroll in both directions', async ({ page }) => {
  await runSectionTest(page, 'scroll-area', 'testing the scroll area demo', async (section) => {
    const viewport = section.locator('.rt-ScrollAreaViewport').first()

    const result = await viewport.evaluate((element) => {
      const target = element as HTMLElement
      target.scrollTop = 120
      target.scrollLeft = 90
      return { scrollTop: target.scrollTop, scrollLeft: target.scrollLeft }
    })

    expect(result.scrollTop).toBeGreaterThan(0)
    expect(result.scrollLeft).toBeGreaterThan(0)
  })
})

test('separator renders multiple horizontal and vertical separators', async ({ page }) => {
  await runSectionTest(page, 'separator', 'testing the separator demo', async (section) => {
    expect(await section.locator('.rt-Separator').count()).toBeGreaterThan(20)
    expect(
      await section.locator('.rt-Separator.rt-r-orientation-horizontal').count(),
    ).toBeGreaterThan(10)
    expect(
      await section.locator('.rt-Separator.rt-r-orientation-vertical').count(),
    ).toBeGreaterThan(10)
  })
})

test('spinner renders loading button examples', async ({ page }) => {
  await runSectionTest(page, 'spinner', 'testing the spinner demo', async (section) => {
    expect(await section.getByRole('button', { name: 'Continue' }).count()).toBeGreaterThan(0)
    expect(await section.locator('button:disabled').count()).toBeGreaterThan(0)
    expect(await section.locator('.rt-Spinner').count()).toBeGreaterThan(4)
  })
})

test('table renders example data rows', async ({ page }) => {
  await runSectionTest(page, 'table', 'testing the table demo', async (section) => {
    await expect(section.getByRole('columnheader', { name: 'Full name' }).first()).toBeVisible()
    await expect(section.getByRole('rowheader', { name: 'Andy' }).first()).toBeVisible()
  })
})
