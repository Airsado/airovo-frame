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
        name: 'framework',
        title: 'Framework',
        homePath: '/dashboard',
        menusMod: 'frontend',
    },
    auth: {
        enabled: true,
        loginExpiredMode: 'modal',
    },
    theme: {
        mode: 'system',
        // new-api's DEFAULT_THEME_CUSTOMIZATION.
        preset: 'default',
        radiusScale: 'default',
        font: 'default',
        primaryColor: '',
        layoutDensity: 'default',
        animationEnabled: true,
        weakMode: false,
    },
    layout: {
        mode: 'sidebar',
        sidebarVariant: 'inset',
        sidebarCollapsible: 'icon',
        // new-api's DEFAULT_THEME_CUSTOMIZATION uses the fluid content layout.
        contentLayout: 'full',
        contentMaxWidth: 1280,
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
        showSettings: true,
        showTabs: true,
    },
}
