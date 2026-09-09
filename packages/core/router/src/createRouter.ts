import {
    createRouter as createVueRouter,
    createWebHistory,
    type Router,
    type RouteRecordRaw,
} from 'vue-router'
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { MenuItem, MenusMod } from './routeTypes'

/**
 * Plain vue-router config — apps pass `routes: RouteRecordRaw[]`.
 * The framework augments this with:
 *   - meta.ignoreLayout: when true, the route renders outside BasicLayout
 *   - meta.public:       when true, the auth guard allows it through
 *   - menus:             reactive sidebar items derived from routes
 *   - progress:          navigation progress (0-100) for the loading bar
 */
export interface AirovoRouterOptions {
    /** Application routes. Must include a root path (`/`) and any other routes. */
    routes: RouteRecordRaw[]
    /** When `frontend` (default), menus come from route meta. `backend` reserves a slot. */
    menusMod?: MenusMod
    /** Optional dynamic menu loader (used when menusMod !== 'frontend'). */
    fetchMenus?: () => Promise<MenuItem[]>
    /**
     * Filter applied per-menu-item. Receives the route meta and returns
     * false to drop the item. The `@airovo/permission` package wires its
     * `permissionFilter` here so RBAC-driven menu filtering actually works.
     */
    permissionFilter?: (meta: unknown) => boolean
    /**
     * Navigation start guard. Built-in `LoadingBar` watches `progress` (0-100).
     */
    beforeEach?: (to: unknown, from: unknown) => boolean | unknown | Promise<unknown>
    /**
     * After-navigation hook (analytics, cleanup, etc).
     */
    afterEach?: (to: unknown, from: unknown) => void | Promise<void>
}

export interface AirovoRouter {
    /** The underlying vue-router instance — register via `app.use(router)`. */
    router: Router
    /** Reactive sidebar menu items derived from the route tree. */
    menus: ComputedRef<MenuItem[]>
    /**
     * Install / replace the menu permission filter. Called by
     * `@airovo/permission` after the router is built so RBAC
     * filtering actually drops items from `menus`.
     */
    setPermissionFilter: (fn: (meta: unknown) => boolean) => void
    /** Navigation progress 0-100. Frameworks's LoadingBar uses this. */
    progress: Ref<number>
    /** Re-fetch backend-driven menus (only relevant when menusMod !== 'frontend'). */
    refreshMenus: () => Promise<void>
}

/**
 * Walk the route tree and produce MenuItem[] for the sidebar.
 * Skips routes with `meta.hideInMenu` and follows the first redirect child.
 * If `permissionFilter` is given, items whose meta fails the check are
 * dropped (this is what the `@airovo/permission` package uses to wire
 * RBAC menu filtering — without this, the filter is a no-op).
 */
function deriveMenusFromRoutes(
    routes: RouteRecordRaw[],
    parentPath: string = '',
    permissionFilter?: (meta: unknown) => boolean,
): MenuItem[] {
    const out: MenuItem[] = []
    for (const r of routes) {
        if (r.meta?.hideInMenu) continue
        // Drop items the permission filter rejects. Routes with no
        // meta.roles / meta.permissions are kept (no constraint).
        if (permissionFilter && !permissionFilter(r.meta)) continue

        let path = r.path

        // Resolve absolute path for children
        const absolutePath = path.startsWith('/') ? path : `${parentPath}/${path}`

        // Resolve redirect chains
        if (r.redirect) {
            path = r.redirect as string
        }
        if (!path || path === '') continue

        const item: MenuItem = {
            title: r.meta?.title ?? '',
            url: absolutePath,
            icon: r.meta?.icon,
            isActive: r.meta?.active === true,
        }
        if (r.children?.length) {
            item.children = deriveMenusFromRoutes(r.children, absolutePath, permissionFilter)
        }
        if (item.title) out.push(item)
    }
    return out
}

/**
 * Create a framework-augmented vue-router.
 *
 * Thin wrapper around `vue-router` that adds:
 *   - menu derivation
 *   - progress tracking (used by the framework's LoadingBar)
 *   - optional backend menu fetching
 *
 * Apps use the returned `router` directly with `app.use()`.
 */
export function createAppRouter(options: AirovoRouterOptions): AirovoRouter {
    const { routes, fetchMenus, menusMod: _menusMod = 'frontend' } = options

    // Backend menu state (used when menusMod !== 'frontend')
    const dynamicMenus = ref<MenuItem[]>([])

    const router = createVueRouter({
        history: createWebHistory(),
        routes,
        scrollBehavior: () => ({ top: 0 }),
    })

    // ---- Progress bar state (0-100) ----
    const progress = ref(0)
    let resetTimer: ReturnType<typeof setTimeout> | null = null
    let midTimer: ReturnType<typeof setTimeout> | null = null
    let inFlight = false

    function clearTimers(): void {
        if (resetTimer) {
            clearTimeout(resetTimer)
            resetTimer = null
        }
        if (midTimer) {
            clearTimeout(midTimer)
            midTimer = null
        }
    }

    function startProgress(): void {
        clearTimers()
        inFlight = true
        progress.value = 30
        midTimer = setTimeout(() => {
            if (inFlight && progress.value < 90) progress.value = 70
        }, 200)
    }

    function finishProgress(): void {
        clearTimers()
        inFlight = false
        progress.value = 100
        resetTimer = setTimeout(() => {
            progress.value = 0
            resetTimer = null
        }, 250)
    }

    // Custom beforeEach runs first
    router.beforeEach(() => {
        startProgress()
        return true
    })
    if (options.beforeEach) {
        router.beforeEach(options.beforeEach as Parameters<typeof router.beforeEach>[0])
    }
    router.afterEach(() => {
        finishProgress()
        if (options.afterEach) {
            void options.afterEach(undefined, undefined)
        }
    })

    // ---- Menus ----
    // The filter is stored in a ref so `installPermission` can update
    // it after the router is built; the `menus` computed tracks the
    // ref and re-evaluates accordingly.
    const permissionFilter = ref<((meta: unknown) => boolean) | undefined>(
        options.permissionFilter,
    )
    const menus = computed<MenuItem[]>(() => {
        const filter = permissionFilter.value
        if (_menusMod === 'frontend') {
            return deriveMenusFromRoutes(routes, '', filter)
        }
        // For 'backend' / 'mixed', start with route-derived menu, overlay dynamic ones.
        const local = deriveMenusFromRoutes(routes, '', filter)
        return mergeMenus(local, dynamicMenus.value, _menusMod)
    })

    async function refreshMenus(): Promise<void> {
        if (!fetchMenus) {
            dynamicMenus.value = []
            return
        }
        try {
            dynamicMenus.value = await fetchMenus()
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[router] fetchMenus failed:', err)
            dynamicMenus.value = []
        }
    }

    return {
        router,
        menus,
        setPermissionFilter: (fn: (meta: unknown) => boolean) => {
            permissionFilter.value = fn
        },
        progress,
        refreshMenus,
    }
}

/**
 * Combine two menu trees for the `mixed` mode.
 * - `backend`: replace local entirely with dynamic
 * - `mixed`: dynamic overrides local by `url`
 * - `frontend`: dynamic ignored
 */
function mergeMenus(local: MenuItem[], dynamic: MenuItem[], mod: MenusMod): MenuItem[] {
    if (mod === 'backend') return dynamic
    if (mod === 'frontend') return local
    // mixed: dynamic wins per-url
    const dynByUrl = new Map(dynamic.map((m) => [m.url, m]))
    return local.map((l) => {
        const override = dynByUrl.get(l.url)
        return override ? { ...l, ...override } : l
    })
}
