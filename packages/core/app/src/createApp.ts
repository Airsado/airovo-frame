import { createApp as createVueApp, type App, type Component } from 'vue'
import type { RouteRecordRaw, NavigationGuardWithThis } from 'vue-router'
import type { Pinia } from 'pinia'
import {
    createAppRouter,
    type AirovoRouter,
} from '@airovo/router'
import { createLayoutsI18n } from '@airovo/layouts'
import { createPinia, useI18nStore, piniaPersist } from '@airovo/stores'
import type { Locale } from '@airovo/stores/i18n'
import { usePreferencesStore } from '@airovo/stores/preferences'
import { resolvePreferences, type Preferences } from '@airovo/config/preferences'
import { APP_CONTEXT_KEY, type AppContext } from './context'

/**
 * Pre-declared route modules map.
 *
 * Apps call `import.meta.glob('./routes/modules/*.ts', { eager: false })`
 * at their module level (Vite needs a static literal) and pass the result here.
 */
export type RouteModuleLoader = () => Promise<RouteRecordRaw | { default: RouteRecordRaw | RouteRecordRaw[] }>
export type RouteModuleGlobs = Record<string, RouteModuleLoader>
/** Convenience: pass either a glob map or a thunk that returns one. */
export type RouteModulesInput = RouteModuleGlobs | (() => RouteModuleGlobs)


/**
 * Third-party UI adapter configuration.
 */
export type EffectsConfig = false | {
    adapters?: Array<'element-plus' | 'naive-ui'>
    initialLocale?: Locale
}

/**
 * Built-in auth-guard configuration.
 *
 * When set, a beforeEach guard is appended that:
 *   - lets through any route with `meta.public: true`
 *   - lets through any path under `allowPrefix`
 *   - bounces unauthenticated users to `loginPath` (with `?redirect=...`)
 *   - bounces already-logged-in users away from `loginPath`
 *
 * Apps bring their own store via `useStore`. Returns at least
 * `{ isLoggedIn: boolean }`.
 */
export interface AuthGuardConfig {
    /** Reactive accessor returning `{ isLoggedIn }`. */
    useStore: () => { isLoggedIn: boolean }
    /** Login route path. Default: '/login' */
    loginPath?: string
    /** Extra allow-list path prefixes */
    allowPrefix?: string[]
}

export interface AirovoAppOptions {
    /** App name - used for branding and `<title>` tag */
    name?: string
    /** App title - defaults to VITE_APP_TITLE or name */
    title?: string
    /** Home path - defaults to '/dashboard' */
    homePath?: string
    /** Menu mode */
    menusMod?: 'frontend' | 'backend' | 'mixed'
    /** Custom app-level preference overrides */
    overrides?: Partial<Preferences>
    /**
     * Root component. Apps pass their App.vue (or a custom layout root).
     * If omitted, createApp will lazily import `./App.vue` from the consumer
     * package, falling back to a noop render so a fresh project can still boot.
     */
    root?: Component
    /** Pre-declared route module globs (Vite-agnostic). */
    routeModules?: RouteModulesInput
    /**
     * Extra beforeEach guards. The built-in auth guard (when `auth`
     * is provided) is appended BEFORE these so apps can layer additional
     * checks (e.g. permissions) on top of the auth result.
     */
    beforeEach?: NavigationGuardWithThis<undefined>
    /**
     * Built-in auth guard. Pass an `AuthGuardConfig` to enable.
     * Omit or set `false` to disable (apps roll their own in `beforeEach`).
     */
    auth?: false | AuthGuardConfig
    /** Third-party UI adapters (set to false to disable) */
    effects?: EffectsConfig
}

export interface AirovoApp {
    app: App
    router: AirovoRouter
    pinia: Pinia
    i18n: ReturnType<typeof createLayoutsI18n>
    /** Mount the app to a DOM element */
    mount: (selector?: string) => void
}

