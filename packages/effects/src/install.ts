import type { App } from 'vue'
import type { Locale } from '@airovo/stores/i18n'
import type {
    Adapter,
    AdapterContext,
    ElementPlusOptions,
    NaiveUIOptions,
} from './types'
import { ElementPlusAdapter } from './adapters/element-plus'
import { NaiveUIAdapter } from './adapters/naive-ui'

const REGISTRY: Record<string, Adapter> = {
    'element-plus': ElementPlusAdapter,
    'naive-ui': NaiveUIAdapter,
}

/**
 * Install third-party UI adapters in a single call.
 *
 * Resolves the adapter by name and runs its `install()` against a shared
 * `AdapterContext` built from the Vue app, the framework's i18n instance,
 * the current locale, and dark-mode state.
 *
 * Apps should call this AFTER `app.use(pinia)` and `app.use(i18n)`.
 *
 * @example
 * ```ts
 * import { installAdapters } from '@airovo/effects'
 *
 * await installAdapters(app, {
 *   adapters: ['element-plus'],
 * })
 * ```
 */
export interface InstallAdaptersOptions {
    /** Adapter names to install. Default: none (apps opt-in explicitly). */
    adapters?: Array<'element-plus' | 'naive-ui'>
    /** Locale to seed before the store hydrates from localStorage. */
    initialLocale?: Locale
    /** Per-adapter options. */
    elementPlus?: ElementPlusOptions
    naiveUi?: NaiveUIOptions
}

export async function installAdapters(
    app: App,
    options: InstallAdaptersOptions = {},
): Promise<void> {
    const names = options.adapters ?? []
    if (names.length === 0) return

    const ctx: AdapterContext = {
        app,
        i18n: app.config.globalProperties.$i18n as unknown as AdapterContext['i18n'],
        locale: options.initialLocale ?? 'zh-CN',
        isDark: false,
    }

    for (const name of names) {
        const adapter = REGISTRY[name]
        if (!adapter) {
            // eslint-disable-next-line no-console
            console.warn(`[effects] Unknown adapter "${name}" — skipped.`)
            continue
        }
        await adapter.install(ctx)
    }
}
