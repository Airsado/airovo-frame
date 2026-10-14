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
    assert.ok(await contentScroll.evaluate(element => element.scrollHeight > element.clientHeight))
    assert.ok(await page.locator('[data-slot="tabs-scroll"]').count())
    const footerHost = page.locator('[data-slot="section-page-footer-host"]').first()
    assert.ok(await footerHost.count())
    assert.ok((await footerHost.innerText()).includes('SectionPage footer portal'))
    const beforeScrollTop = await header.boundingBox()
    await contentScroll.evaluate(element => { element.scrollTop = 500 })
    await page.waitForTimeout(100)
    const afterScrollTop = await header.boundingBox()
    assert.ok(beforeScrollTop && afterScrollTop && Math.abs(beforeScrollTop.y - afterScrollTop.y) < 4)
    assert.equal(await contentScroll.evaluate(element => element.scrollTop), 500)
    const tabs = page.locator('[data-slot="tabs-scroll"]').first()
    const tabsBox = await tabs.boundingBox()
    const scrollBox = await contentScroll.boundingBox()
    assert.ok(tabsBox && scrollBox && tabsBox.y + tabsBox.height <= scrollBox.y + 2)

    await page.getByRole('button', { name: '切换主题' }).click()
    assert.equal(await page.locator('html').evaluate(element => element.classList.contains('dark')), true)
    await page.getByRole('button', { name: '切换主题' }).click()
    assert.equal(await page.locator('html').evaluate(element => element.classList.contains('dark')), false)

    await page.setViewportSize({ width: 320, height: 844 })
    await page.waitForTimeout(250)
    assert.equal(await header.evaluate(element => getComputedStyle(element).position), 'sticky')
    assert.equal(await contentScroll.evaluate(element => getComputedStyle(element).overflowY), 'auto')
    assert.ok(await contentScroll.evaluate(element => element.scrollHeight >= element.clientHeight))
    await contentScroll.evaluate(element => { element.scrollTop = 300 })
    await page.waitForTimeout(100)
    assert.equal(await contentScroll.evaluate(element => element.scrollTop), 300)
    const mobileTabs = page.locator('[data-slot="tabs-scroll"]').first()
    const mobileTabsBox = await mobileTabs.boundingBox()
    const mobileScrollBox = await contentScroll.boundingBox()
    assert.ok(mobileTabsBox && mobileScrollBox && mobileTabsBox.y + mobileTabsBox.height <= mobileScrollBox.y + 2)
    assert.ok((await header.boundingBox())?.width <= 320)

    console.log(JSON.stringify({ baseUrl, desktopSticky: true, tabs: true, footerPortal: true, longScroll: true, lightDark: true, narrow: '320x844' }))
} finally {
    await browser.close()
}
