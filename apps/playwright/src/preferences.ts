import { defineOverridesPreferences } from '@airovo/config/preferences'

const appTitle = import.meta.env.VITE_APP_TITLE ?? 'Playwright Demo'

/**
 * App-level preference overrides. These are merged on top of
 * `frameworkDefaultPreferences` from `@airovo/config` at app bootstrap.
 *
 * Mirrors the vben-admin V5 pattern: define your overrides in one file,
 * pass them through `usePreferencesStore().applyOverrides(...)` in main.ts.
 */
export const appOverrides = defineOverridesPreferences({
    app: {
        name: 'playwright',
        title: appTitle,
        homePath: '/dashboard',
        menusMod: 'frontend',
    },
    theme: {
        mode: 'system',
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
})

export default appOverrides