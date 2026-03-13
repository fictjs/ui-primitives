import { expect, test } from '@playwright/test'

import { sinkRoutes } from '../src/sink/routes'
import { gotoSinkSection } from './support'

for (const route of sinkRoutes) {
  test(`route smoke: ${route.href}`, async ({ page }) => {
    await gotoSinkSection(page, route.href)
    await expect(page.locator('main')).toBeVisible()
  })
}
