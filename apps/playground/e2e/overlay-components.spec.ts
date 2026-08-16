import { expect, test, type Locator, type Page } from '@playwright/test'

import { expectTrackedBrowserErrors, gotoSinkSection, trackBrowserErrors } from './support'

function parseRgbChannels(color: string) {
  const matches = color.match(/\d+(?:\.\d+)?/g)
  if (!matches || matches.length < 3) {
    throw new Error(`Unable to parse RGB color: ${color}`)
  }

  return matches.slice(0, 3).map(Number)
}

async function expectStableSubmenuMotion(subContent: Locator) {
  const motion = await subContent.evaluate((node) => {
    const styles = getComputedStyle(node)

    return {
      animationName: styles.animationName,
      transform: styles.transform,
    }
  })

  expect(
    motion.animationName,
    'submenu content should avoid slide/scale motion that shifts its hover anchor while opening',
  ).not.toContain('rt-slide')
  expect(
    motion.transform,
    'submenu content should not animate transform because the wrapper already owns positioning',
  ).toBe('none')
}

async function waitForElementAnimations(element: Locator) {
  await element.evaluate(async (node) => {
    await Promise.allSettled(node.getAnimations().map((animation) => animation.finished))
  })
}

async function expectSubmenuDoesNotFlickerWhileMovingWithinTrigger(
  page: Page,
  subTrigger: Locator,
  triggerSelector: string,
  contentSelector: string,
  label: string,
) {
  const subTriggerBox = await subTrigger.boundingBox()
  expect(subTriggerBox, `${label} submenu trigger should be measurable`).not.toBeNull()

  if (!subTriggerBox) {
    throw new Error(`Unable to measure the ${label} submenu trigger`)
  }

  await page.evaluate(
    ({ contentSelector: contentSelectorValue, triggerSelector: triggerSelectorValue }) => {
      const win = window as Window & {
        __submenuFlickerObserver?: MutationObserver
        __submenuFlickerSnapshots?: Array<{ present: boolean; state: string | null }>
      }

      win.__submenuFlickerObserver?.disconnect()
      win.__submenuFlickerSnapshots = []

      const record = () => {
        win.__submenuFlickerSnapshots?.push({
          present: Boolean(document.querySelector(contentSelectorValue)),
          state: document.querySelector(triggerSelectorValue)?.getAttribute('data-state') ?? null,
        })
      }

      win.__submenuFlickerObserver = new MutationObserver(record)
      win.__submenuFlickerObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-state'],
        childList: true,
        subtree: true,
      })
    },
    { contentSelector, triggerSelector },
  )

  for (let index = 0; index < 30; index += 1) {
    const xOffset = 8 + (index % Math.max(1, Math.floor(subTriggerBox.width - 16)))
    const yOffset = subTriggerBox.height / 2 + ((index % 3) - 1)
    await page.mouse.move(subTriggerBox.x + xOffset, subTriggerBox.y + yOffset)
  }

  await page.waitForTimeout(120)

  const snapshots = await page.evaluate(() => {
    const win = window as Window & {
      __submenuFlickerObserver?: MutationObserver
      __submenuFlickerSnapshots?: Array<{ present: boolean; state: string | null }>
    }
    win.__submenuFlickerObserver?.disconnect()
    return win.__submenuFlickerSnapshots ?? []
  })
  const closedSnapshots = snapshots.filter(
    (snapshot) => !snapshot.present || snapshot.state !== 'open',
  )

  expect(
    closedSnapshots,
    `${label} submenu should stay open while the pointer moves within its trigger`,
  ).toEqual([])
}

