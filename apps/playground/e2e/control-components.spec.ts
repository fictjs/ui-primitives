import { expect, test } from '@playwright/test'

import { expectTrackedBrowserErrors, gotoSinkSection, trackBrowserErrors } from './support'

test('checkbox toggles from its labeled example', async ({ page }) => {
  const section = await gotoSinkSection(page, 'checkbox')
  const tracker = trackBrowserErrors(page)
  const checkbox = section.getByRole('checkbox', { name: 'Agree to Terms and Conditions' }).first()
  const colorCombinations = section.locator('details').first()

  await expect(checkbox).not.toBeChecked()
  await checkbox.click()
  await expect(checkbox).toBeChecked()

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('table')).toHaveCount(4)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the checkbox demo')
})

test('switch toggles from its labeled example', async ({ page }) => {
  const section = await gotoSinkSection(page, 'switch')
  const tracker = trackBrowserErrors(page)
  const control = section.getByRole('switch', { name: 'Agree to Terms and Conditions' }).first()
  const colorCombinations = section.locator('details').nth(1)

  await expect(control).not.toBeChecked()
  await control.click()
  await expect(control).toBeChecked()

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('table')).toHaveCount(4)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the switch demo')
})

test('checkbox group can add another selected value', async ({ page }) => {
  const section = await gotoSinkSection(page, 'checkbox-group')
  const tracker = trackBrowserErrors(page)
  const first = section.getByRole('checkbox', { name: 'Agree to Terms and Conditions' }).first()
  const second = section.getByRole('checkbox', { name: 'Agree to Privacy Policy' }).first()
  const colorCombinations = section.locator('details').first()

  await expect(first).toBeChecked()
  await expect(second).not.toBeChecked()
  await second.click()
  await expect(first).toBeChecked()
  await expect(second).toBeChecked()

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('table')).toHaveCount(4)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the checkbox group demo')
})

test('radio switches selection in the labeled example', async ({ page }) => {
  const section = await gotoSinkSection(page, 'radio')
  const tracker = trackBrowserErrors(page)
  const first = section.getByRole('radio', { name: 'Agree to Terms and Conditions' }).first()
  const second = section.getByRole('radio', { name: 'Disagree with Terms and Conditions' }).first()
  const colorCombinations = section.locator('details').first()

  await expect(first).toBeChecked()
  await expect(second).not.toBeChecked()
  await second.click()
  await expect(first).not.toBeChecked()
  await expect(second).toBeChecked()

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('table')).toHaveCount(4)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the radio demo')
})

test('radio group switches selection in the labeled example', async ({ page }) => {
  const section = await gotoSinkSection(page, 'radio-group')
  const tracker = trackBrowserErrors(page)
  const first = section.getByRole('radio', { name: 'Agree to Terms and Conditions' }).first()
  const second = section.getByRole('radio', { name: 'Disagree with Terms and Conditions' }).first()
  const colorCombinations = section.locator('details').first()

  await expect(first).toBeChecked()
  await expect(second).not.toBeChecked()
  await second.click()
  await expect(first).not.toBeChecked()
  await expect(second).toBeChecked()

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('table')).toHaveCount(4)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the radio group demo')
})

test('checkbox cards support toggling an additional card', async ({ page }) => {
  const section = await gotoSinkSection(page, 'checkbox-cards')
  const tracker = trackBrowserErrors(page)
  const demo = section.locator('.rt-CheckboxCardsRoot').first()
  const checkbox = demo
    .locator('.rt-CheckboxCardsItem')
    .filter({ hasText: 'Go' })
    .getByRole('checkbox')
  const colorCombinations = section.locator('details').first()

  await expect(checkbox).not.toBeChecked()
  await checkbox.press(' ')
  await expect(checkbox).toBeChecked()
  await checkbox.press(' ')
  await expect(checkbox).not.toBeChecked()

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('table')).toHaveCount(4)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the checkbox cards demo')
})

test('radio cards move selection to a new card', async ({ page }) => {
  const section = await gotoSinkSection(page, 'radio-cards')
  const tracker = trackBrowserErrors(page)
  const demo = section.locator('.rt-RadioCardsRoot').first()
  const colorCombinations = section
    .locator('details')
    .filter({ hasText: 'See colors & variants combinations' })
  const node = demo.getByRole('radio', { name: 'Node.js' })
  const go = demo.getByRole('radio', { name: 'Go' })

  await expect(node).toBeChecked()
  await expect(go).not.toBeChecked()
  await go.evaluate((element: HTMLButtonElement) => {
    element.click()
  })
  await expect(node).not.toBeChecked()
  await expect(go).toBeChecked()

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('table')).toHaveCount(4)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the radio cards demo')
})