/**
 * Try to dynamically import the app's `App.vue`.
 * Currently disabled: keeping this surface stable for future use,
 * but apps must pass `root: App` explicitly. The auto-import proved
 * brittle with Vite's import-analysis.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _tryLoadDefaultRoot(): Promise<Component | null> {
    return null
}

/**
 * Create an Airovo app with sensible defaults.
 *
 * Built-in: Pinia, i18n, Router, Preferences, Effects integration.
 * Optional: built-in auth guard (just pass `auth: { useStore }`).
 *
 * @example
 * ```ts
 * // apps/myapp/src/routes.ts
 * export default import.meta.glob('./router/modules/*.ts', { eager: false })
 *
 * // apps/myapp/src/main.ts
 * import { createApp } from '@airovo/app'
 * import { useAuthStore } from '@airovo/stores/auth'
 * import routes from './routes'
 *
 * const { mount } = await createApp({
 *   name: 'my-app',
 *   routeModules: routes,
 *   auth: { useStore: () => ({ isLoggedIn: useAuthStore().isLoggedIn }) },
 * })
 * mount('#app')
 * ```
 */
export async function createApp(options: AirovoAppOptions = {}): Promise<AirovoApp> {
    // 1. Preferences
    const appOverrides = (options.overrides ?? {}) as Partial<Preferences>
    const preferences = resolvePreferences(appOverrides)

    // 2. Pinia
    const pinia = createPinia()
    pinia.use(piniaPersist)

    // 3. I18n
    const i18n = createLayoutsI18n()

    // 4. Load route modules
    //    Accept either:
    //    - a function returning a glob map (Vite-idiomatic)
    //    - a glob map directly
    //    - a flat array of RouteRecordRaw
    const routes: RouteRecordRaw[] = []
    if (options.routeModules) {
        let globs: RouteModuleGlobs | null = null
        if (typeof options.routeModules === 'function') {
            globs = options.routeModules()
        } else {
            globs = options.routeModules
        }
        for (const key of Object.keys(globs)) {
            const loader = globs[key]
            const mod = (await loader()) as { default?: RouteRecordRaw | RouteRecordRaw[] }
            const exp = mod?.default
            if (!exp) continue
            if (Array.isArray(exp)) routes.push(...exp)
            else routes.push(exp)
        }
    }

    // Root redirect (if no '/' defined)
    if (!routes.some((r) => r.path === '/')) {
        routes.push({ path: '/', redirect: options.homePath ?? '/dashboard' })
    }

    // 5. Router
    const router = createAppRouter({
        routes,
        menusMod: options.menusMod,
    })

    // 6. Built-in auth guard (apps opt in by passing `auth: { useStore }`)
    if (options.auth) {
        const authCfg = options.auth
        const loginPath = authCfg.loginPath ?? '/login'
        const allowPrefix = authCfg.allowPrefix ?? []
        const homePath = options.homePath ?? '/dashboard'

        router.router.beforeEach((to) => {
            if (to.meta.public) return true
            if (allowPrefix.some((p) => to.path.startsWith(p))) return true

            const { isLoggedIn } = authCfg.useStore()
            if (!isLoggedIn) {
                return { path: loginPath, query: { redirect: to.fullPath } }
            }
            if (to.path === loginPath) {
                return { path: homePath }
            }
            return true
        })
    }

    // 7. Extra guards
    if (options.beforeEach) {
        router.router.beforeEach(options.beforeEach)
    }

    // 8. Resolve root component — apps must pass `root: App` explicitly.
    //    We do not auto-import to keep the surface predictable and avoid
    //    Vite's import-analysis issues with cross-package dynamic imports.
    const root = options.root
    if (!root) {
        // eslint-disable-next-line no-console
        console.warn(
            '[@airovo/app] No root component provided. Pass `root: App` to createApp().',
        )
    }

    // 9. Vue app
    const app = root ? createVueApp(root) : createVueApp({})
    app.use(pinia)
    app.use(i18n)
    app.use(router.router)

    // 10. Apply preferences
    usePreferencesStore().applyOverrides(appOverrides)

    // 11. Bind i18n locale
    useI18nStore().bindExternal(
        (i18n as unknown as { global: { locale: { value: Locale } } }).global.locale,
    )

    // 12. Third-party UI adapters
    if (options.effects !== false) {
        try {
            const { installAdapters } = await import('@airovo/effects')
            await installAdapters(app, {
                adapters: options.effects?.adapters,
                initialLocale: options.effects?.initialLocale ?? 'zh-CN',
            })
        } catch {
            /* @airovo/effects not installed — opt-in only */
        }
    }

    // 13. App context
    const ctx: AppContext = {
        app,
        router: router.router,
        pinia,
        i18n,
        menus: router.menus,
        progress: router.progress,
    }
    app.provide(APP_CONTEXT_KEY, ctx)

    function mount(selector: string = '#app') {
        app.mount(selector)
    }

    return { app, router, pinia, i18n, mount }
}
