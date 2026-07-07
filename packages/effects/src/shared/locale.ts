/**
 * Element Plus / Naive UI locale bridging.
 *
 * Map framework `Locale` (zh-CN / en-US) to Element Plus / Naive UI
 * language packs. Apps that use the adapters get i18n for free.
 */
import type { Locale } from '@airovo/stores/i18n'

export function resolveAdapterLocale(locale: Locale): string {
    return locale === 'zh-CN' ? 'zh-cn' : 'en'
}

/**
 * Apply dark mode to <html> class. Most adapters (Element Plus dark css-vars,
 * Naive UI theme overrides) rely on this convention.
 */
export function applyDocumentTheme(isDark: boolean): void {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', isDark)
}
