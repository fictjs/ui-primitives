import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  expectSelectHighlightedItemFillsContent,
  expectTrackedBrowserErrors,
  gotoSinkSection,
  trackBrowserErrors,
} from './support'

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
    const colorCombinations = section.locator('details').nth(1)
    await expect(section.locator('img[src$="/api/avatar"]').first()).toBeVisible()
    await expect(section.getByText('BG').first()).toBeVisible()
    const avatarStates = await section.locator('.rt-AvatarRoot').evaluateAll((roots) =>
      roots.slice(0, 20).map((root) => {
        const image = root.querySelector('.rt-AvatarImage')
        const fallback = root.querySelector('.rt-AvatarFallback')
        const rootRect = root.getBoundingClientRect()
        const imageRect = image?.getBoundingClientRect()
        const fallbackRect = fallback?.getBoundingClientRect()

        return {
          rootWidth: rootRect.width,
          rootHeight: rootRect.height,
          imageSrc: image?.getAttribute('src') ?? null,
          imageWidth: imageRect?.width ?? null,
          imageHeight: imageRect?.height ?? null,
          fallbackText: fallback?.textContent ?? null,
          fallbackWidth: fallbackRect?.width ?? null,
          fallbackHeight: fallbackRect?.height ?? null,
        }
      }),
    )

    for (const state of avatarStates) {
      if (state.imageSrc) {
        expect(state.imageSrc).toBe('/api/avatar')
        expect(state.imageWidth).toBe(state.rootWidth)
        expect(state.imageHeight).toBe(state.rootHeight)
        expect(state.fallbackText).toBeNull()
      } else if (state.fallbackText !== null) {
        expect(state.fallbackWidth).toBe(state.rootWidth)
        expect(state.fallbackHeight).toBe(state.rootHeight)
      }
    }

    await colorCombinations.locator('summary').click()
    await expect(colorCombinations).toHaveAttribute('open', '')
    await expect(colorCombinations.locator('table')).toHaveCount(4)
    await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)
  })
})

test('badge renders multiple color examples', async ({ page }) => {
  await runSectionTest(page, 'badge', 'testing the badge demo', async (section) => {
    const colorCombinations = section.locator('details').nth(1)

    await expect(section.getByText('Orange').first()).toBeVisible()
    await expect(section.getByText('Violet').first()).toBeVisible()

    await colorCombinations.locator('summary').click()
    await expect(colorCombinations).toHaveAttribute('open', '')
    await expect(colorCombinations.locator('table')).toHaveCount(4)
    await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)
  })
})

test('button exposes enabled and disabled examples', async ({ page }) => {
  await runSectionTest(page, 'button', 'testing the button demo', async (section) => {
    const enabledButton = section.getByRole('button', { name: /Next/ }).first()
    const disabledButtons = section.locator('button:disabled')
    const colorCombinations = section.locator('details').nth(1)

    await expect(enabledButton).toBeVisible()
    await expect(enabledButton).toBeEnabled()
    expect(await disabledButtons.count()).toBeGreaterThan(0)

    await colorCombinations.locator('summary').click()
    await expect(colorCombinations).toHaveAttribute('open', '')

    await expect(colorCombinations.locator('p', { hasText: 'Regulars' })).toBeVisible()
    await expect(colorCombinations.locator('p', { hasText: 'Brights' })).toBeVisible()
    await expect(colorCombinations.locator('p', { hasText: 'Metals' })).toBeVisible()
    await expect(colorCombinations.locator('p', { hasText: /^Gray$/ })).toBeVisible()
    await expect(colorCombinations.locator('table')).toHaveCount(4)
  })
})

