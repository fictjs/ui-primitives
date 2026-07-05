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
  const openButton = section.getByRole('button', { name: 'Open' })

  await expect(openButton).toHaveClass(/rt-Button/)
  await expect(openButton).not.toHaveAttribute('style', /.+/)

  await openButton.click()
  const dialog = page.getByRole('dialog')
  const cancelButton = page.getByRole('button', { name: 'Cancel' })
  await expect(dialog).toBeVisible()
  await expect(cancelButton).toHaveClass(/rt-Button/)
  await expect(cancelButton).not.toHaveAttribute('style', /.+/)
  await cancelButton.click()
  await expect(dialog).toBeHidden()

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the dialog demo')
})

test('alert dialog opens and closes from the cancel action', async ({ page }) => {
  const section = await gotoSinkSection(page, 'alert-dialog')
  const tracker = trackBrowserErrors(page)
  const openButton = section.getByRole('button', { name: 'Open' })

  await expect(openButton).toHaveClass(/rt-Button/)
  await expect(openButton).not.toHaveAttribute('style', /.+/)

  const dialog = page.getByRole('alertdialog')
  const cancelButton = page.getByRole('button', { name: 'Cancel' })

  for (let index = 0; index < 3; index += 1) {
    await openButton.click()
    await expect(dialog).toBeVisible()
    await expect(cancelButton).toHaveClass(/rt-Button/)
    await expect(cancelButton).not.toHaveAttribute('style', /.+/)
    await cancelButton.click()
    await expect(dialog).toBeHidden()
  }

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the alert dialog demo')
})

test('hover card opens on hover and closes when the pointer leaves', async ({ page }) => {
  const section = await gotoSinkSection(page, 'hover-card')
  const tracker = trackBrowserErrors(page)
  const trigger = section.locator('.rt-Link').filter({ hasText: 'A fancy link' }).first()
  const content = page
    .locator('.rt-HoverCardContent')
    .filter({ hasText: 'Jan Tschichold was a German calligrapher' })
    .first()

  await trigger.hover()
  await expect(content).toBeVisible()
  await page.mouse.move(8, 8)
  await expect(content).toBeHidden()

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the hover card demo')
})

test('tooltip trigger clicks do not re-enter delayed open loops on the sink page', async ({
  page,
}) => {
  const tracker = trackBrowserErrors(page)

  const section = await gotoSinkSection(page, 'tooltip')
  const trigger = section.getByRole('button', { name: 'Singleline' })
  await trigger.click()
  const box = await trigger.boundingBox()
  if (!box) {
    throw new Error('Unable to measure tooltip trigger after clicking it')
  }

  for (let index = 0; index < 24; index++) {
    await page.mouse.move(box.x + box.width / 2 + (index % 4), box.y + box.height / 2 + (index % 6))
  }

  await page.waitForTimeout(900)
  await page.mouse.move(8, 8)
  await trigger.hover()
  await expect(page.locator('.rt-TooltipContent')).toContainText('The quick brown fox')

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'clicking and hovering the tooltip trigger on the sink page')
})

