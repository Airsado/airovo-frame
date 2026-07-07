import { inject, type App } from 'vue'

/**
 * App context key for dependency injection.
 * Allows composables to access app-level state (router, pinia, etc.)
 */
export const APP_CONTEXT_KEY = Symbol('airovoAppContext')

export interface AppContext {
    app: App
    router: import('vue-router').Router
    pinia: import('pinia').Pinia
    i18n: unknown
    menus: unknown
    progress: import('vue').Ref<number>
}

/**
 * Inject app context. Must be used within a component that's a descendant
 * of an `createApp()` call.
 */
export function useAppContext(): AppContext {
    const ctx = inject<AppContext>(APP_CONTEXT_KEY)
    if (!ctx) {
        throw new Error(
            'useAppContext() must be used within an app created by createApp()',
        )
    }
    return ctx
}