import { expect, type Page } from '@playwright/test'

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