test('callout renders guidance links inside the content', async ({ page }) => {
  await runSectionTest(page, 'callout', 'testing the callout demo', async (section) => {
    const link = section.getByRole('link', { name: 'Configuration Guide' }).first()
    const colorCombinations = section.locator('details').first()
    const layoutCombinations = section.locator('details').nth(1)

    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/')

    await colorCombinations.locator('summary').click()
    await expect(colorCombinations).toHaveAttribute('open', '')
    await expect(colorCombinations.locator('p', { hasText: 'Regulars' })).toBeVisible()
    await expect(colorCombinations.locator('p', { hasText: 'Brights' })).toBeVisible()
    await expect(colorCombinations.locator('p', { hasText: 'Metals' })).toBeVisible()
    await expect(colorCombinations.locator('p', { hasText: /^Gray$/ })).toBeVisible()
    await expect(colorCombinations.locator('table')).toHaveCount(4)

    await layoutCombinations.locator('summary').click()
    await expect(layoutCombinations).toHaveAttribute('open', '')
    await expect(layoutCombinations.locator('.rt-CalloutRoot')).toHaveCount(12)
    await expect(layoutCombinations.locator('.rt-Separator')).toHaveCount(3)
  })
})

test('card renders linked contact cards', async ({ page }) => {
  await runSectionTest(page, 'card', 'testing the card demo', async (section) => {
    const linkedCards = section.locator('a.rt-Card[href="#some-page"]')
    const avatarImages = linkedCards.locator('img')

    await expect(linkedCards.first()).toBeVisible()
    await expect(linkedCards).toHaveCount(15)
    await expect(avatarImages.first()).toBeVisible()
    await expect(avatarImages.first()).toHaveAttribute('src', /\/api\/avatar$/)
    await expect(linkedCards.nth(3)).not.toHaveAttribute('style', /.+/)
    await expect(section.getByText('Poppy Nichols').first()).toBeVisible()

    const avatarStates = await avatarImages.evaluateAll((images) =>
      images.map((image) => {
        const element = image as HTMLImageElement
        return {
          complete: element.complete,
          naturalWidth: element.naturalWidth,
        }
      }),
    )

    expect(avatarStates.every(({ complete, naturalWidth }) => complete && naturalWidth > 0)).toBe(
      true,
    )
  })
})

test('code renders inline and linked snippets', async ({ page }) => {
  await runSectionTest(page, 'code', 'testing the code demo', async (section) => {
    const colorCombinations = section.locator('details').first()

    await expect(section.locator('code').filter({ hasText: 'console.log()' }).first()).toBeVisible()
    await expect(
      section.locator('a[href*="developer.mozilla.org"]').locator('code').first(),
    ).toBeVisible()

    await colorCombinations.locator('summary').click()
    await expect(colorCombinations).toHaveAttribute('open', '')
    await expect(colorCombinations.locator('p', { hasText: 'Regulars' })).toBeVisible()
    await expect(colorCombinations.locator('p', { hasText: 'Brights' })).toBeVisible()
    await expect(colorCombinations.locator('p', { hasText: 'Metals' })).toBeVisible()
    await expect(colorCombinations.locator('p', { hasText: /^Gray$/ })).toBeVisible()
    await expect(colorCombinations.locator('table')).toHaveCount(4)
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
    const colorCombinations = section.locator('details').filter({ hasText: 'See colors' })

    expect(await buttons.count()).toBeGreaterThan(0)
    expect(await section.locator('button:disabled').count()).toBeGreaterThan(0)
    expect(await enabledButtons.count()).toBeGreaterThan(0)

    await colorCombinations.locator('summary').click()
    await expect(colorCombinations).toHaveAttribute('open', '')
    await expect(colorCombinations.locator('p', { hasText: 'Regulars' })).toBeVisible()
    await expect(colorCombinations.locator('p', { hasText: 'Brights' })).toBeVisible()
    await expect(colorCombinations.locator('p', { hasText: 'Metals' })).toBeVisible()
    await expect(colorCombinations.locator('p', { hasText: /^Gray$/ })).toBeVisible()
    await expect(colorCombinations.locator('table')).toHaveCount(4)
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
    const subjectTrigger = section
      .locator('.rt-Grid')
      .filter({ hasText: 'Subject' })
      .locator('.rt-SelectTrigger')
      .first()

    await email.fill('playground@example.com')
    await feedback.fill('All systems nominal')

    await expect(email).toHaveValue('playground@example.com')
    await expect(feedback).toHaveValue('All systems nominal')
    await expectSelectHighlightedItemFillsContent(page, subjectTrigger)
  })
})

