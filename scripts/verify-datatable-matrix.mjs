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

    const serverSection = page.getByRole('heading', { name: 'DataTable 服务端查询演示' }).locator('xpath=ancestor::section[1]')
    assert.equal(await serverSection.count(), 1)
    const dataTablePage = serverSection.getByTestId('datatable-surface-demo').locator('xpath=ancestor::section[1]')
    const tableRoot = dataTablePage.getByTestId('datatable-surface-demo')
    assert.equal(await tableRoot.count(), 1)
    const table = tableRoot.locator('table')
    assert.equal(await table.count(), 1)
    const desktopRowCount = await table.locator('.data-table-row').count()
    assert.ok(desktopRowCount)
    const truncatedTrigger = tableRoot.locator('[data-slot="tooltip-trigger"]').filter({ hasText: '演示渠道 01' }).first()
    assert.equal(await truncatedTrigger.count(), 1)
    assert.ok((await truncatedTrigger.getAttribute('class')).includes('truncate'))
    await truncatedTrigger.hover()
    await page.waitForTimeout(350)
    assert.ok((await page.locator('[data-slot="tooltip-content"]').last().innerText()).includes('完整名称'))

    const viewTrigger = dataTablePage.locator('[data-slot="data-table-view-options-trigger"]').first()
    assert.equal(await viewTrigger.count(), 1)
    await viewTrigger.click()
    const viewOptionsMenuCount = await page.locator('[data-slot="data-table-view-options-menu"]').count()
    assert.ok(viewOptionsMenuCount)
    await page.keyboard.press('Escape')

    const firstCheckbox = table.locator('tbody input[type="checkbox"]').first()
    assert.equal(await firstCheckbox.count(), 1)
    await firstCheckbox.check()
    const selectedRowCount = await table.locator('tbody tr[data-state="selected"]').count()
    assert.equal(selectedRowCount, 1)
    const bulkToolbar = serverSection.locator('[data-slot="data-table-bulk-actions"]').first()
    assert.equal(await bulkToolbar.count(), 1)
    const announcement = bulkToolbar.locator('xpath=preceding-sibling::*[@role="status"][1]')
    assert.equal(await announcement.count(), 1)
    assert.ok((await announcement.innerText()).includes('1'))
    await page.waitForTimeout(3100)
    assert.equal(await announcement.innerText(), '')

    const resizeHandle = tableRoot.locator('[data-column-resizer]').first()
    assert.equal(await resizeHandle.count(), 1)
    const resizeColumn = resizeHandle.locator('xpath=ancestor::th[1]')
    assert.equal(await resizeColumn.count(), 1)
    const readResizeState = async () => resizeColumn.evaluate((element) => ({
        inlineWidth: element.style.width,
        renderedWidth: element.getBoundingClientRect().width,
    }))
    const beforeResize = await readResizeState()
    const beforeStoredSizing = await page.evaluate(() => window.localStorage.getItem('playwright-channel-table-sizing'))
    const handleBox = await resizeHandle.boundingBox()
    assert.ok(handleBox)
    await resizeHandle.dispatchEvent('pointerdown', {
        clientX: handleBox.x + handleBox.width / 2,
        clientY: handleBox.y + handleBox.height / 2,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
    })
    await page.mouse.move(handleBox.x + handleBox.width / 2 + 24, handleBox.y + handleBox.height / 2)
    await page.mouse.up()
    await page.waitForTimeout(100)
    let afterResize = await readResizeState()
    let afterStoredSizing = await page.evaluate(() => window.localStorage.getItem('playwright-channel-table-sizing'))
    if (afterResize.inlineWidth === beforeResize.inlineWidth
        && afterResize.renderedWidth === beforeResize.renderedWidth
        && afterStoredSizing === beforeStoredSizing) {
        await resizeHandle.focus()
        await resizeHandle.press('ArrowRight')
        await page.waitForTimeout(100)
        afterResize = await readResizeState()
        afterStoredSizing = await page.evaluate(() => window.localStorage.getItem('playwright-channel-table-sizing'))
    }
    if (afterResize.inlineWidth === beforeResize.inlineWidth
        && afterResize.renderedWidth === beforeResize.renderedWidth
        && afterStoredSizing === beforeStoredSizing) {
        await resizeHandle.press('ArrowLeft')
        await page.waitForTimeout(100)
        afterResize = await readResizeState()
        afterStoredSizing = await page.evaluate(() => window.localStorage.getItem('playwright-channel-table-sizing'))
    }
    const resizeVerified = afterResize.inlineWidth !== beforeResize.inlineWidth
        || afterResize.renderedWidth !== beforeResize.renderedWidth
        || afterStoredSizing !== beforeStoredSizing
    assert.ok(resizeVerified, 'DataTable column resize did not change its width or persisted sizing')

    await page.getByRole('button', { name: '切换主题' }).click()
    const dark = await page.locator('html').evaluate(element => element.classList.contains('dark'))
    assert.equal(dark, true)
    await truncatedTrigger.hover()
    await page.waitForTimeout(150)
    assert.ok((await page.locator('[data-slot="tooltip-content"]').last().innerText()).includes('完整名称'))

    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(400)
    const mobileList = dataTablePage.locator('[data-slot="data-table-mobile-card-list"]')
    assert.equal(await mobileList.count(), 1)
    assert.ok((await mobileList.locator('.divide-y').first().getAttribute('class')).includes('border'))
    const mobileCards = mobileList.locator('[data-slot="data-table-mobile-row"]')
    const mobileCardCount = await mobileCards.count()
    assert.ok(mobileCardCount)
    const mobileCheckbox = mobileCards.first().locator('input[type="checkbox"]')
    assert.equal(await mobileCheckbox.count(), 1)
    assert.equal(await mobileCheckbox.isChecked(), true)
    const selectAllMobile = mobileList.locator('[data-slot="data-table-mobile-select-all"] input')
    assert.equal(await selectAllMobile.count(), 1)
    assert.equal(await selectAllMobile.isChecked(), false)
    assert.equal(await selectAllMobile.evaluate((element) => element.indeterminate), true)
    await selectAllMobile.check()
    assert.equal(await selectAllMobile.isChecked(), true)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(400)
    const sharedSelectedRowCount = await table.locator('tbody tr[data-state="selected"]').count()
    assert.equal(sharedSelectedRowCount, 2)

    console.log(JSON.stringify({
        baseUrl,
        desktop: desktopRowCount > 0,
        selection: selectedRowCount === 1,
        sharedTableCardSelection: sharedSelectedRowCount === 2,
        viewOptions: viewOptionsMenuCount > 0,
        dark,
        mobileCards: mobileCardCount > 0,
        resize: resizeVerified,
    }))
} finally {
    await browser.close()
}
