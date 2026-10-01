import { useAppContext } from './context'

/**
 * Access app-level state from any component.
 * Must be used within an app created by `createApp()`.
 */
export function useFrameworkApp() {
    const ctx = useAppContext()
    return {
        menus: ctx.menus,
        progress: ctx.progress,
    }
}

export { createApp, type FrameworkApp, type FrameworkAppOptions } from './createApp'
export { default as AppShell } from './AppShell.vue'
export type { AppShellAuthHandlers } from './AppShell.types'
export { registerAppLocales } from './localeRegistry'
export type { AppLocaleRegistration } from './localeRegistry'
export { useAppContext, type AppContext } from './context'

// Re-export commonly used framework APIs
export { getAppRouter, registerAppRouter } from '@airovo/router'
export { getRequestClient, registerRequestSetup, registerSessionRestore } from '@airovo/request'
export { useAuthStore } from '@airovo/stores/auth'
export { usePreferencesStore } from '@airovo/stores/preferences'
