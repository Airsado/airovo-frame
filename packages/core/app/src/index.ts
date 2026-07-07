import type { Ref } from 'vue'
import type { MenuItem } from '@airovo/router'
import { useAppContext } from './context'

/**
 * Access app-level state from any component.
 * Must be used within an app created by `createApp()`.
 */
export function useAirovo() {
    const ctx = useAppContext()
    return {
        menus: ctx.menus as Ref<MenuItem[]>,
        progress: ctx.progress,
    }
}

export { createApp, type AirovoApp, type AirovoAppOptions } from './createApp'
export { useAppContext, type AppContext } from './context'

// Re-export commonly used framework APIs
export { createAppRouter } from '@airovo/router'
export { useAuthStore } from '@airovo/stores/auth'
export { usePreferencesStore } from '@airovo/stores/preferences'