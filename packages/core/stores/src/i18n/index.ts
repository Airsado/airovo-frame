import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { usePreferencesStore } from '../preferences'

export type Locale = 'zh-CN' | 'en-US'

export const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en-US']

export type LocaleLoader = () => Promise<unknown>

export const useI18nStore = defineStore(
    'i18n',
    () => {
        const preferences = usePreferencesStore()
        let externalLocale: { value: Locale } | null = null
        const loaders = ref<Partial<Record<Locale, LocaleLoader>>>({})
        const loaded = new Set<Locale>()
        const pending = new Map<Locale, Promise<void>>()
        const loading = ref(false)
        const loadError = ref<unknown>(null)
        let selectionVersion = 0

        const locale = computed<Locale>({
            get: () => preferences.preferences.locale.current,
            set: (value) => preferences.updatePreferences({ locale: { current: value } }),
        })
        const isZh = computed(() => locale.value === 'zh-CN')

        async function loadLocale(l: Locale): Promise<void> {
            if (loaded.has(l)) return
            const running = pending.get(l)
            if (running) return running

            const loader = loaders.value[l]
            if (!loader) return

            const task = (async () => {
                loading.value = true
                try {
                    await loader()
                    loaded.add(l)
                } finally {
                    pending.delete(l)
                    loading.value = pending.size > 0
                }
            })()
            pending.set(l, task)
            return task
        }

        async function setLocale(l: Locale): Promise<void> {
            const version = ++selectionVersion
            loadError.value = null
            try {
                await loadLocale(l)
                // Stage the configured fallback overlay as well. The layout's
                // built-in fallback messages are synchronous, but app-owned
                // fallback namespaces are loaded through the same async glob
                // loader and must be available before vue-i18n resolves a
                // missing key.
                const fallback = preferences.preferences.locale.fallback
                if (fallback !== l) {
                    try {
                        await loadLocale(fallback)
                    } catch {
                        // The selected locale remains usable when an optional
                        // fallback overlay is unavailable.
                    }
                }
                if (version !== selectionVersion) return
                locale.value = l
                syncLocale(l)
            } catch (error) {
                if (version !== selectionVersion) return
                loadError.value = error
                // A broken app locale must not leave the shell in a half-switched
                // state. Fall back to the configured framework locale instead.
                const fallback = preferences.preferences.locale.fallback
                if (fallback !== l) {
                    try {
                        await loadLocale(fallback)
                    } catch {
                        // The built-in locale is still usable even if its optional
                        // app overlay also fails to load.
                    }
                }
                locale.value = fallback
                syncLocale(fallback)
            }
        }

        function syncLocale(l: Locale): void {
            if (typeof document !== 'undefined') document.documentElement.lang = l
            if (externalLocale && externalLocale.value !== l) {
                externalLocale.value = l
            }
        }

        function configure(options: { loaders?: Partial<Record<Locale, LocaleLoader>> }): void {
            loaders.value = { ...loaders.value, ...(options.loaders ?? {}) }
        }

        function bindExternal(external: { value: Locale }): void {
            externalLocale = external
            // Preferences are the canonical source. Set vue-i18n to the
            // persisted preference before watching it, otherwise the default
            // framework locale would overwrite an app's saved locale.
            if (external.value !== locale.value) external.value = locale.value
            watch(
                () => external.value,
                (value) => {
                    if (value && value !== locale.value) void setLocale(value)
                },
            )
        }

        watch(locale, (l) => {
            if (externalLocale?.value !== l) void setLocale(l)
        })

        return { locale, isZh, loading, loadError, setLocale, loadLocale, configure, bindExternal }
    },
)
