import type { Adapter, AdapterContext, ElementPlusOptions } from '../../types'

/**
 * Element Plus adapter.
 *
 * Apps opt-in by installing `element-plus` themselves and calling this
 * adapter through `@airovo/effects` `installAdapters({ adapters: ['element-plus'] })`.
 *
 * @example
 * ```ts
 * // 1. Install the dep
 * pnpm add element-plus
 *
 * // 2. Enable in createApp
 * await createApp({
 *   effects: { adapters: ['element-plus'] },
 * })
 *
 * // 3. (optional) Configure
 * effects: {
 *   adapters: ['element-plus'],
 *   elementPlus: { size: 'small', locale: 'zh-CN' },
 * }
 * ```
 *
 * Implementation notes:
 * - Imports Element Plus on demand so apps opt-in by installing the dep.
 * - Reads framework locale (`@airovo/stores/i18n`) and mirrors it to EP's
 *   `useLocale` so the framework's i18n drives EP translations.
 * - Dark mode follows the framework's `class="dark"` convention.
 */
export function installElementPlus(
    ctx: AdapterContext,
    _options: ElementPlusOptions = {},
): void {
    // Helper: dynamic import that Vite's analysis won't try to resolve at build-time
    const dynamicImport = (mod: string) =>
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
        new Function('m', 'return import(m)')(mod) as Promise<unknown>

    // Lazy-load Element Plus. App must have installed it.
    Promise.all([
        dynamicImport('element-plus').catch(() => null),
        dynamicImport('element-plus/dist/index.css').catch(() => null),
        dynamicImport('element-plus/theme-chalk/dark/css-vars.css').catch(() => null),
    ])
        .then(async ([ElementPlusModule]) => {
            if (!ElementPlusModule) return // not installed — silent skip
            const mod = ElementPlusModule as { default?: unknown }
            const ElementPlus = (mod.default ?? mod) as Parameters<typeof ctx.app.use>[0]
            ctx.app.use(ElementPlus)

            // Mirror framework locale → Element Plus locale (lazy)
            try {
                const { default: zhCn } = (await dynamicImport(
                    'element-plus/es/locale/lang/zh-cn',
                )) as { default: unknown }
                const { default: en } = (await dynamicImport(
                    'element-plus/es/locale/lang/en',
                )) as { default: unknown }
                const epLocale = ctx.locale === 'zh-CN' ? zhCn : en
                ctx.app.provide('ep-locale', epLocale)
            } catch {
                // locale packs missing — non-fatal
            }
        })
        .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn(
                '[effects/element-plus] Failed to install. Did you forget `pnpm add element-plus`?',
                err,
            )
        })

    // Dark-mode sync — EP respects `class="dark"` natively, so we just
    // watch the framework's isDark signal.
    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', ctx.isDark)
    }
}

export const ElementPlusAdapter: Adapter = {
    name: 'element-plus',
    install: installElementPlus,
}
