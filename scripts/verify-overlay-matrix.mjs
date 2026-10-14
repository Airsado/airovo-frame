import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const baseUrl = process.env.OVERLAY_MATRIX_URL ?? 'http://localhost:5176'
const username = process.env.OVERLAY_MATRIX_USERNAME ?? 'admin'
const password = process.env.OVERLAY_MATRIX_PASSWORD ?? '123456'
const executablePath = process.env.OVERLAY_MATRIX_BROWSER

const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })

try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.setDefaultTimeout(8000)
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.locator('input[name="username[0].value"]').fill(username)
    await page.locator('input[name="password[0].value"]').fill(password)
    await page.getByRole('button', { name: '登录' }).click()
    await page.waitForTimeout(600)
    await page.goto(`${baseUrl}/dashboard/components`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(800)

    await page.getByRole('button', { name: '打开 Dialog' }).click()
    const dialog = page.locator('[role="dialog"]').last()
    assert.ok(await dialog.count())
    const modalInput = page.locator('[role="dialog"] input[aria-label="渠道名称"]')
    await modalInput.focus()
    assert.equal(await modalInput.evaluate(element => document.activeElement === element), true)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(250)
    assert.equal(await dialog.count(), 0)

    await page.getByRole('button', { name: '打开 Drawer' }).click()
    const drawer = page.locator('[data-slot="drawer-content"]').last()
    assert.ok(await drawer.count())
    assert.ok(await drawer.locator('text=可滚动内容 1').count())
    await page.keyboard.press('Escape')
    await page.waitForTimeout(250)
    assert.equal(await drawer.count(), 0)

    await page.getByRole('button', { name: '打开右侧 Drawer' }).click()
    const rightDrawer = page.locator('[data-slot="drawer-content"]').last()
    assert.ok((await rightDrawer.getAttribute('class') ?? '').includes('right-0'))
    await page.mouse.click(10, 400)
    await page.waitForTimeout(250)
    assert.equal(await rightDrawer.count(), 0)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: '打开 Drawer' }).click()
    const mobileDrawer = page.locator('[data-slot="drawer-content"]').last()
    assert.ok(await mobileDrawer.count())
    await page.keyboard.press('Escape')
    await page.waitForTimeout(250)
    assert.equal(await mobileDrawer.count(), 0)

    console.log(JSON.stringify({ baseUrl, dialog: true, drawer: true, rightDrawer: true, mobileEscape: true, focus: true }))
} finally {
    await browser.close()
}