async function expectSubmenuAdjacentToTrigger(
  subTrigger: Locator,
  subContent: Locator,
  label: string,
) {
  const subTriggerBox = await subTrigger.boundingBox()
  const subContentBox = await subContent.boundingBox()
  const side = await subContent.getAttribute('data-side')

  expect(subTriggerBox, `${label} submenu trigger should be measurable`).not.toBeNull()
  expect(subContentBox, `${label} submenu content should be measurable`).not.toBeNull()
  expect(['left', 'right'], `${label} submenu should report its placed side`).toContain(side)

  if (!subTriggerBox || !subContentBox || (side !== 'left' && side !== 'right')) {
    throw new Error(`Unable to measure ${label} submenu geometry`)
  }

  const gap =
    side === 'left'
      ? subTriggerBox.x - (subContentBox.x + subContentBox.width)
      : subContentBox.x - (subTriggerBox.x + subTriggerBox.width)

  expect(gap, `${label} submenu should render on its reported side`).toBeGreaterThanOrEqual(0)
  expect(gap, `${label} submenu should stay close to its trigger`).toBeLessThanOrEqual(8)
  expect(
    Math.abs(subContentBox.y - subTriggerBox.y),
    `${label} submenu should align with its trigger top edge`,
  ).toBeLessThanOrEqual(4)
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

test('tooltip flips below the trigger when there is no room above', async ({ page }) => {
  const section = await gotoSinkSection(page, 'tooltip')
  const tracker = trackBrowserErrors(page)
  const trigger = section.getByRole('button', { name: 'Singleline' })
  const tooltip = page.locator('.rt-TooltipContent')
  const arrow = page.locator('.rt-TooltipArrow')

  await trigger.evaluate((node) => {
    node.style.position = 'fixed'
    node.style.top = '2px'
    node.style.left = '120px'
    node.style.zIndex = '1'
  })

  await trigger.hover()
  await expect(tooltip).toBeVisible()
  await expect(arrow).toBeVisible()
  await expect(tooltip).toHaveAttribute('data-side', 'bottom')

  const triggerBox = await trigger.boundingBox()
  const tooltipBox = await tooltip.boundingBox()
  const arrowBox = await arrow.boundingBox()

  expect(triggerBox, 'tooltip trigger should be measurable near the viewport top').not.toBeNull()
  expect(tooltipBox, 'flipped tooltip should be measurable').not.toBeNull()
  expect(arrowBox, 'flipped tooltip arrow should be measurable').not.toBeNull()

  if (!triggerBox || !tooltipBox || !arrowBox) {
    throw new Error('Unable to measure the flipped tooltip geometry')
  }

  expect(
    tooltipBox.y,
    'tooltip should render below a trigger that is too close to the viewport top',
  ).toBeGreaterThan(triggerBox.y + triggerBox.height)
  expect(
    arrowBox.y + arrowBox.height,
    'bottom-side tooltip arrow should sit on the tooltip top edge',
  ).toBeLessThanOrEqual(tooltipBox.y + 2)

  tracker.stop()
  expectTrackedBrowserErrors(tracker, 'testing tooltip collision flipping')
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
  await waitForElementAnimations(menuContent)

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
  const developerToolsItem = subContent.getByRole('menuitem', { name: 'Developer Tools' })
  await subTrigger.hover()
  await expect(subTrigger).toHaveAttribute('data-state', 'open')
  await expect(subContent).toBeVisible()
  await expect(developerToolsItem).toBeVisible()
  await expectStableSubmenuMotion(subContent)
  await expect(
    subContent.locator('[role="menuitem"][data-highlighted]'),
    'dropdown submenu should not pre-highlight an item before the pointer enters it',
  ).toHaveCount(0)
  await expectSubmenuDoesNotFlickerWhileMovingWithinTrigger(
    page,
    subTrigger,
    '.rt-DropdownMenuSubTrigger',
    '.rt-DropdownMenuSubContent',
    'dropdown',
  )
  await developerToolsItem.hover()
  await expect(developerToolsItem).toHaveAttribute('data-highlighted', '')

  await expectSubmenuAdjacentToTrigger(subTrigger, subContent, 'dropdown')

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

  await trigger.evaluate((node) => {
    node.style.position = 'fixed'
    node.style.bottom = '2px'
    node.style.left = '120px'
    node.style.zIndex = '1'
  })

  const bottomTriggerBox = await trigger.boundingBox()
  expect(bottomTriggerBox, 'bottom dropdown menu trigger should be measurable').not.toBeNull()

  if (!bottomTriggerBox) {
    throw new Error('Unable to measure bottom dropdown menu trigger geometry')
  }

  expect(
    bottomTriggerBox.y + bottomTriggerBox.height,
    'bottom dropdown menu trigger should be near the viewport bottom before opening',
  ).toBeGreaterThan((page.viewportSize()?.height ?? 0) - 80)

  await trigger.click()
  await expect(menuContent).toBeVisible()
  await expect(menuContent).toHaveAttribute('data-side', 'top')

  const flippedMenuBox = await menuContent.boundingBox()
  expect(flippedMenuBox, 'flipped dropdown menu content should be measurable').not.toBeNull()

  if (!flippedMenuBox) {
    throw new Error('Unable to measure flipped dropdown menu geometry')
  }

  expect(
    flippedMenuBox.y,
    'flipped dropdown menu should stay inside the top edge of the viewport',
  ).toBeGreaterThanOrEqual(0)
  expect(
    flippedMenuBox.y + flippedMenuBox.height,
    'dropdown menu should flip above a trigger near the viewport bottom',
  ).toBeLessThanOrEqual(bottomTriggerBox.y)

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

  const subTrigger = page.locator('.rt-ContextMenuSubTrigger').filter({ hasText: 'More Tools' })
  const subContent = page.locator('.rt-ContextMenuSubContent').first()
  const developerToolsItem = subContent.getByRole('menuitem', { name: 'Developer Tools' })

  await subTrigger.hover()
  await expect(subTrigger).toHaveAttribute('data-state', 'open')
  await expect(subContent).toBeVisible()
  await expect(developerToolsItem).toBeVisible()
  await expectStableSubmenuMotion(subContent)
  await expect(
    subContent.locator('[role="menuitem"][data-highlighted]'),
    'context submenu should not pre-highlight an item before the pointer enters it',
  ).toHaveCount(0)
  await expectSubmenuDoesNotFlickerWhileMovingWithinTrigger(
    page,
    subTrigger,
    '.rt-ContextMenuSubTrigger',
    '.rt-ContextMenuSubContent',
    'context',
  )
  await developerToolsItem.hover()
  await expect(developerToolsItem).toHaveAttribute('data-highlighted', '')

  await expectSubmenuAdjacentToTrigger(subTrigger, subContent, 'context')

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

  await trigger.evaluate((node) => {
    node.style.position = 'fixed'
    node.style.bottom = '2px'
    node.style.left = '120px'
    node.style.zIndex = '1'
  })

  const bottomContextTriggerBox = await trigger.boundingBox()
  expect(bottomContextTriggerBox, 'bottom context menu trigger should be measurable').not.toBeNull()

  if (!bottomContextTriggerBox) {
    throw new Error('Unable to measure bottom context menu trigger geometry')
  }

  const viewportHeight = page.viewportSize()?.height ?? 0
  const contextClickX = bottomContextTriggerBox.x + bottomContextTriggerBox.width / 2
  const contextClickY = Math.min(
    viewportHeight - 4,
    bottomContextTriggerBox.y + bottomContextTriggerBox.height - 4,
  )

  expect(
    contextClickY,
    'context menu right-click point should be near the viewport bottom before opening',
  ).toBeGreaterThan(viewportHeight - 80)

  await page.mouse.click(contextClickX, contextClickY, { button: 'right' })
  await expect(menuContent).toBeVisible()

  const bottomContextMenuBox = await menuContent.boundingBox()
  expect(bottomContextMenuBox, 'bottom context menu content should be measurable').not.toBeNull()

  if (!bottomContextMenuBox) {
    throw new Error('Unable to measure bottom context menu geometry')
  }

  expect(
    bottomContextMenuBox.y,
    'context menu should stay inside the top edge of the viewport',
  ).toBeGreaterThanOrEqual(0)
  expect(
    bottomContextMenuBox.y + bottomContextMenuBox.height,
    'context menu should stay inside the bottom edge of the viewport',
  ).toBeLessThanOrEqual(viewportHeight)

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

  await trigger.evaluate((node) => {
    node.style.position = 'fixed'
    node.style.bottom = '2px'
    node.style.left = '120px'
    node.style.zIndex = '1'
  })

  const bottomTriggerBox = await trigger.boundingBox()
  expect(bottomTriggerBox, 'bottom select trigger should be measurable').not.toBeNull()

  if (!bottomTriggerBox) {
    throw new Error('Unable to measure bottom select trigger geometry')
  }

  expect(
    bottomTriggerBox.y + bottomTriggerBox.height,
    'bottom select trigger should be near the viewport bottom before opening',
  ).toBeGreaterThan((page.viewportSize()?.height ?? 0) - 80)

  await trigger.click()
  await expect(listbox).toBeVisible()
  await expect(listbox).toHaveAttribute('data-side', 'top')

  const topListboxBox = await listbox.boundingBox()
  expect(topListboxBox, 'flipped select listbox should be measurable').not.toBeNull()

  if (!topListboxBox) {
    throw new Error('Unable to measure flipped select listbox geometry')
  }

  expect(
    topListboxBox.y,
    'flipped select content should stay inside the top edge of the viewport',
  ).toBeGreaterThanOrEqual(0)
  expect(
    topListboxBox.y + topListboxBox.height,
    'select content should flip above a trigger near the viewport bottom',
  ).toBeLessThanOrEqual(bottomTriggerBox.y)

  await page.keyboard.press('Escape')
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
  await waitForElementAnimations(listbox)

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
