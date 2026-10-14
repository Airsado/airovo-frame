import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const baseUrl = process.env.JSON_FORM_MATRIX_URL ?? 'http://localhost:5176'
const username = process.env.JSON_FORM_MATRIX_USERNAME ?? 'admin'
const password = process.env.JSON_FORM_MATRIX_PASSWORD ?? '123456'
const executablePath = process.env.JSON_FORM_MATRIX_BROWSER

const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })

try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.setDefaultTimeout(8000)
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.locator('input[name="username[0].value"]').fill(username)
    await page.locator('input[name="password[0].value"]').fill(password)
    await page.getByRole('button', { name: '登录' }).click()
    await page.waitForTimeout(600)
    await page.goto(`${baseUrl}/dashboard/my-form`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(900)

    const form = page.locator('[data-test="json-form"]')
    assert.ok(await form.count())
    const jsonField = form.locator('[data-slot="field"]').filter({ hasText: '请求 JSON 配置' }).first()
    assert.ok(await jsonField.count())
    assert.equal(await jsonField.locator('[aria-invalid="false"]').count() > 0, true)

    await jsonField.getByRole('button', { name: 'JSON 模式' }).click()
    const editor = jsonField.locator('textarea').first()
    assert.ok(await editor.count())
    await editor.fill('{"broken":}')
    await page.waitForTimeout(100)
    assert.ok((await jsonField.innerText()).includes('JSON 格式无效'))
    assert.equal(await editor.inputValue(), '{"broken":}')

    await page.locator('[data-test="json-form-validate"]').click()
    await page.waitForTimeout(250)
    assert.equal(await editor.inputValue(), '{"broken":}')

    await page.locator('[data-test="json-form-reset"]').click()
    await page.waitForTimeout(250)
    assert.notEqual(await editor.inputValue(), '{"broken":}')

    console.log(JSON.stringify({ baseUrl, customFormField: true, invalidDraftPreserved: true, validate: true, reset: true }))
} finally {
    await browser.close()
}
