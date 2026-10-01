import { createI18n, type I18n } from 'vue-i18n'

import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

export type LayoutLocale = 'zh-CN' | 'en-US'

const layoutsMessages = {
    'zh-CN': zhCN,
    'en-US': enUS,
}

/**
 * Create a vue-i18n instance pre-loaded with the layout's own messages
 * (sidebar labels, header labels, etc.). Apps can merge their own
 * messages on top via `mergeLocaleMessage`.
 */
export function createLayoutsI18n(options: {
    locale?: LayoutLocale
    fallbackLocale?: LayoutLocale
} = {}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createI18n({
        legacy: false,
        locale: options.locale ?? 'zh-CN',
        fallbackLocale: options.fallbackLocale ?? 'zh-CN',
        globalInjection: true,
        messages: layoutsMessages,
    })
}

/** A Vite `import.meta.glob` loader or an equivalent async resource loader. */
export type LocaleLoader = () => Promise<unknown>

/**
 * Load and merge an application locale using the same staged model as
 * vue-vben-admin: framework messages first, app messages second, then update
 * the document language attribute.
 */
export async function loadLocaleMessages(
    i18n: I18n,
    locale: LayoutLocale,
    loader?: LocaleLoader,
): Promise<void> {
    const loaded = loader ? await loader() : undefined
    const messages = loaded && typeof loaded === 'object' && 'default' in loaded
        ? (loaded as { default?: Record<string, unknown> }).default
        : loaded
    if (messages) i18n.global.mergeLocaleMessage(locale, messages)
    if (typeof i18n.global.locale === 'string') i18n.global.locale = locale
    else i18n.global.locale.value = locale
    if (typeof document !== 'undefined') document.documentElement.lang = locale
}

/** Build a locale map from Vite's import.meta.glob result. */
export function loadLocalesMapFromDir(
    modules: Record<string, LocaleLoader>,
): Record<string, LocaleLoader> {
    const grouped: Record<string, Array<{ key: string; loader: LocaleLoader; flat: boolean }>> = {}
    for (const [path, loader] of Object.entries(modules)) {
        // Accept both `./locales/zh-CN/common.json` and
        // `./locales/zh-CN.json` so apps can choose flat or grouped files.
        const match = path.match(/(?:^|\/)(zh-CN|en-US)(?:\/([^/]+(?:\/[^/]+)*))?(?:\.(?:json|ya?ml|ts))?$/)
        if (!match) continue
        const locale = match[1]
        const key = (match[2] ?? 'index').replace(/\.(?:json|ya?ml|ts)$/, '')
        const flat = new RegExp(`(?:^|/)${locale}\\.(?:json|ya?ml|ts)$`).test(path)
        ;(grouped[locale] ??= []).push({ key, loader, flat })
    }
    return Object.fromEntries(Object.entries(grouped).map(([locale, entries]) => [locale, async () => {
        const merged: Record<string, unknown> = {}
        for (const entry of entries) {
            const loaded = await entry.loader()
            const messages = loaded && typeof loaded === 'object' && 'default' in loaded
                ? loaded.default
                : loaded
            if (messages && typeof messages === 'object') {
                if (entry.flat) Object.assign(merged, messages)
                else merged[entry.key] = messages
            }
        }
        return merged
    }]))
}