test('tooltip opens on hover and closes when the pointer leaves', async ({ page }) => {
  const section = await gotoSinkSection(page, 'tooltip')
  const tracker = trackBrowserErrors(page)
  const tooltip = page.locator('.rt-TooltipContent')
  const tooltipText = page.locator('.rt-TooltipText').first()
  const arrow = page.locator('.rt-TooltipArrow')
  const singlelineTrigger = section.getByRole('button', { name: 'Singleline' })
  const multilineTrigger = section.getByRole('button', { name: 'Multiline' })

  await singlelineTrigger.hover()
  await expect(tooltip).toContainText('The quick brown fox')
  await expect(tooltipText).toContainText('The quick brown fox')
  await expect(arrow).toBeVisible()

  const singlelineTriggerBox = await singlelineTrigger.boundingBox()
  const singlelineArrowBox = await arrow.boundingBox()

  expect(singlelineTriggerBox, 'singleline trigger should be measurable').not.toBeNull()
  expect(singlelineArrowBox, 'tooltip arrow should be measurable').not.toBeNull()

  if (!singlelineTriggerBox || !singlelineArrowBox) {
    throw new Error('Unable to measure the singleline tooltip geometry')
  }

  const singlelineTriggerCenterX = singlelineTriggerBox.x + singlelineTriggerBox.width / 2
  const singlelineArrowCenterX = singlelineArrowBox.x + singlelineArrowBox.width / 2

  expect(
    Math.abs(singlelineTriggerCenterX - singlelineArrowCenterX),
    'singleline tooltip arrow should stay centered over the trigger',
  ).toBeLessThanOrEqual(3)

  const tooltipSurfaceStyles = await tooltip.evaluate((node) => {
    const styles = window.getComputedStyle(node)
    return {
      backgroundColor: styles.backgroundColor,
    }
  })
  const tooltipTextStyles = await tooltipText.evaluate((node) => {
    const styles = window.getComputedStyle(node)
    return {
      color: styles.color,
    }
  })

  const [backgroundRed, backgroundGreen, backgroundBlue] = parseRgbChannels(
    tooltipSurfaceStyles.backgroundColor,
  )
  const [textRed, textGreen, textBlue] = parseRgbChannels(tooltipTextStyles.color)
  const tooltipBackgroundBrightness = backgroundRed + backgroundGreen + backgroundBlue
  const tooltipTextBrightness = textRed + textGreen + textBlue

  expect(
    tooltipBackgroundBrightness,
    'tooltip should keep the light surface used by the React radix-ui-themes package',
  ).toBeGreaterThan(600)
  expect(
    tooltipTextBrightness,
    'tooltip text should remain readable against the light tooltip surface',
  ).toBeLessThan(120)
  expect(
    tooltipBackgroundBrightness,
    'tooltip surface should stay noticeably brighter than the tooltip text',
  ).toBeGreaterThan(tooltipTextBrightness + 400)

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
    tooltipSurfaceStyles.backgroundColor,
  )
  expect(arrowStyles.width, 'tooltip arrow should have a rendered width').toBeGreaterThan(0)
  expect(arrowStyles.height, 'tooltip arrow should have a rendered height').toBeGreaterThan(0)

  await page.mouse.move(8, 8)
  await expect(tooltip).toBeHidden()

  await multilineTrigger.hover()
  await expect(tooltip).toContainText(
    'The goal of typography is to relate font size, line height, and line width',
  )

  const multilineTooltipBox = await tooltip.boundingBox()
  const multilineTriggerBox = await multilineTrigger.boundingBox()
  const multilineSide = await tooltip.getAttribute('data-side')

  expect(multilineSide, 'multiline tooltip should remain above the trigger').toBe('top')
  expect(multilineTooltipBox, 'multiline tooltip should be measurable').not.toBeNull()
  expect(multilineTriggerBox, 'multiline trigger should be measurable').not.toBeNull()

  if (!multilineTooltipBox || !multilineTriggerBox) {
    throw new Error('Unable to measure the multiline tooltip geometry')
  }

  expect(
    multilineTooltipBox.y + multilineTooltipBox.height,
    'multiline tooltip should render above the trigger',
  ).toBeLessThan(multilineTriggerBox.y)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the tooltip demo')
})

test('popover opens on click and closes on outside press', async ({ page }) => {
  const section = await gotoSinkSection(page, 'popover')
  const tracker = trackBrowserErrors(page)
  const trigger = section.getByRole('button', { name: 'Popover' })
  const dialog = page.getByRole('dialog')

  await trigger.click()
  await expect(dialog).toBeVisible()
  await page.mouse.click(8, 8)
  await expect(dialog).toBeHidden()

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the popover demo')
})