test('slider responds to keyboard input', async ({ page }) => {
  const section = await gotoSinkSection(page, 'slider')
  const tracker = trackBrowserErrors(page)
  const slider = section.getByRole('slider').first()
  const colorCombinations = section.locator('details').filter({ hasText: 'See colors' })
  const before = Number(await slider.getAttribute('aria-valuenow'))
  const beforePosition = await slider.evaluate((element) => {
    const wrapper = element.parentElement
    return {
      left: wrapper?.style.left ?? '',
      x: wrapper?.getBoundingClientRect().x ?? 0,
    }
  })

  await slider.focus()
  await page.keyboard.press('ArrowRight')

  const after = Number(await slider.getAttribute('aria-valuenow'))
  const afterPosition = await slider.evaluate((element) => {
    const wrapper = element.parentElement
    return {
      left: wrapper?.style.left ?? '',
      x: wrapper?.getBoundingClientRect().x ?? 0,
    }
  })
  expect(after).toBeGreaterThan(before)
  expect(beforePosition.left).toContain(`${before}%`)
  expect(afterPosition.left).toContain(`${after}%`)
  expect(afterPosition.left).not.toBe(beforePosition.left)
  expect(afterPosition.x).toBeGreaterThan(beforePosition.x)

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('table')).toHaveCount(4)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the slider demo')
})

test('tabs switch their active panel', async ({ page }) => {
  const section = await gotoSinkSection(page, 'tabs')
  const tracker = trackBrowserErrors(page)
  const demo = section.locator('.rt-TabsRoot').first()
  const colorCombinations = section.locator('details').filter({ hasText: 'See color combinations' })
  const documentsTab = demo.getByRole('tab', { name: 'Documents' })
  const tabpanel = demo.getByRole('tabpanel')

  await documentsTab.press('Enter')
  await expect(documentsTab).toHaveAttribute('aria-selected', 'true')
  await expect(tabpanel).toContainText('Documents')

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('.rt-TabsRoot')).not.toHaveCount(0)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the tabs demo')
})

test('tab nav updates the active link when a new tab is selected', async ({ page }) => {
  const section = await gotoSinkSection(page, 'tab-nav')
  const tracker = trackBrowserErrors(page)
  const demo = section.locator('.rt-TabNavRoot').first()
  const colorCombinations = section.locator('details').filter({ hasText: 'See color combinations' })
  const account = demo.getByRole('link', { name: 'Account' })
  const documents = demo.getByRole('link', { name: 'Documents' })

  await expect(demo.locator('.rt-TabNavLink[data-active]')).toHaveCount(1)
  await expect(account).toHaveAttribute('data-active', '')
  await expect(documents).not.toHaveAttribute('data-active', /.*/)
  await documents.press('Enter')
  await expect(demo.locator('.rt-TabNavLink[data-active]')).toHaveCount(1)
  await expect(account).not.toHaveAttribute('data-active', /.*/)
  await expect(documents).toHaveAttribute('data-active', '')

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('.rt-TabNavRoot')).not.toHaveCount(0)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the tab nav demo')
})

test('segmented control updates the active item', async ({ page }) => {
  const section = await gotoSinkSection(page, 'segmented-control')
  const tracker = trackBrowserErrors(page)
  const demo = section.locator('.rt-SegmentedControlRoot').nth(1)
  const one = demo.getByRole('radio', { name: 'One' })
  const two = demo.getByRole('radio', { name: 'Two' })

  await expect(one).toHaveAttribute('data-state', 'on')
  await expect(two).toHaveAttribute('data-state', 'off')
  await two.evaluate((element: HTMLButtonElement) => {
    element.click()
  })
  await expect(one).toHaveAttribute('data-state', 'off')
  await expect(two).toHaveAttribute('data-state', 'on')

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the segmented control demo')
})

test('text field accepts typed input', async ({ page }) => {
  const section = await gotoSinkSection(page, 'text-field')
  const tracker = trackBrowserErrors(page)
  const input = section.getByPlaceholder('Your name').first()
  const colorCombinations = section
    .locator('details')
    .filter({ hasText: 'See colors & variants combinations' })
  const readonlyInput = section.locator('input[readonly]').first()

  await input.fill('Ada Lovelace')
  await expect(input).toHaveValue('Ada Lovelace')
  await expect(readonlyInput).toHaveJSProperty('readOnly', true)

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('table')).toHaveCount(4)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the text field demo')
})

test('text area accepts typed input', async ({ page }) => {
  const section = await gotoSinkSection(page, 'text-area')
  const tracker = trackBrowserErrors(page)
  const textarea = section.getByPlaceholder('Your feedback').first()
  const colorCombinations = section
    .locator('details')
    .filter({ hasText: 'See colors & variants combinations' })
  const readonlyTextarea = section.locator('textarea[readonly]').first()

  await textarea.fill('Looks good')
  await expect(textarea).toHaveValue('Looks good')
  await expect(readonlyTextarea).toHaveJSProperty('readOnly', true)

  await colorCombinations.locator('summary').click()
  await expect(colorCombinations).toHaveAttribute('open', '')
  await expect(colorCombinations.locator('table')).toHaveCount(4)
  await expect(section.locator('[style*="display: contents"]')).toHaveCount(0)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing the text area demo')
})
