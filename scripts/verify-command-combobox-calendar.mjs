import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const baseUrl = process.env.PRIMITIVE_MATRIX_URL ?? 'http://localhost:5176'
const username = process.env.PRIMITIVE_MATRIX_USERNAME ?? 'admin'
const password = process.env.PRIMITIVE_MATRIX_PASSWORD ?? '123456'
const executablePath = process.env.PRIMITIVE_MATRIX_BROWSER

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

    const calendar = page.locator('[data-framework-component="calendar"]')
    assert.ok(await calendar.count())
    assert.ok(await calendar.locator('[data-slot="calendar-cell-trigger"]').count() || await calendar.locator('[data-slot="calendar-cell"]').count())

    await page.getByRole('button', { name: '打开命令面板' }).click()
    const commandDialog = page.locator('[data-slot="dialog-content"]')
    assert.ok(await commandDialog.count())
    const commandInput = page.locator('[data-slot="command-input"]')
    await commandInput.fill('概览')
    assert.ok((await page.locator('[data-slot="command-item"]').allTextContents()).some(text => text.includes('概览')))
    await page.keyboard.press('Escape')
    await page.waitForTimeout(250)
    assert.equal(await commandDialog.count(), 0)

    const combobox = page.locator('[role="combobox"]').filter({ hasText: '搜索或输入渠道' }).first()
    assert.ok(await combobox.count())
    await combobox.click()
    const comboInput = page.locator('[data-slot="command-input"]').last()
    await comboInput.fill('OpenAI')
    const bodyText = await page.locator('body').innerText()
    assert.ok(bodyText.includes('OpenAI 主渠道'))
    assert.ok(bodyText.includes('云服务'))
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: '切换主题' }).click()
    assert.equal(await page.locator('html').evaluate(element => element.classList.contains('dark')), true)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${baseUrl}/dashboard/components`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(600)
    assert.ok(await page.locator('[data-framework-component="calendar"]').count())

    console.log(JSON.stringify({ baseUrl, calendar: true, command: true, combobox: true, dark: true, mobile: '390x844' }))
} finally {
    await browser.close()
}