test('dropdown menu opens from the trigger and closes on escape', async ({ page }) => {
  const section = await gotoSinkSection(page, 'dropdown-menu')
  const tracker = trackBrowserErrors(page)
  const menuItem = page.getByRole('menuitem', { name: 'New Tab ⌘+T' })
  const menuContent = page.locator('.rt-DropdownMenuContent').first()
  const popperWrapper = page.locator('[data-radix-popper-content-wrapper]').first()
  const triggers = section.locator('table button').filter({ hasText: 'More' })
  const trigger = triggers.first()
  const colorDetails = section
    .locator('details')
    .filter({ hasText: 'See colors & variants combinations' })
    .first()

  await expect(trigger).toBeVisible()
  await trigger.click()
  await expect(menuItem).toBeVisible()
  await expect(popperWrapper).toBeVisible()
  await expect(menuContent).toBeVisible()

  const triggerBox = await trigger.boundingBox()
  const wrapperBox = await popperWrapper.boundingBox()
  const menuBox = await menuContent.boundingBox()

  expect(triggerBox, 'dropdown menu trigger should be measurable').not.toBeNull()
  expect(wrapperBox, 'dropdown menu wrapper should be measurable').not.toBeNull()
  expect(menuBox, 'dropdown menu content should be measurable').not.toBeNull()

  if (!triggerBox || !wrapperBox || !menuBox) {
    throw new Error('Unable to measure dropdown menu geometry')
  }

  expect(
    Math.abs(triggerBox.x - menuBox.x),
    'dropdown menu content should stay aligned with the trigger instead of dropping to the page bottom',
  ).toBeLessThanOrEqual(4)
  expect(
    menuBox.y - (triggerBox.y + triggerBox.height),
    'dropdown menu content should render just below the trigger',
  ).toBeGreaterThanOrEqual(0)
  expect(
    menuBox.y - (triggerBox.y + triggerBox.height),
    'dropdown menu content should stay close to the trigger',
  ).toBeLessThanOrEqual(8)
  expect(
    Math.abs(wrapperBox.width - menuBox.width),
    'dropdown menu content should fill the popper wrapper width',
  ).toBeLessThanOrEqual(1)

  const subTrigger = page.locator('.rt-DropdownMenuSubTrigger').filter({ hasText: 'More Tools' })
  const subContent = page.locator('.rt-DropdownMenuSubContent').first()
  await subTrigger.hover()
  await expect(subTrigger).toHaveAttribute('data-state', 'open')
  await expect(subContent).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Developer Tools' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(subContent).toBeHidden()
  await expect(menuItem).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(menuItem).toBeHidden()
  await expect
    .poll(() =>
      page.evaluate(() => ({
        pointerEvents: document.body.style.pointerEvents,
        scrollLocked: document.body.getAttribute('data-scroll-locked'),
      })),
    )
    .toEqual({ pointerEvents: '', scrollLocked: null })

  await trigger.click()
  await expect(menuItem).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menuItem).toBeHidden()
  await expect
    .poll(() =>
      page.evaluate(() => ({
        pointerEvents: document.body.style.pointerEvents,
        scrollLocked: document.body.getAttribute('data-scroll-locked'),
      })),
    )
    .toEqual({ pointerEvents: '', scrollLocked: null })

  await colorDetails.locator('summary').evaluate((node) => {
    ;(node as HTMLElement).click()
  })
  await expect(colorDetails).toHaveJSProperty('open', true)
  await expect(colorDetails.locator('.rt-TableRoot')).toHaveCount(4)
  await expect(colorDetails.getByRole('button')).toHaveCount(104)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the dropdown menu demo')
})

test('context menu opens on right click and closes on escape', async ({ page }) => {
  const section = await gotoSinkSection(page, 'context-menu')
  const tracker = trackBrowserErrors(page)
  const trigger = section.locator('.rt-Grid').filter({ hasText: 'Right-click here' }).first()
  const menuItem = page.getByRole('menuitem', { name: 'New Tab ⌘+T' })
  const popperWrapper = page.locator('[data-radix-popper-content-wrapper]').first()
  const menuContent = page.locator('.rt-ContextMenuContent').first()

  await trigger.click({ button: 'right' })
  await expect(menuItem).toBeVisible()
  await expect(popperWrapper).toBeVisible()
  await expect(menuContent).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menuItem).toBeHidden()
  await expect
    .poll(() =>
      page.evaluate(() => ({
        pointerEvents: document.body.style.pointerEvents,
        scrollLocked: document.body.getAttribute('data-scroll-locked'),
      })),
    )
    .toEqual({ pointerEvents: '', scrollLocked: null })

  await trigger.click({ button: 'right' })
  await expect(menuItem).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menuItem).toBeHidden()
  await expect
    .poll(() =>
      page.evaluate(() => ({
        pointerEvents: document.body.style.pointerEvents,
        scrollLocked: document.body.getAttribute('data-scroll-locked'),
      })),
    )
    .toEqual({ pointerEvents: '', scrollLocked: null })

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the context menu demo')
})

