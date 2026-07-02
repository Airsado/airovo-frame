import {
    frameworkDefaultPreferences,
    resolvePreferences,
    type Preferences,
} from '@airovo/config/preferences'
import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Preferences store — single Pinia store owning the merged
 * `frameworkDefaultPreferences` + app overrides object. Persisted to
 * `localStorage` under `airovo-preferences`.
 *
 * Wire-up:
 *   pinia.use(piniaPersist)
 *   const prefs = usePreferencesStore()
 *   prefs.applyOverrides(appOverrides)
 */
export const usePreferencesStore = defineStore(
    'preferences',
    () => {
        const preferences = ref<Preferences>(frameworkDefaultPreferences)

        function applyOverrides(overrides: Partial<Preferences>): void {
            preferences.value = resolvePreferences(overrides)
        }

        function reset(): void {
            preferences.value = frameworkDefaultPreferences
        }

        return { preferences, applyOverrides, reset }
    },
    {
        persist: {
            key: 'airovo-preferences',
            storage: localStorage,
        },
    },
)
