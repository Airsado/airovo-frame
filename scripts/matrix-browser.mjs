import { chromium, firefox } from 'playwright'

/** Launch a verification browser without treating Firefox as Chromium. */
export function launchMatrixBrowser(prefix) {
    const engine = (process.env[`${prefix}_ENGINE`] ?? 'chromium').toLowerCase()
    const executablePath = process.env[`${prefix}_BROWSER`]
    const browserType = engine === 'firefox' ? firefox : chromium
    return browserType.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
}
