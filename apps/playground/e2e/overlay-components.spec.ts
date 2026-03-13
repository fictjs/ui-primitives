import { expect, test } from '@playwright/test'

import { expectTrackedBrowserErrors, gotoSinkSection, trackBrowserErrors } from './support'

test('dialog opens and closes from the cancel action', async ({ page }) => {
  const section = await gotoSinkSection(page, 'dialog')
  const tracker = trackBrowserErrors(page)

  await section.locator('#dialog-demo-open').click()
  await expect(page.locator('#dialog-demo-overlay')).toBeVisible()
  await section.locator('#dialog-demo-cancel').click()
  await expect(page.locator('#dialog-demo-overlay')).toBeHidden()

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the dialog demo')
})

test('alert dialog opens and closes from the cancel action', async ({ page }) => {
  const section = await gotoSinkSection(page, 'alert-dialog')
  const tracker = trackBrowserErrors(page)

  await section.locator('#alert-dialog-demo-open').click()
  await expect(page.locator('#alert-dialog-demo-overlay')).toBeVisible()
  await section.locator('#alert-dialog-demo-cancel').click()
  await expect(page.locator('#alert-dialog-demo-overlay')).toBeHidden()

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the alert dialog demo')
})

test('hover card opens on pointer enter and closes on pointer leave', async ({ page }) => {
  const section = await gotoSinkSection(page, 'hover-card')
  const tracker = trackBrowserErrors(page)

  await section.locator('#hover-card-demo-trigger').hover()
  await expect(page.locator('#hover-card-demo-content')).toBeVisible()
  await page.mouse.move(8, 8)
  await expect(page.locator('#hover-card-demo-content')).toBeHidden()

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the hover card demo')
})

test('tooltip opens on hover and closes when the pointer leaves', async ({ page }) => {
  const section = await gotoSinkSection(page, 'tooltip')
  const tracker = trackBrowserErrors(page)
  const tooltip = page.getByRole('tooltip')

  await section.locator('#tooltip-demo-trigger').hover()
  await expect(tooltip).toContainText('The quick brown fox')
  await page.mouse.move(8, 8)
  await expect(tooltip).toBeHidden()

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the tooltip demo')
})

test('popover opens on click and closes on outside press', async ({ page }) => {
  const section = await gotoSinkSection(page, 'popover')
  const tracker = trackBrowserErrors(page)

  await section.locator('#popover-demo-trigger').click()
  await expect(page.locator('#popover-demo-content')).toBeVisible()
  await page.mouse.click(8, 8)
  await expect(page.locator('#popover-demo-content')).toBeHidden()

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the popover demo')
})

test('dropdown menu opens from the trigger and closes on escape', async ({ page }) => {
  const section = await gotoSinkSection(page, 'dropdown-menu')
  const tracker = trackBrowserErrors(page)
  const menuItem = page.getByRole('menuitem', { name: 'New Tab ⌘+T' })

  await section.locator('#dropdown-menu-demo-trigger').click()
  await expect(menuItem).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menuItem).toBeHidden()

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the dropdown menu demo')
})

test('context menu opens on right click and closes on escape', async ({ page }) => {
  const section = await gotoSinkSection(page, 'context-menu')
  const tracker = trackBrowserErrors(page)

  await section.locator('#context-menu-demo-trigger').click({ button: 'right' })
  await expect(page.locator('#context-menu-demo-content')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'New Tab ⌘+T' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('#context-menu-demo-content')).toBeHidden()

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the context menu demo')
})

test('select opens and applies a new value', async ({ page }) => {
  const section = await gotoSinkSection(page, 'select')
  const tracker = trackBrowserErrors(page)
  const listbox = page.getByRole('listbox')

  await section.locator('#select-demo-trigger').click()
  await expect(listbox).toBeVisible()
  await page.getByRole('option', { name: 'Orange' }).click()
  await expect(section.locator('#select-demo-trigger')).toContainText('Orange')
  await expect(listbox).toBeHidden()

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the select demo')
})
