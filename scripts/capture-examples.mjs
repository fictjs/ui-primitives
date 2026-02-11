import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, rm } from 'node:fs/promises'
import { request } from 'node:http'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

const proc = globalThis.process
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = join(rootDir, 'examples', 'screenshots', 'baseline')
const baseUrl = 'http://127.0.0.1:4173'

function sleep(ms) {
  return new Promise(resolveSleep => {
    globalThis.setTimeout(resolveSleep, ms)
  })
}

function probe(url) {
  return new Promise(resolveProbe => {
    const req = request(url, { method: 'GET' }, response => {
      response.resume()
      resolveProbe(Boolean(response.statusCode && response.statusCode >= 200 && response.statusCode < 500))
    })

    req.on('error', () => resolveProbe(false))
    req.end()
  })
}

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (await probe(url)) {
      return
    }

    await sleep(250)
  }

  throw new Error(`Timed out waiting for ${url}`)
}

async function waitForFrames(page, count = 2) {
  await page.evaluate(async frameCount => {
    for (let i = 0; i < frameCount; i += 1) {
      await new Promise(resolveFrame => globalThis.requestAnimationFrame(() => resolveFrame()))
    }
  }, count)
}

async function stabilizePage(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    `,
  })

  await page.evaluate(async () => {
    if ('document' in globalThis && 'fonts' in globalThis.document) {
      await globalThis.document.fonts.ready
    }
  })

  await waitForFrames(page, 3)
  await page.waitForTimeout(40)
}

async function waitForMenuPlacement(page) {
  await page.waitForFunction(() => {
    const trigger = globalThis.document.querySelector('[data-testid="menu-trigger"]')
    const content = globalThis.document.querySelector('[data-testid="menu-content"]')
    if (!(trigger instanceof globalThis.HTMLElement) || !(content instanceof globalThis.HTMLElement)) {
      return false
    }

    const triggerRect = trigger.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()
    const horizontalAligned = Math.abs(contentRect.left - triggerRect.left) <= 24
    const verticalAligned = contentRect.top >= triggerRect.bottom - 8

    return horizontalAligned && verticalAligned
  })
  await waitForFrames(page, 2)
}

async function main() {
  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })

  const pnpmCommand = proc.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const server = spawn(
    pnpmCommand,
    ['exec', 'vite', '--config', 'examples/vite.config.ts', '--host', '127.0.0.1', '--port', '4173'],
    {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  server.stdout.on('data', chunk => {
    proc.stdout.write(`[examples] ${String(chunk)}`)
  })

  server.stderr.on('data', chunk => {
    proc.stderr.write(`[examples] ${String(chunk)}`)
  })

  let browser = null

  try {
    await waitForServer(baseUrl)

    browser = await chromium.launch()
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1024 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-testid="demo-ready"]')
    await stabilizePage(page)

    await page.screenshot({ path: join(outputDir, '01-home.png'), fullPage: true })

    await page.click('[data-testid="dialog-trigger"]')
    await page.waitForSelector('[data-testid="dialog-content"]', { state: 'visible' })
    await waitForFrames(page, 2)
    await page.screenshot({ path: join(outputDir, '02-dialog-open.png'), fullPage: true })

    await page.keyboard.press('Escape')
    await page.waitForSelector('[data-testid="dialog-content"]', { state: 'detached' })
    await waitForFrames(page, 2)

    await page.click('[data-testid="menu-trigger"]')
    await page.waitForSelector('[data-testid="menu-content"]', { state: 'visible' })
    await waitForMenuPlacement(page)
    await page.screenshot({ path: join(outputDir, '03-menu-open.png'), fullPage: true })

    await page.keyboard.press('Escape')
    await waitForFrames(page, 2)
    await page.click('[data-testid="tab-qa-trigger"]')
    await page.waitForTimeout(120)
    await page.screenshot({ path: join(outputDir, '04-tabs-qa.png'), fullPage: true })

    await page.click('[data-testid="toast-trigger"]')
    await page.waitForSelector('[data-toast-root]', { state: 'visible' })
    await waitForFrames(page, 2)
    await page.screenshot({ path: join(outputDir, '05-toast-open.png'), fullPage: true })

    proc.stdout.write(`Saved screenshots to ${outputDir}\n`)
  } finally {
    if (browser) {
      await browser.close()
    }

    if (server.exitCode === null) {
      server.kill('SIGTERM')
      await Promise.race([once(server, 'exit'), sleep(5000)])
    }
  }
}

main().catch(error => {
  const message = error instanceof Error ? error.stack || error.message : String(error)
  proc.stderr.write(`${message}\n`)
  proc.exitCode = 1
})
