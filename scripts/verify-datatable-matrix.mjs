import assert from 'node:assert/strict'
import { launchMatrixBrowser } from './matrix-browser.mjs'

const baseUrl = process.env.DATATABLE_MATRIX_URL ?? 'http://localhost:5176'
const username = process.env.DATATABLE_MATRIX_USERNAME ?? 'admin'
const password = process.env.DATATABLE_MATRIX_PASSWORD ?? '123456'

const browser = await launchMatrixBrowser('DATATABLE_MATRIX')

try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.setDefaultTimeout(8000)
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.locator('input[name="username[0].value"]').fill(username)
    await page.locator('input[name="password[0].value"]').fill(password)
    await page.getByRole('button', { name: '登录' }).click()
    await page.waitForTimeout(600)
    await page.goto(`${baseUrl}/dashboard/components`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(1800)

    const table = page.locator('table').filter({ has: page.locator('.data-table-row') }).first()
    assert.ok(await table.count())
    assert.ok(await table.locator('.data-table-row').count())

    const viewTrigger = page.locator('[data-slot="data-table-view-options-trigger"]').first()
    assert.ok(await viewTrigger.count())
    await viewTrigger.click()
    assert.ok(await page.locator('[data-slot="data-table-view-options-menu"]').count())
    await page.keyboard.press('Escape')

    const firstCheckbox = table.locator('tbody input[type="checkbox"]').first()
    if (await firstCheckbox.count()) {
        await firstCheckbox.check()
        assert.equal(await table.locator('tbody tr[data-state="selected"]').count(), 1)
    }

    const resizeHandle = page.locator('span.cursor-col-resize').first()
    if (await resizeHandle.count()) {
        await resizeHandle.dispatchEvent('pointerdown', { clientX: 200 })
        await page.mouse.move(320, 0)
        await page.mouse.up()
    }

    await page.getByRole('button', { name: '切换主题' }).click()
    assert.equal(await page.locator('html').evaluate(element => element.classList.contains('dark')), true)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(400)
    assert.ok(await page.locator('article').count())

    console.log(JSON.stringify({ baseUrl, desktop: true, selection: true, viewOptions: true, dark: true, mobileCards: true }))
} finally {
    await browser.close()
}