test('progress exposes determinate values', async ({ page }) => {
  await runSectionTest(page, 'progress', 'testing the progress demo', async (section) => {
    const colorCombinations = section.locator('details').filter({ hasText: 'See colors' })

    await expect(section.locator('[role="progressbar"][aria-valuenow="33"]').first()).toBeVisible()
    expect(await section.getByRole('progressbar').count()).toBeGreaterThan(4)

    await colorCombinations.locator('summary').click()
    await expect(colorCombinations).toHaveAttribute('open', '')
    await expect(colorCombinations.locator('table')).toHaveCount(4)
    await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)
  })
})

test('scroll area viewport can scroll in both directions', async ({ page }) => {
  await runSectionTest(page, 'scroll-area', 'testing the scroll area demo', async (section) => {
    const viewport = section.locator('.rt-ScrollAreaViewport').first()
    const horizontalScrollbar = section
      .locator('table')
      .first()
      .locator('.rt-ScrollAreaScrollbar[data-orientation="horizontal"]')
      .first()

    const result = await viewport.evaluate((element) => {
      const target = element as HTMLElement
      target.scrollTop = 120
      target.scrollLeft = 90
      return { scrollTop: target.scrollTop, scrollLeft: target.scrollLeft }
    })

    expect(result.scrollTop).toBeGreaterThan(0)
    expect(result.scrollLeft).toBeGreaterThan(0)
    await expect(horizontalScrollbar).toBeVisible()
    expect(await horizontalScrollbar.getAttribute('data-state')).toBeNull()
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

    const firstTableRoot = section.locator('.rt-TableRoot').first()
    const layoutMetrics = await firstTableRoot.evaluate((root) => {
      const viewport = root.querySelector('.rt-ScrollAreaViewport')
      const table = root.querySelector('table')
      const firstRow = root.querySelector('tr')

      if (!viewport || !table || !firstRow) {
        throw new Error('Unable to measure table layout')
      }

      const tableRect = table.getBoundingClientRect()
      const firstRowRect = firstRow.getBoundingClientRect()

      return {
        tableDisplay: getComputedStyle(table).display,
        tableWidth: tableRect.width,
        firstRowWidth: firstRowRect.width,
        viewportClientWidth: viewport.clientWidth,
        viewportScrollWidth: viewport.scrollWidth,
      }
    })

    expect(layoutMetrics.tableDisplay).toBe('table')
    expect(Math.abs(layoutMetrics.firstRowWidth - layoutMetrics.tableWidth)).toBeLessThanOrEqual(1)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(100)

    const narrowLayoutMetrics = await firstTableRoot.evaluate((root) => {
      const viewport = root.querySelector('.rt-ScrollAreaViewport')
      const table = root.querySelector('table')
      const firstRow = root.querySelector('tr')

      if (!viewport || !table || !firstRow) {
        throw new Error('Unable to measure narrow table layout')
      }

      const tableRect = table.getBoundingClientRect()
      const firstRowRect = firstRow.getBoundingClientRect()

      return {
        tableDisplay: getComputedStyle(table).display,
        tableWidth: tableRect.width,
        firstRowWidth: firstRowRect.width,
        viewportClientWidth: viewport.clientWidth,
        viewportScrollWidth: viewport.scrollWidth,
      }
    })

    expect(narrowLayoutMetrics.tableDisplay).toBe('table')
    expect(
      narrowLayoutMetrics.viewportScrollWidth,
      'narrow tables should expose their overflow to ScrollArea instead of clipping rows inside a block table',
    ).toBeGreaterThan(narrowLayoutMetrics.viewportClientWidth)
    expect(
      Math.abs(narrowLayoutMetrics.firstRowWidth - narrowLayoutMetrics.tableWidth),
    ).toBeLessThanOrEqual(1)
  })
})