test('select opens and applies a new value', async ({ page }) => {
  const section = await gotoSinkSection(page, 'select')
  const tracker = trackBrowserErrors(page)
  const listbox = page.getByRole('listbox')
  const trigger = section.locator('.rt-SelectTrigger').first()
  const contentVariantTrigger = section.locator('table').nth(1).locator('.rt-SelectTrigger').first()
  const colorCombinations = section
    .locator('details')
    .filter({ hasText: 'See colors & variants combinations' })

  await expect(trigger).toContainText('Apple')
  await expect(contentVariantTrigger).toContainText('Apple')

  await trigger.click()
  await expect(listbox).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.body.getAttribute('data-scroll-locked')))
    .toBe('1')

  const firstTriggerBox = await trigger.boundingBox()
  const firstListboxBox = await listbox.boundingBox()

  expect(firstTriggerBox, 'first select trigger should be measurable').not.toBeNull()
  expect(firstListboxBox, 'first select listbox should be measurable').not.toBeNull()

  if (!firstTriggerBox || !firstListboxBox) {
    throw new Error('Unable to measure first select geometry')
  }

  expect(
    firstListboxBox.y,
    'first select content should open inside the current viewport instead of at the page bottom',
  ).toBeGreaterThanOrEqual(0)
  expect(
    firstListboxBox.y,
    'first select content should stay visible in the current viewport',
  ).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0)
  expect(
    Math.abs(firstTriggerBox.x - firstListboxBox.x),
    'first select content should stay aligned with the trigger',
  ).toBeLessThanOrEqual(4)
  expect(
    firstListboxBox.y - (firstTriggerBox.y + firstTriggerBox.height),
    'first select content should render just below the trigger',
  ).toBeLessThanOrEqual(8)

  const orangeOption = page.getByRole('option', { name: 'Orange' })
  await orangeOption.hover()
  await expect(orangeOption).toHaveAttribute('data-highlighted', '')
  await orangeOption.click()
  await expect(trigger).toContainText('Orange')
  await expect(listbox).toBeHidden()
  await expect
    .poll(() => page.evaluate(() => document.body.getAttribute('data-scroll-locked')))
    .toBeNull()

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('table')).toHaveCount(4)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  await contentVariantTrigger.click()
  await expect(listbox).toBeVisible()

  const selectPopperWrapper = page.locator('[data-radix-popper-content-wrapper]').last()
  await expect(selectPopperWrapper).toBeVisible()

  const triggerBox = await contentVariantTrigger.boundingBox()
  const wrapperBox = await selectPopperWrapper.boundingBox()
  const listboxBox = await listbox.boundingBox()

  expect(triggerBox, 'select trigger should be measurable').not.toBeNull()
  expect(wrapperBox, 'select popper wrapper should be measurable').not.toBeNull()
  expect(listboxBox, 'select listbox should be measurable').not.toBeNull()

  if (!triggerBox || !wrapperBox || !listboxBox) {
    throw new Error('Unable to measure select popper geometry')
  }

  expect(
    Math.abs(triggerBox.x - listboxBox.x),
    'select content should stay aligned with the trigger',
  ).toBeLessThanOrEqual(4)
  expect(
    listboxBox.y - (triggerBox.y + triggerBox.height),
    'select content should render just below the trigger',
  ).toBeGreaterThanOrEqual(0)
  expect(
    listboxBox.y - (triggerBox.y + triggerBox.height),
    'select content should stay close to the trigger',
  ).toBeLessThanOrEqual(8)
  expect(
    Math.abs(wrapperBox.width - listboxBox.width),
    'select content should fill the popper wrapper width',
  ).toBeLessThanOrEqual(1)

  await page.keyboard.press('Escape')
  await expect(listbox).toBeHidden()
  await expect
    .poll(() => page.evaluate(() => document.body.getAttribute('data-scroll-locked')))
    .toBeNull()

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the select demo')
})
