import { expect, test, type Locator, type Page } from '@playwright/test'

type PackageCase = {
  slug: string
  assert: (page: Page, main: Locator) => Promise<void>
}

type RuntimeTracker = {
  errors: string[]
}

function trackRuntimeErrors(page: Page): RuntimeTracker {
  const errors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  return { errors }
}

function expectNoRuntimeErrors(tracker: RuntimeTracker): void {
  expect(tracker.errors).toEqual([])
}

async function openPackagePage(page: Page, slug: string): Promise<Locator> {
  await page.goto(`/#/package/${slug}`)

  const pageRoot = page.locator(`[data-page-kind="package"][data-page-slug="${slug}"]`)
  await expect(pageRoot).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: slug })).toBeVisible()
  await expect(page.getByText(`packages/${slug}`, { exact: false })).toBeVisible()

  const main = page.locator('.detail-main')
  await expect(main.locator('.demo-card')).toHaveCount(1)

  return main
}

const packageCases: PackageCase[] = [
  {
    slug: 'accessible-icon',
    assert: async (page, main) => {
      await expect(main.getByRole('button', { name: 'Close panel' })).toBeVisible()
    },
  },
  {
    slug: 'label',
    assert: async (page, main) => {
      await expect(main.getByLabel('Release query')).toHaveValue('overlay')
    },
  },
  {
    slug: 'separator',
    assert: async (page, main) => {
      await expect(main.getByRole('separator')).toBeVisible()
    },
  },
  {
    slug: 'visually-hidden',
    assert: async (page, main) => {
      await expect(main.getByRole('button', { name: 'Open release help' })).toBeVisible()
    },
  },
  {
    slug: 'aspect-ratio',
    assert: async (page, main) => {
      const box = await main.locator('.aspect-frame').boundingBox()
      expect(box).not.toBeNull()
      const ratio = (box?.width ?? 1) / (box?.height ?? 1)
      expect(ratio).toBeGreaterThan(1.65)
      expect(ratio).toBeLessThan(1.9)
    },
  },
  {
    slug: 'avatar',
    assert: async (page, main) => {
      const width = await main.getByRole('img', { name: 'Fict avatar' }).evaluate((node) => {
        return (node as HTMLImageElement).naturalWidth
      })
      expect(width).toBeGreaterThan(0)
    },
  },
  {
    slug: 'slot',
    assert: async (page, main) => {
      await expect(main.getByRole('button', { name: 'left center right' })).toBeVisible()
    },
  },
  {
    slug: 'portal',
    assert: async (page, main) => {
      await expect(main.locator('.portal-host').getByText('Portaled into local host')).toBeVisible()
    },
  },
  {
    slug: 'direction',
    assert: async (page, main) => {
      await expect(main.getByText('LTR')).toBeVisible()
      await expect(main.getByText('RTL')).toBeVisible()
    },
  },
  {
    slug: 'progress',
    assert: async (page, main) => {
      const progress = main.locator('.progress-root')
      await expect(progress).toHaveAttribute('data-value', '64')
      await main.getByRole('button', { name: 'Advance' }).click()
      await expect(progress).toHaveAttribute('data-value', '76')
    },
  },
  {
    slug: 'scroll-area',
    assert: async (page, main) => {
      const viewport = main.locator('.scroll-viewport')
      await viewport.evaluate((node) => {
        const element = node as HTMLElement
        element.scrollTop = 120
        element.scrollLeft = 40
      })
      await expect
        .poll(async () => {
          return await viewport.evaluate((node) => (node as HTMLElement).scrollTop)
        })
        .toBeGreaterThan(0)
    },
  },
  {
    slug: 'accordion',
    assert: async (page, main) => {
      await main.getByRole('button', { name: 'Portal layering' }).click()
      await expect(
        main.getByText(
          'Dialog, hover-card, popover, and toast all reuse the same portal and presence spine.',
        ),
      ).toBeVisible()
    },
  },
  {
    slug: 'collapsible',
    assert: async (page, main) => {
      const trigger = main.getByRole('button', { name: 'Toggle implementation note' })
      await trigger.click()
      await expect(
        main.getByText(
          'Collapsible exposes the lower-level open-state contract that accordion layers on top.',
        ),
      ).toBeVisible()
      await trigger.click()
      await expect(
        main.getByText(
          'Collapsible exposes the lower-level open-state contract that accordion layers on top.',
        ),
      ).toBeHidden()
    },
  },
  {
    slug: 'tabs',
    assert: async (page, main) => {
      await main.getByRole('tab', { name: 'A11y' }).click()
      await expect(
        main.getByText(
          'Roles, labels, focus movement, dismissal behavior, and hidden content are carried over.',
        ),
      ).toBeVisible()
    },
  },
  {
    slug: 'checkbox',
    assert: async (page, main) => {
      const checkbox = main.getByRole('checkbox', { name: 'Enable previews' })
      await expect(checkbox).toHaveAttribute('data-state', 'checked')
      await checkbox.click()
      await expect(checkbox).toHaveAttribute('data-state', 'unchecked')
    },
  },
  {
    slug: 'switch',
    assert: async (page, main) => {
      const control = main.getByRole('switch', { name: 'Enable release notifications' })
      await expect(control).toHaveAttribute('data-state', 'checked')
      await control.click()
      await expect(control).toHaveAttribute('data-state', 'unchecked')
      await expect(main.getByText('Notifications muted')).toBeVisible()
    },
  },
  {
    slug: 'radio-group',
    assert: async (page, main) => {
      const alpha = main.getByRole('radio', { name: 'Alpha' })
      await alpha.click()
      await expect(alpha).toHaveAttribute('data-state', 'checked')
    },
  },
  {
    slug: 'slider',
    assert: async (page, main) => {
      const slider = main.getByRole('slider', { name: 'Preview density' })
      await slider.focus()
      await slider.press('ArrowRight')
      await expect(main.getByText('Density target: 43%')).toBeVisible()
    },
  },
  {
    slug: 'toggle',
    assert: async (page, main) => {
      const toggle = main.getByRole('button', { name: 'Pin release notes' })
      await expect(toggle).toHaveAttribute('data-state', 'on')
      await toggle.click()
      await expect(toggle).toHaveAttribute('data-state', 'off')
      await expect(main.getByText('Unpinned')).toBeVisible()
    },
  },
  {
    slug: 'toggle-group',
    assert: async (page, main) => {
      const bold = main.getByRole('button', { name: 'Bold' })
      await bold.click()
      await expect(bold).toHaveAttribute('data-state', 'on')
    },
  },
  {
    slug: 'form',
    assert: async (page, main) => {
      await main.getByRole('button', { name: 'Submit form' }).click()
      await expect(main.getByText('Email is required')).toBeVisible()
    },
  },
  {
    slug: 'one-time-password-field',
    assert: async (page, main) => {
      const inputs = main.locator('.otp-row input')
      await inputs.nth(0).fill('1')
      await inputs.nth(1).fill('2')
      await inputs.nth(2).fill('3')
      await inputs.nth(3).fill('4')
      await expect(main.locator('input[name="verification-code"]')).toHaveValue('1234')
    },
  },
  {
    slug: 'password-toggle-field',
    assert: async (page, main) => {
      const input = main.locator('.password-shell input')
      await expect(input).toHaveAttribute('type', 'password')
      await main.getByRole('button', { name: 'Reveal' }).click()
      await expect(input).toHaveAttribute('type', 'text')
      await expect(main.getByText('Currently visible')).toBeVisible()
    },
  },
  {
    slug: 'navigation-menu',
    assert: async (page, main) => {
      await main.getByRole('button', { name: 'Systems' }).click()
      await expect(
        main.getByText(
          'Core utilities stay small while dialog, select, and menubar build from the same internal pieces.',
        ),
      ).toBeVisible()
    },
  },
  {
    slug: 'select',
    assert: async (page, main) => {
      await main.locator('.select-trigger').click()
      await page.getByText('Stable channel').click()
      await expect(main.getByText('Current release lane: stable')).toBeVisible()
    },
  },
  {
    slug: 'dropdown-menu',
    assert: async (page, main) => {
      await main.getByRole('button', { name: 'Open actions' }).click()
      await expect(page.getByText('Build current package')).toBeVisible()
    },
  },
  {
    slug: 'context-menu',
    assert: async (page, main) => {
      await main.locator('.context-zone').click({ button: 'right' })
      await expect(page.getByText('Run local preview build')).toBeVisible()
    },
  },
  {
    slug: 'menubar',
    assert: async (page, main) => {
      await main.getByRole('menuitem', { name: 'File' }).click()
      await expect(page.getByText('New file')).toBeVisible()
    },
  },
  {
    slug: 'toolbar',
    assert: async (page, main) => {
      const list = main.getByRole('radio', { name: 'List' })
      await list.click()
      await expect(list).toHaveAttribute('aria-checked', 'true')
    },
  },
  {
    slug: 'dialog',
    assert: async (page, main) => {
      await main.getByRole('button', { name: 'Open release dialog' }).click()
      const dialog = page.locator('[role="dialog"]')
      await expect(dialog.getByText('Ship a primitive with confidence')).toBeVisible()
      await dialog.getByText('Close', { exact: true }).click()
      await expect(dialog).toBeHidden()
    },
  },
  {
    slug: 'alert-dialog',
    assert: async (page, main) => {
      await main.getByRole('button', { name: 'Open alert dialog' }).click()
      const alertDialog = page.locator('[role="alertdialog"]')
      await expect(alertDialog.getByText('Delete the generated preview?')).toBeVisible()
      await alertDialog.getByText('Cancel', { exact: true }).click()
      await expect(alertDialog).toBeHidden()
    },
  },
  {
    slug: 'popover',
    assert: async (page, main) => {
      await main.getByRole('button', { name: 'Open popover' }).click()
      await expect(
        page.getByText('Anchored content can host forms, actions, or diagnostics.'),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Dismiss' }).click()
      await expect(
        page.getByText('Anchored content can host forms, actions, or diagnostics.'),
      ).toBeHidden()
    },
  },
  {
    slug: 'hover-card',
    assert: async (page, main) => {
      await main.getByRole('link', { name: '@fictjs hover preview' }).hover()
      await expect(
        page.getByText('Pointer-driven surface for rich previews without fully opening a dialog.'),
      ).toBeVisible()
    },
  },
  {
    slug: 'tooltip',
    assert: async (page, main) => {
      await main.getByRole('button', { name: 'Hover for tooltip' }).hover()
      await expect(page.getByText('Fast status detail')).toBeVisible()
    },
  },
  {
    slug: 'toast',
    assert: async (page, main) => {
      await main.getByRole('button', { name: 'Queue toast' }).click()
      await expect(page.getByText('Preview site ready')).toBeVisible()
      await page.getByRole('button', { name: 'Dismiss' }).click()
      await expect(page.getByText('Preview site ready')).toBeHidden()
    },
  },
]

test('overview route filters package navigation', async ({ page }) => {
  const tracker = trackRuntimeErrors(page)

  await page.goto('/#/overview')
  await expect(page.locator('[data-page-kind="overview"]')).toBeVisible()

  const search = page.getByRole('searchbox', { name: 'Filter packages' })
  await search.fill('dialog')

  await expect(page.getByRole('link', { name: /^dialog /i })).toBeVisible()
  await expect(page.getByRole('link', { name: /^tooltip /i })).toBeHidden()

  expectNoRuntimeErrors(tracker)
})

for (const packageCase of packageCases) {
  test(`package route for ${packageCase.slug} works`, async ({ page }) => {
    const tracker = trackRuntimeErrors(page)
    const main = await openPackagePage(page, packageCase.slug)

    await packageCase.assert(page, main)
    expectNoRuntimeErrors(tracker)
  })
}
