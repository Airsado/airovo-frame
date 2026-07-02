import type { Preferences } from './types'

/**
 * Framework built-in defaults. Apps spread (via `resolvePreferences`)
 * their own overrides on top of this object to produce the final
 * preferences shape persisted in the preferences store.
 *
 * Only include keys the framework actively consumes today:
 *   - `app.homePath` / `app.menusMod` — read by `createAppRouter`
 *   - `app.name` / `app.title` — used for the page `<title>`
 *
 * Other keys are placeholders for the upcoming settings drawer.
 */
export const frameworkDefaultPreferences: Preferences = {
    app: {
        name: 'airovo-frame',
        title: 'airovo-frame',
        homePath: '/dashboard',
        menusMod: 'frontend',
    },
    theme: {
        mode: 'system',
        primaryColor: '',
    },
    locale: {
        current: 'zh-CN',
        fallback: 'zh-CN',
    },
    header: {
        showSearch: true,
        showMessages: true,
        showLanguage: true,
        showTheme: true,
    },
}