import { expect, test } from '@playwright/test'

import { sinkRoutes } from '../src/sink/routes'
import { expectNoBrowserErrors } from './support'

for (const [index, route] of sinkRoutes.entries()) {
  test(`route smoke: ${route.href}`, async ({ page }) => {
    await expectNoBrowserErrors(page, `/#/sink/${route.href}`)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('main section').nth(index)).toBeInViewport()
  })
}
