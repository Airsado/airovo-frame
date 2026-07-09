import {
    frameworkDefaultPreferences,
    preferenceManager,
    resolvePreferences,
    type DeepPartial,
    type Preferences,
} from '@airovo/config/preferences'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Preferences store — Pinia wrapper around {@link preferenceManager}.
 *
 * Wire-up:
 *   pinia.use(piniaPersist)
 *   await usePreferencesStore().init({ namespace: 'my-app', overrides })
 */
export const usePreferencesStore = defineStore(
    'preferences',
    () => {
        const ready = ref(false)

        /** One-time init. Calls `preferenceManager.initPreferences()`. */
        async function init(opts: {
            namespace: string
            overrides?: Partial<Preferences>
        }): Promise<void> {
            await preferenceManager.initPreferences(opts)
            ready.value = true
        }

        /** Readonly snapshot of current preferences. */
        const preferences = computed<Readonly<Preferences>>(() => {
            if (!ready.value) return frameworkDefaultPreferences
            return preferenceManager.getPreferences()
        })

        /** Partially update preferences. */
        function updatePreferences(updates: DeepPartial<Preferences>): void {
            preferenceManager.updatePreferences(updates)
        }

        /** Reset to initial defaults. */
        function reset(): void {
            preferenceManager.resetPreferences()
        }

        return { ready, preferences, init, updatePreferences, reset }
    },
    {
        persist: {
            key: 'airovo-preferences',
            storage: localStorage,
        },
    },
)
