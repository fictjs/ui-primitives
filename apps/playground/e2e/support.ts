import { expect, type Locator, type Page } from '@playwright/test'

import { sinkRoutes } from '../src/sink/routes'

const ignoredConsoleErrors = [
  /Failed to load resource: the server responded with a status of 404/,
] as const
const trackedConsoleWarnings = [/^\[fict\] cycle guard:/] as const

export function trackBrowserErrors(page: Page) {
  const pageErrors: string[] = []
  const consoleErrors: string[] = []

  const handlePageError = (error: Error) => {
    pageErrors.push(error.message)
  }

  const handleConsole = (message: { type(): string; text(): string }) => {
    const text = message.text()
    const isTrackedWarning =
      message.type() === 'warning' && trackedConsoleWarnings.some((pattern) => pattern.test(text))

    if (message.type() !== 'error' && !isTrackedWarning) {
      return
    }

    if (ignoredConsoleErrors.some((pattern) => pattern.test(text))) {
      return
    }

    consoleErrors.push(text)
  }

  page.on('pageerror', handlePageError)
  page.on('console', handleConsole)

  return {
    consoleErrors,
    pageErrors,
    stop() {
      page.off('pageerror', handlePageError)
      page.off('console', handleConsole)
    },
  }
}

export async function expectNoBrowserErrors(page: Page, url: string) {
  const tracker = trackBrowserErrors(page)

  await page.goto(url, { waitUntil: 'networkidle' })

  tracker.stop()

  expect(
    {
      consoleErrors: tracker.consoleErrors,
      pageErrors: tracker.pageErrors,
    },
    `Unexpected browser errors while visiting ${url}`,
  ).toEqual({
    consoleErrors: [],
    pageErrors: [],
  })
}

export async function gotoSinkSection(page: Page, href: (typeof sinkRoutes)[number]['href']) {
  if (!sinkRoutes.some((route) => route.href === href)) {
    throw new Error(`Unknown sink route: ${href}`)
  }

  await expectNoBrowserErrors(page, `/#/sink/${href}`)

  const sectionIndex = await page.evaluate((slug) => {
    const normalizeHeading = (text: string) =>
      text
        .trim()
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase()
        .replace(/\s+/g, '-')

    return Array.from(document.querySelectorAll('main section')).findIndex((section) => {
      const heading = section.querySelector('h2')
      return heading ? normalizeHeading(heading.textContent ?? '') === slug : false
    })
  }, href)

  if (sectionIndex === -1) {
    throw new Error(`Unable to find rendered section for sink route: ${href}`)
  }

  const section = page.locator('main section').nth(sectionIndex)
  await expect(section).toBeInViewport()

  return section
}

export async function expectSelectHighlightedItemFillsContent(page: Page, trigger: Locator) {
  await trigger.click()

  const content = page.locator('.rt-SelectContent').last()
  await expect(content).toBeVisible()

  const dimensions = await content.evaluate((node) => {
    const viewport = node.querySelector('.rt-SelectViewport')
    const highlightedItem = node.querySelector('.rt-SelectItem[data-highlighted]')
    const checkedItem = node.querySelector('.rt-SelectItem[data-state="checked"]')

    if (!viewport || !highlightedItem || !checkedItem) {
      return null
    }

    const viewportRect = viewport.getBoundingClientRect()
    const viewportStyle = getComputedStyle(viewport)
    const viewportPaddingX =
      Number.parseFloat(viewportStyle.paddingLeft) + Number.parseFloat(viewportStyle.paddingRight)
    const itemRect = highlightedItem.getBoundingClientRect()
    const itemStyle = getComputedStyle(highlightedItem)
    const textNode = Array.from(highlightedItem.querySelectorAll('span')).find(
      (span) => !span.classList.contains('rt-SelectItemIndicator'),
    )
    const textRect = textNode?.getBoundingClientRect()
    const checkedItemRect = checkedItem.getBoundingClientRect()
    const indicator = checkedItem.querySelector('.rt-SelectItemIndicator')
    const indicatorRect = indicator?.getBoundingClientRect()

    return {
      indicatorCenterOffset: indicatorRect
        ? Math.abs(
            indicatorRect.top +
              indicatorRect.height / 2 -
              (checkedItemRect.top + checkedItemRect.height / 2),
          )
        : null,
      itemDisplay: itemStyle.display,
      itemWidth: itemRect.width,
      textCenterOffset: textRect
        ? Math.abs(textRect.top + textRect.height / 2 - (itemRect.top + itemRect.height / 2))
        : null,
      viewportInnerWidth: viewportRect.width - viewportPaddingX,
    }
  })

  expect(dimensions).not.toBeNull()
  expect(dimensions!.itemDisplay).toBe('flex')
  expect(Math.abs(dimensions!.itemWidth - dimensions!.viewportInnerWidth)).toBeLessThanOrEqual(1)
  expect(dimensions!.textCenterOffset).not.toBeNull()
  expect(dimensions!.textCenterOffset!).toBeLessThanOrEqual(1)
  expect(dimensions!.indicatorCenterOffset).not.toBeNull()
  expect(dimensions!.indicatorCenterOffset!).toBeLessThanOrEqual(1)

  await page.keyboard.press('Escape')
  await expect(content).toBeHidden()
}

export function expectTrackedBrowserErrors(
  tracker: ReturnType<typeof trackBrowserErrors>,
  context: string,
) {
  expect(
    {
      consoleErrors: tracker.consoleErrors,
      pageErrors: tracker.pageErrors,
    },
    `Unexpected browser errors while ${context}`,
  ).toEqual({
    consoleErrors: [],
    pageErrors: [],
  })
}
