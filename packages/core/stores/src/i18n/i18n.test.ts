import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { reactive, ref } from 'vue'

const preferences = reactive({ locale: { current: 'zh-CN' as 'zh-CN' | 'en-US', fallback: 'zh-CN' as 'zh-CN' | 'en-US' } })
vi.mock('../preferences', () => ({
    usePreferencesStore: () => ({
        preferences,
        updatePreferences: (updates: { locale?: { current?: 'zh-CN' | 'en-US' } }) => {
            if (updates.locale?.current) preferences.locale.current = updates.locale.current
        },
    }),
}))

import { useI18nStore } from './index'

describe('useI18nStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        preferences.locale.current = 'zh-CN'
        preferences.locale.fallback = 'zh-CN'
        document.documentElement.lang = 'zh-CN'
    })

    it('loads an app locale before committing it to preferences and vue-i18n', async () => {
        const store = useI18nStore()
        const external = ref<'zh-CN' | 'en-US'>('zh-CN')
        const loader = vi.fn(async () => ({ navigation: { dashboard: 'Dashboard' } }))
        store.configure({ loaders: { 'en-US': loader } })
        store.bindExternal(external)

        await store.setLocale('en-US')
        expect(loader).toHaveBeenCalledTimes(1)
        expect(store.locale).toBe('en-US')
        expect(external.value).toBe('en-US')
        expect(document.documentElement.lang).toBe('en-US')
        await store.setLocale('en-US')
        expect(loader).toHaveBeenCalledTimes(1)
    })

    it('allows the app bootstrap to preload fallback messages', async () => {
        const store = useI18nStore()
        const fallbackLoader = vi.fn(async () => ({ navigation: { dashboard: '仪表盘' } }))
        store.configure({ loaders: { 'zh-CN': fallbackLoader } })

        await store.loadLocale('zh-CN')
        await store.loadLocale('zh-CN')

        expect(fallbackLoader).toHaveBeenCalledOnce()
    })

    it('stages the configured fallback overlay when switching locales', async () => {
        preferences.locale.fallback = 'en-US'
        const store = useI18nStore()
        const selectedLoader = vi.fn(async () => ({ navigation: { dashboard: '仪表盘' } }))
        const fallbackLoader = vi.fn(async () => ({ navigation: { missing: 'Fallback' } }))
        store.configure({ loaders: { 'zh-CN': selectedLoader, 'en-US': fallbackLoader } })

        await store.setLocale('zh-CN')

        expect(selectedLoader).toHaveBeenCalledOnce()
        expect(fallbackLoader).toHaveBeenCalledOnce()
        expect(store.locale).toBe('zh-CN')
    })

    it('falls back to the configured locale when the app resource fails', async () => {
        const store = useI18nStore()
        const external = ref<'zh-CN' | 'en-US'>('zh-CN')
        store.configure({ loaders: { 'en-US': async () => { throw new Error('network') } } })
        store.bindExternal(external)

        await store.setLocale('en-US')
        expect(store.locale).toBe('zh-CN')
        expect(external.value).toBe('zh-CN')
        expect(document.documentElement.lang).toBe('zh-CN')
        expect(store.loadError).toBeInstanceOf(Error)
    })

    it('keeps the latest choice when an earlier load finishes later', async () => {
        const store = useI18nStore()
        let finishEnglish: (() => void) | undefined
        store.configure({
            loaders: {
                'en-US': () => new Promise<void>((resolve) => { finishEnglish = resolve }),
            },
        })

        const first = store.setLocale('en-US')
        await store.setLocale('zh-CN')
        finishEnglish?.()
        await first
        expect(store.locale).toBe('zh-CN')
        expect(document.documentElement.lang).toBe('zh-CN')
    })
})
