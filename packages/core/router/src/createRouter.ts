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

    if (beforeEach) router.beforeEach(beforeEach)

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

    return { router, menus, refreshMenus }
}
