import { createRouter as createVueRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { computed, ref } from 'vue'
import { toVueRoutes } from './adapter'
import { deriveMenus } from './derive'
import { mergeMenus } from './merge'
import { coreRoutes } from './modules'
import type {
    AgnosticRouteRecord,
    AppRouter,
    MenuItem,
    RouterOptions,
} from './types'

/**
 * Build the app router. Wires together the framework's core routes,
 * the app's static modules, and the dynamic menu fetch described in
 * `RouterOptions`.
 *
 * Apps pass `AgnosticRouteRecord` records via `modules`. The router
 * converts them to vue-router `RouteRecordRaw`, derives sidebar menus
 * (via `deriveMenus`), and exposes a reactive `menus` ref.
 *
 * @example
 * ```ts
 * // apps/playwright/src/router/index.ts
 * import { createAppRouter, loadAllModules, type AgnosticRouteRecord } from '@airovo/router'
 *
 * const globs = import.meta.glob<{ default: AgnosticRouteRecord }>(
 *     './routes/modules/*.ts', { eager: false },
 * )
 * const modules = await loadAllModules(Object.keys(globs), globs)
 *
 * export const appRouter = createAppRouter({ modules })
 * app.use(appRouter.router)
 * // appRouter.menus → pass to <BasicLayout :menus="appRouter.menus" />
 * ```
 */
export function createAppRouter(options: RouterOptions = {}): AppRouter {
    const {
        modules: moduleSources = [],
        menusMod: menusModOption,
        fetchMenus,
        homePath: homePathOption,
        preferences,
        beforeEach,
    } = options

    // Resolution priority for menusMod / homePath:
    //   1. explicit option
    //   2. preferences bridge
    //   3. built-in default
    const menusMod = menusModOption ?? preferences?.app?.menusMod ?? 'frontend'
    const homePath = homePathOption ?? preferences?.app?.homePath ?? '/dashboard'

    const staticRoutes: AgnosticRouteRecord[] = moduleSources

    // Derive sidebar menus from the route tree.
    const localMenus: MenuItem[] = deriveMenus(staticRoutes)

    // Reactive dynamic menu state — `ref` so Vue tracks mutations and
    // the `computed` menus re-evaluates when `refreshMenus()` updates it.
    const dynamicMenus = ref<MenuItem[]>([])

    const menus = computed<MenuItem[]>(() =>
        mergeMenus(localMenus, dynamicMenus.value, menusMod),
    )

    // Register: core routes (framework-internal) + app routes + root redirect.
    const vueRoutes: RouteRecordRaw[] = [
        ...toVueRoutes(coreRoutes),
        ...toVueRoutes(staticRoutes),
        { path: '/', redirect: homePath },
    ]

    const router = createVueRouter({
        history: createWebHistory(),
        routes: vueRoutes,
        scrollBehavior: () => ({ top: 0 }),
    })

    // Progress bar state — `progress` is 0-100. Renders unconditionally
    // in `BasicLoadingBar`; the bar is hidden by 0% width when idle.
    // The framework animates it through three phases on every navigation:
    //   t=0:   jump to 30  (instantly visible)
    //   mid:   bump to 70  (engagement)
    //   done:  jump to 100 (after a min-duration so the bar feels real)
    //   600ms: reset to 0
    const progress = ref(0)
    let resetTimer: ReturnType<typeof setTimeout> | null = null
    let midTimer: ReturnType<typeof setTimeout> | null = null

    function startProgress(): void {
        if (resetTimer) {
            clearTimeout(resetTimer)
            resetTimer = null
        }
        if (midTimer) {
            clearTimeout(midTimer)
            midTimer = null
        }
        progress.value = 30
        // Bump to 70 after a short delay to simulate real progress.
        midTimer = setTimeout(() => {
            if (progress.value < 90) progress.value = 70
        }, 200)
    }

    function finishProgress(): void {
        if (midTimer) {
            clearTimeout(midTimer)
            midTimer = null
        }
        // Reach 100% so the bar visibly fills. Hold for ~250ms (the
        // opacity transition) so the user registers "loaded", then
        // reset to 0 — the LoadingBar component fades opacity out
        // during the same transition.
        progress.value = 100
        if (resetTimer) clearTimeout(resetTimer)
        resetTimer = setTimeout(() => {
            progress.value = 0
            resetTimer = null
        }, 350)
    }

    // Framework's beforeEach runs first. Starts the progress animation.
    router.beforeEach(() => {
        startProgress()
        return true
    })

    // The app's beforeEach (if provided) runs after the framework's.
    // It can call `return false` to cancel; the afterEach still runs
    // and resets the bar via `finishProgress()`.
    if (beforeEach) router.beforeEach(beforeEach)

    // Reset the bar after the navigation commits.
    router.afterEach(() => {
        finishProgress()
    })

    async function refreshMenus(): Promise<void> {
        if (!fetchMenus) {
            dynamicMenus.value = []
            return
        }
        try {
            dynamicMenus.value = await fetchMenus()
        } catch (err) {
            // Don't blow up the app on a transient menu fetch failure;
            // log and fall back to the local menu set.
            // eslint-disable-next-line no-console
            console.error('[router] fetchMenus failed:', err)
            dynamicMenus.value = []
        }
    }

    return {
        router,
        menus,
        refreshMenus,
        progress,
        // Re-export vue-router's guard-registration API so apps can add
        // their own guards without touching the router instance
        // directly. These run AFTER the framework's progress guards.
        beforeEach: router.beforeEach.bind(router),
        afterEach: router.afterEach.bind(router),
    }
}
