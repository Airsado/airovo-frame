import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const baseUrl = process.env.SECTIONPAGE_MATRIX_URL ?? 'http://localhost:5176'
const username = process.env.SECTIONPAGE_MATRIX_USERNAME ?? 'admin'
const password = process.env.SECTIONPAGE_MATRIX_PASSWORD ?? '123456'
const executablePath = process.env.SECTIONPAGE_MATRIX_BROWSER

const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })

try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.setDefaultTimeout(8000)
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.locator('input[name="username[0].value"]').fill(username)
    await page.locator('input[name="password[0].value"]').fill(password)
    await page.getByRole('button', { name: '登录' }).click()
    await page.waitForTimeout(600)
    await page.goto(`${baseUrl}/dashboard/overview`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(400)
    await page.goto(`${baseUrl}/dashboard/components`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(800)

    const header = page.locator('[data-slot="section-page-header"]').first()
    assert.equal(await header.evaluate(element => getComputedStyle(element).position), 'sticky')
    assert.equal(await header.evaluate(element => getComputedStyle(element).top), '0px')
    const contentScroll = page.locator('[data-slot="layout-content-scroll"]')
    assert.equal(await contentScroll.evaluate(element => getComputedStyle(element).overflowY), 'auto')
    assert.ok(await page.locator('[data-slot="tabs-scroll"]').count())

    await page.getByRole('button', { name: '切换主题' }).click()
    assert.equal(await page.locator('html').evaluate(element => element.classList.contains('dark')), true)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(250)
    assert.equal(await header.evaluate(element => getComputedStyle(element).position), 'sticky')
    assert.equal(await contentScroll.evaluate(element => getComputedStyle(element).overflowY), 'auto')

    console.log(JSON.stringify({ baseUrl, desktopSticky: true, tabs: true, independentScroll: true, dark: true, mobile: '390x844' }))
} finally {
    await browser.close()
}
