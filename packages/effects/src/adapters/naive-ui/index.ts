import type { Adapter, AdapterContext, NaiveUIOptions } from '../../types'

/**
 * Naive UI adapter.
 *
 * Apps opt-in by installing `naive-ui` themselves and calling this
 * adapter through `@airovo/effects` `installAdapters({ adapters: ['naive-ui'] })`.
 *
 * @example
 * ```ts
 * // 1. Install the dep
 * pnpm add naive-ui
 *
 * // 2. Enable in createApp
 * await createApp({
 *   effects: { adapters: ['naive-ui'] },
 * })
 *
 * // 3. Wrap your App with <NConfigProvider> using the provided components.
 * ```
 *
 * Unlike Element Plus, Naive UI doesn't globally app.use(). It uses
 * `<NConfigProvider>` per app-tree. We expose the right components/themes
 * for the app to compose manually.
 */
export function installNaiveUI(
    ctx: AdapterContext,
    _options: NaiveUIOptions = {},
): void {
    // Helper: dynamic import that Vite's analysis won't try to resolve at build-time
    // (Vite has trouble with `/* @vite-ignore */` for multi-line import calls)
    const dynamicImport = (mod: string) =>
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
        new Function('m', 'return import(m)')(mod) as Promise<unknown>

    // Lazy-load Naive UI; failure is non-fatal.
    dynamicImport('naive-ui')
        .then((naiveModule) => {
            if (!naiveModule) return
            const naive = naiveModule as Record<string, unknown>

            // Expose the entire Naive UI namespace via provide for app-tree use
            ctx.app.provide('$naive', naive)

            // Mirror locale → date-picker locale
            const dateLocale =
                ctx.locale === 'zh-CN'
                    ? (naive as unknown as { dateZhCN: unknown }).dateZhCN
                    : (naive as unknown as { dateEnUS: unknown }).dateEnUS
            if (dateLocale) {
                ctx.app.provide('$naive-date-locale', dateLocale)
            }
        })
        .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn(
                '[effects/naive-ui] Failed to install. Did you forget `pnpm add naive-ui`?',
                err,
            )
        })

    // Dark-mode sync — naive-ui is dark-mode-agnostic by default; users
    // can subscribe to `useThemeStore().isDark` and pass `darkTheme` to
    // <NConfigProvider> themselves.
    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', ctx.isDark)
    }
}

export const NaiveUIAdapter: Adapter = {
    name: 'naive-ui',
    install: installNaiveUI,
}
