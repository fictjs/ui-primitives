import { expect, type Page } from '@playwright/test'

const ignoredConsoleErrors = [
  /Failed to load resource: the server responded with a status of 404/,
] as const

export function trackBrowserErrors(page: Page) {
  const pageErrors: string[] = []
  const consoleErrors: string[] = []

  const handlePageError = (error: Error) => {
    pageErrors.push(error.message)
  }

  const handleConsole = (message: { type(): string; text(): string }) => {
    if (message.type() !== 'error') {
      return
    }

    const text = message.text()
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
