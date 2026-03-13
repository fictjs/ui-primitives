import { expect, test } from '@playwright/test'

import { expectTrackedBrowserErrors, gotoSinkSection, trackBrowserErrors } from './support'

function parseRgbChannels(color: string) {
  const matches = color.match(/\d+(?:\.\d+)?/g)
  if (!matches || matches.length < 3) {
    throw new Error(`Unable to parse RGB color: ${color}`)
  }

  return matches.slice(0, 3).map(Number)
}

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

test('tooltip trigger clicks do not re-enter delayed open loops on the sink page', async ({
  page,
}) => {
  const tracker = trackBrowserErrors(page)

  await page.goto('/#/sink', { waitUntil: 'networkidle' })
  await page.locator('#tooltip-demo-trigger').click()
  await page.waitForTimeout(900)
  await page.mouse.move(8, 8)
  await page.locator('#tooltip-demo-trigger').hover()
  await expect(page.locator('.rt-TooltipContent')).toContainText('The quick brown fox')

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'clicking and hovering the tooltip trigger on the sink page')
})

test('tooltip opens on hover and closes when the pointer leaves', async ({ page }) => {
  const section = await gotoSinkSection(page, 'tooltip')
  const tracker = trackBrowserErrors(page)
  const tooltip = page.locator('.rt-TooltipContent')
  const arrow = page.locator('.rt-TooltipArrow')

  await section.locator('#tooltip-demo-trigger').hover()
  await expect(tooltip).toContainText('The quick brown fox')
  await expect(arrow).toBeVisible()

  const tooltipStyles = await tooltip.evaluate((node) => {
    const styles = window.getComputedStyle(node)
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
    }
  })

  const [backgroundRed, backgroundGreen, backgroundBlue] = parseRgbChannels(
    tooltipStyles.backgroundColor,
  )
  const [textRed, textGreen, textBlue] = parseRgbChannels(tooltipStyles.color)
  const tooltipBackgroundBrightness = backgroundRed + backgroundGreen + backgroundBlue
  const tooltipTextBrightness = textRed + textGreen + textBlue

  expect(
    tooltipBackgroundBrightness,
    'tooltip should use the dark panel surface in the dark playground theme',
  ).toBeLessThan(120)
  expect(
    tooltipTextBrightness,
    'tooltip text should remain readable against the dark panel surface',
  ).toBeGreaterThan(600)
  expect(
    tooltipTextBrightness,
    'tooltip text should stay noticeably brighter than the tooltip background',
  ).toBeGreaterThan(tooltipBackgroundBrightness + 400)

  const arrowStyles = await arrow.evaluate((node) => {
    const styles = window.getComputedStyle(node)
    const { width, height } = node.getBoundingClientRect()

    return {
      fill: styles.fill,
      width,
      height,
    }
  })

  expect(arrowStyles.fill, 'tooltip arrow should match the tooltip surface').toBe(
    tooltipStyles.backgroundColor,
  )
  expect(arrowStyles.width, 'tooltip arrow should have a rendered width').toBeGreaterThan(0)
  expect(arrowStyles.height, 'tooltip arrow should have a rendered height').toBeGreaterThan(0)

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
