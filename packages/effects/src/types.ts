import type { App } from 'vue'
import type { I18n } from 'vue-i18n'
import type { Locale } from '@airovo/stores/i18n'

/**
 * Adapter context passed to each adapter install function.
 */
export interface AdapterContext {
    app: App
    i18n: I18n
    locale: Locale
    isDark: boolean
}

/**
 * Adapter contract.
 */
export interface Adapter {
    name: 'element-plus' | 'naive-ui'
    install: (ctx: AdapterContext) => void | Promise<void>
}

/**
 * Element Plus adapter options
 */
export interface ElementPlusOptions {
    size?: 'small' | 'default' | 'large'
    zIndex?: number
    locale?: Locale
}

/**
 * Naive UI adapter options
 */
export interface NaiveUIOptions {
    themeOverrides?: Record<string, unknown>
    breakpoints?: Record<string, number>
}
