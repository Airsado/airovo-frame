import {
    createRouter as createVueRouter,
    createWebHashHistory,
    createWebHistory,
    type Router,
    type RouteComponent,
    type RouteRecordRaw,
    type RouterScrollBehavior,
    RouterView,
} from 'vue-router'
import { computed, defineAsyncComponent, defineComponent, h, ref, type Component, type ComputedRef, type Ref } from 'vue'
import type { MenuItem, MenuItemInput, MenusMod } from './routeTypes'
import type { AppMenuSource } from './registry'

/** Components discovered from the consuming application's `views` glob. */
export type PageMap = Record<string, RouteComponent>

function normalizeViewPath(path: string): string {
    const normalized = path.replace(/\\/g, '/').replace(/^\.?\/?/, '')
    const withViews = normalized.startsWith('views/') ? normalized : `views/${normalized}`
    const withLeadingSlash = `/${withViews}`
    return withLeadingSlash.endsWith('.vue') ? withLeadingSlash : `${withLeadingSlash}.vue`
}

export interface FrameworkRouterOptions {
    routes: RouteRecordRaw[]
    history?: 'hash' | 'web'
    base?: string
    scrollBehavior?: RouterScrollBehavior
    menusMod?: MenusMod
    menus?: AppMenuSource
    /** Map vben-style backend view paths to statically imported app components. */
    pageMap?: PageMap
    permissionFilter?: (meta: unknown) => boolean
    beforeEach?: (to: unknown, from: unknown) => boolean | unknown | Promise<unknown>
    afterEach?: (to: unknown, from: unknown) => void | Promise<void>
}

export interface FrameworkRouter {
    router: Router
    menus: ComputedRef<MenuItem[]>
    setPermissionFilter: (fn: (meta: unknown) => boolean) => void
    progress: Ref<number>
    refreshMenus: () => Promise<boolean>
    registerDynamicRoutes: (items: MenuItemInput[]) => void
    clearDynamicRoutes: () => void
    loadedPaths: Readonly<Ref<string[]>>
}

function unknownDynamicComponent(viewPath: string): RouteComponent {
    const safeKey = viewPath.replace(/[^a-zA-Z0-9_$]/g, '_')
    return defineComponent({
        name: safeKey ? `UnknownDynamicRoute_${safeKey}` : 'UnknownDynamicRoute',
        setup() {
            return () => h(
                'div',
                { class: 'flex min-h-32 items-center justify-center p-6 text-sm text-destructive' },
                `未注册的动态页面组件：${viewPath || 'unknown'}`,
            )
        },
    }) as RouteComponent
}

/**
 * KeepAlive matches the component's registered `name`, not the router name.
 * Backend routes use stable view paths and are often registered without a
 * route name that matches the actual Vue component. Give page-map components
 * a deterministic wrapper name when
 * they do not already expose one so the tab store can cache them reliably.
 */
function componentName(component: RouteComponent | undefined): string | undefined {
    if (!component || typeof component !== 'object') return undefined
    const candidate = component as unknown as { name?: unknown; __name?: unknown }
    if (typeof candidate.name === 'string' && candidate.name) return candidate.name
    if (typeof candidate.__name === 'string' && candidate.__name) return candidate.__name
    return undefined
}

function ensureNamedComponent(
    component: RouteComponent,
    viewPath: string,
): { component: RouteComponent; cacheName: string } {
    const existingName = componentName(component)
    if (existingName) return { component, cacheName: existingName }

    const safeKey = viewPath.replace(/[^a-zA-Z0-9_$]/g, '_') || 'unknown'
    const cacheName = `FrameworkDynamic_${safeKey}`
    // Registry entries are commonly Vite lazy loaders (`() => import(...)`).
    // Keep them as Vue async components; rendering the loader through `h()`
    // would treat it as a functional component and return a Promise vnode.
    if (typeof component === 'function') {
        const wrapped = defineAsyncComponent(component as () => Promise<Component>) as RouteComponent & { name?: string }
        wrapped.name = cacheName
        return { component: wrapped, cacheName }
    }
    const wrapped = defineComponent({
        name: cacheName,
        inheritAttrs: false,
        setup(_props, context) {
            return () => h(component, context.attrs, context.slots)
        },
    }) as RouteComponent
    return { component: wrapped, cacheName }
}

const DynamicRouteOutlet = defineComponent({
    name: 'DynamicRouteOutlet',
    setup() {
        return () => h(RouterView)
    },
})

function joinPath(parentPath: string, path: string): string {
    if (!path) return parentPath || '/'
    if (path.startsWith('/')) return path
    const joined = `${parentPath}/${path}`.replace(/\/+/g, '/')
    return joined.startsWith('/') ? joined : `/${joined}`
}

function relativePath(parentPath: string, absolutePath: string): string {
    if (!parentPath) return absolutePath
    const prefix = parentPath.endsWith('/') ? parentPath : `${parentPath}/`
    return absolutePath.startsWith(prefix) ? absolutePath.slice(prefix.length) : absolutePath
}

function collectRouteNames(routes: RouteRecordRaw[], names: Set<string | symbol>): void {
    for (const route of routes) {
        if (route.name != null) names.add(route.name)
        if (route.children?.length) collectRouteNames(route.children, names)
    }
}

/**
 * Vue Router can attach a dynamic child only through a named parent. Preserve
 * anonymous local parents as-is for callers while giving internal parent
 * records a deterministic name in the router's private route table.
 */
function nameAnonymousParents(routes: RouteRecordRaw[]): RouteRecordRaw[] {
    const reserved = new Set<string | symbol>()
    collectRouteNames(routes, reserved)
    const nextName = (absolutePath: string): string => {
        const base = `local:${absolutePath}`
        if (!reserved.has(base)) {
            reserved.add(base)
            return base
        }
        let suffix = 2
        while (reserved.has(`${base}:${suffix}`)) suffix += 1
        const name = `${base}:${suffix}`
        reserved.add(name)
        return name
    }
    const visit = (items: RouteRecordRaw[], parentPath = ''): RouteRecordRaw[] => items.map((route) => {
        const absolutePath = joinPath(parentPath, route.path)
        const children = route.children?.length ? visit(route.children, absolutePath) : undefined
        if (!children?.length) return route
        return {
            ...route,
            ...(route.name == null ? { name: nextName(absolutePath) } : {}),
            children,
        }
    })
    return visit(routes)
}

function deriveMenusFromRoutes(
    routes: RouteRecordRaw[],
    parentPath = '',
    permissionFilter?: (meta: unknown) => boolean,
): MenuItem[] {
    const out: MenuItem[] = []
    for (const route of routes) {
        const meta = route.meta
        if (meta?.hideInMenu) continue
        // A restricted parent hides its complete subtree. An unrestricted
        // parent remains visible when some children are filtered out.
        if (permissionFilter && !permissionFilter(meta)) continue

        const absolutePath = joinPath(parentPath, route.path)
        const children = route.children?.length
            ? deriveMenusFromRoutes(route.children, absolutePath, permissionFilter)
            : undefined
        const title = meta?.title ?? ''
        if (!title) continue
        const order = normalizeMenuOrder(meta?.order)

        const item: MenuItem = {
            title,
            titleKey: meta?.titleKey,
            url: absolutePath,
            icon: meta?.icon,
            group: meta?.group,
            groupKey: meta?.groupKey,
            ...(order !== undefined ? { order } : {}),
            badge: meta?.badge,
            external: meta?.external === true,
            isActive: meta?.active === true,
            name: typeof route.name === 'string' ? route.name : undefined,
            component: meta?.component,
            meta,
            redirect: typeof route.redirect === 'string' ? route.redirect : undefined,
        }
        if (children?.length) item.children = children
        else if (route.children?.length) continue
        out.push(item)
    }
    return out
}

/** Accept both the framework's `url` field and vben-style backend `path`. */
function rawMenuPath(item: MenuItem | MenuItemInput): string {
    return item.url || item.path || ''
}

function normalizeMenuOrder(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function cloneMenu(item: MenuItem | MenuItemInput): MenuItem {
    const { order: inputOrder, ...rest } = item
    const order = normalizeMenuOrder(inputOrder) ?? normalizeMenuOrder(item.meta?.order)
    return {
        ...rest,
        ...(order !== undefined ? { order } : {}),
        url: rawMenuPath(item),
        meta: item.meta ? { ...item.meta } : undefined,
        children: item.children?.map(cloneMenu),
    }
}

function normalizeMenuPaths(items: MenuItemInput[], parentPath = ''): MenuItem[] {
    return items.map((item) => {
        const rawPath = rawMenuPath(item)
        const url = item.external ? rawPath : joinPath(parentPath, rawPath)
        return {
            ...cloneMenu(item),
            url,
            children: item.children?.length ? normalizeMenuPaths(item.children, url) : undefined,
        }
    })
}

function menuAllowed(item: MenuItem, permissionFilter?: (meta: unknown) => boolean): boolean {
    if (item.meta?.hideInMenu) return false
    const meta = item.meta ?? (item.component ? { component: item.component } : undefined)
    return !permissionFilter || permissionFilter(meta)
}

function mergeMenuTrees(
    local: MenuItem[],
    dynamic: MenuItem[],
    permissionFilter?: (meta: unknown) => boolean,
): MenuItem[] {
    const dynamicByUrl = new Map(dynamic.map((item) => [item.url, item]))
    const merged: MenuItem[] = []
    for (const localItem of local) {
        const override = dynamicByUrl.get(localItem.url)
        if (!override) {
            merged.push(cloneMenu(localItem))
            continue
        }
        dynamicByUrl.delete(localItem.url)
        // A backend item at the same URL is an explicit override. If it is
        // denied, remove the local item too; retaining the local copy would
        // leave a restricted backend menu visible in mixed mode.
        if (!menuAllowed(override, permissionFilter)) continue
        const children = mergeMenuTrees(localItem.children ?? [], override.children ?? [], permissionFilter)
        if (override.children?.length && !children.length && !(override.component ?? override.meta?.component)) continue
        merged.push({ ...cloneMenu(localItem), ...cloneMenu(override), ...(children.length ? { children } : {}) })
    }
    for (const item of dynamic) {
        if (!dynamicByUrl.has(item.url) || !menuAllowed(item, permissionFilter)) continue
        const children = item.children?.length
            ? mergeMenuTrees([], item.children, permissionFilter)
            : undefined
        if (item.children?.length && !children?.length && !(item.component ?? item.meta?.component)) continue
        merged.push({ ...cloneMenu(item), ...(children?.length ? { children } : {}) })
    }
    return merged
}

function filterMenuTree(items: MenuItem[], permissionFilter?: (meta: unknown) => boolean): MenuItem[] {
    return items.flatMap((item) => {
        if (item.meta?.hideInMenu) return []
        const meta = item.meta ?? (item.component ? { component: item.component } : undefined)
        if (permissionFilter && !permissionFilter(meta)) return []
        const children = item.children ? filterMenuTree(item.children, permissionFilter) : undefined
        if (item.children?.length && !children?.length && !(item.component ?? item.meta?.component)) return []
        return [{ ...item, children: children?.length ? children : undefined }]
    })
}

/** Convert a backend menu item using only the application's views whitelist. */
function menuToRoute(
    item: MenuItem,
    parentPath: string,
    pageMap: PageMap,
): RouteRecordRaw | null {
    if (item.external || !item.url) return null
    const absolutePath = joinPath(parentPath, item.url)
    const componentPath = item.component ?? item.meta?.component
    const normalizedComponentPath = componentPath
        ? normalizeViewPath(componentPath)
        : undefined
    const resolved = normalizedComponentPath
        ? ensureNamedComponent(pageMap[normalizedComponentPath] ?? unknownDynamicComponent(normalizedComponentPath), normalizedComponentPath)
        : item.children?.length
            ? { component: DynamicRouteOutlet as RouteComponent, cacheName: 'DynamicRouteOutlet' }
            : { component: unknownDynamicComponent(''), cacheName: 'UnknownDynamicRoute' }
    const component = resolved.component
    const order = normalizeMenuOrder(item.order) ?? normalizeMenuOrder(item.meta?.order)
    const meta = {
        ...(item.meta ?? {}),
        title: item.meta?.title ?? item.title,
        titleKey: item.titleKey ?? item.meta?.titleKey,
        icon: item.meta?.icon ?? item.icon,
        group: item.meta?.group ?? item.group,
        groupKey: item.groupKey ?? item.meta?.groupKey,
        ...(order !== undefined ? { order } : {}),
        badge: item.badge ?? item.meta?.badge,
        component: item.component ?? item.meta?.component,
        cacheName: item.meta?.cacheName ?? resolved.cacheName,
    }
    const children = item.children?.map((child) => menuToRoute(child, absolutePath, pageMap))
        .filter((child): child is RouteRecordRaw => Boolean(child))
    const route = {
        // Child route records must use a path relative to their parent. The
        // menu model itself keeps absolute URLs, so normalize only at this
        // router boundary.
        path: relativePath(parentPath, absolutePath),
        name: item.name ?? `dynamic:${absolutePath}`,
        component,
        redirect: item.redirect ?? (!normalizedComponentPath && item.children?.length
            ? item.children.find((child) => !child.external)?.url
            : undefined),
        meta,
    } as RouteRecordRaw
    return children?.length ? { ...route, children } as RouteRecordRaw : route
}

/**
 * Route names are global in vue-router, including names of nested records.
 * Backend menus can be merged with local routes and may repeat a business
 * name, so make collisions deterministic without exposing arbitrary keys to
 * the router.
 */
function uniqueRouteName(reserved: Set<string | symbol>, preferred: string, absolutePath: string): string {
    if (!reserved.has(preferred)) return preferred
    const base = `dynamic:${absolutePath}`
    if (!reserved.has(base)) return base
    let suffix = 2
    while (reserved.has(`${base}:${suffix}`)) suffix += 1
    return `${base}:${suffix}`
}

function reserveRouteNames(route: RouteRecordRaw, absolutePath: string, reserved: Set<string | symbol>): void {
    if (typeof route.name === 'string') {
        route.name = uniqueRouteName(reserved, route.name, absolutePath)
        // Reserve before visiting children: addRoute registers the entire tree,
        // so router.hasRoute alone cannot see sibling or ancestor collisions yet.
        reserved.add(route.name)
    }
    for (const child of route.children ?? []) {
        reserveRouteNames(child, joinPath(absolutePath, child.path), reserved)
    }
}

export function createAppRouter(options: FrameworkRouterOptions): FrameworkRouter {
    const {
        routes,
        menus: menuSource,
        menusMod: mode = 'frontend',
        history = 'web',
        pageMap = {},
    } = options
    const dynamicMenus = ref<MenuItem[]>([])
    const dynamicRouteNames = new Set<string>()
    // Backend menus may decorate a route that was already registered by the
    // app (the usual mixed-mode case). Keep the original metadata so a menu
    // refresh or logout can remove the backend decoration without leaving the
    // local route in a stale permission state.
    const overriddenRouteMeta = new Map<string, {
        route: ReturnType<Router['getRoutes']>[number]
        meta: Record<string, unknown>
    }>()
    let menuLoadGeneration = 0

    const router = createVueRouter({
        history: history === 'hash' ? createWebHashHistory(options.base) : createWebHistory(options.base),
        routes: nameAnonymousParents(routes),
        scrollBehavior: options.scrollBehavior ?? ((to, _from, savedPosition) => {
            if (savedPosition) return savedPosition
            if (to.hash) return { el: to.hash, behavior: 'smooth' }
            return { top: 0 }
        }),
    })

    const progress = ref(0)
    let resetTimer: ReturnType<typeof setTimeout> | null = null
    let midTimer: ReturnType<typeof setTimeout> | null = null
    let inFlight = false
    const loadedPaths = ref<string[]>([])

    function clearTimers(): void {
        if (resetTimer) clearTimeout(resetTimer)
        if (midTimer) clearTimeout(midTimer)
        resetTimer = null
        midTimer = null
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
        // A navigation to a page that was already visited does not start the
        // route progress bar. Keep the completion hook idempotent so those
        // navigations do not briefly flash the bar again.
        if (!inFlight) return
        clearTimers()
        inFlight = false
        progress.value = 100
        resetTimer = setTimeout(() => {
            progress.value = 0
            resetTimer = null
        }, 250)
    }

    router.beforeEach((to) => {
        // Match vben's route guard behaviour: the progress indicator is only
        // shown the first time a page path is loaded. Switching back to an
        // existing tab (including a query-only change) should be immediate.
        if (!loadedPaths.value.includes(to.path)) startProgress()
        return true
    })
    if (options.beforeEach) router.beforeEach(options.beforeEach as Parameters<typeof router.beforeEach>[0])
    router.afterEach((to, from, failure) => {
        finishProgress()
        // A cancelled/redirected navigation did not open a tab. Leave the
        // path unmarked so the eventual successful navigation still shows
        // the loading indicator once.
        if (!failure && !loadedPaths.value.includes(to.path)) loadedPaths.value.push(to.path)
        void options.afterEach?.(to, from)
    })

    const permissionFilter = ref(options.permissionFilter)
    const menus = computed<MenuItem[]>(() => {
        const local = deriveMenusFromRoutes(routes, '', permissionFilter.value)
        const dynamic = filterMenuTree(dynamicMenus.value, permissionFilter.value)
        if (mode === 'backend') return dynamic
        if (mode === 'mixed') return mergeMenuTrees(local, dynamicMenus.value, permissionFilter.value)
        return local
    })

    function clearDynamicRoutes(): void {
        menuLoadGeneration += 1
        for (const name of dynamicRouteNames) {
            if (router.hasRoute(name)) router.removeRoute(name)
        }
        dynamicRouteNames.clear()
        for (const { route, meta } of overriddenRouteMeta.values()) {
            for (const key of Object.keys(route.meta)) delete route.meta[key]
            Object.assign(route.meta, meta)
        }
        overriddenRouteMeta.clear()
        dynamicMenus.value = []
    }

    function applyDynamicMeta(
        existing: ReturnType<Router['getRoutes']>[number],
        dynamic: RouteRecordRaw,
    ): void {
        const key = existing.name != null ? `name:${String(existing.name)}` : `path:${existing.path}`
        if (!overriddenRouteMeta.has(key)) {
            overriddenRouteMeta.set(key, { route: existing, meta: { ...existing.meta } })
        }
        // Preserve local metadata that the backend did not mention (in
        // particular a local requiresAuth/permission restriction), while
        // allowing explicit backend fields to override it.
        Object.assign(existing.meta, dynamic.meta)
    }

    function registerDynamicRoutes(items: MenuItemInput[]): void {
        clearDynamicRoutes()
        dynamicMenus.value = normalizeMenuPaths(items)
        if (mode === 'frontend') return
        const reservedNames = new Set(router.getRoutes().flatMap(route => route.name == null ? [] : [route.name]))
        function register(itemsToRegister: MenuItem[], parentPath: string, parentName?: string | symbol): void {
            for (const item of itemsToRegister) {
                const absolutePath = joinPath(parentPath, item.url)
                const route = menuToRoute(item, parentPath, pageMap)
                if (!route) continue

                // A backend menu may override the label and metadata of an
                // existing local route without replacing its component. In
                // mixed mode only descendants that do not already exist are
                // added below that local record.
                const existing = router.getRoutes().find((candidate) => candidate.path === absolutePath)
                let currentName = existing?.name == null ? undefined : existing.name
                if (!existing) {
                    reserveRouteNames(route, absolutePath, reservedNames)
                    try {
                        if (parentName) router.addRoute(parentName, route)
                        else router.addRoute(route)
                        currentName = route.name
                        if (typeof currentName === 'string') dynamicRouteNames.add(currentName)
                    } catch (error) {
                        // eslint-disable-next-line no-console
                        console.error('[framework/router] failed to register dynamic route', route.name, error)
                        continue
                    }
                } else {
                    applyDynamicMeta(existing, route)
                }

                // `menuToRoute` already builds the complete child tree. When a
                // new parent is added, registering its children a second time
                // would create duplicate records (and duplicate route names).
                // Recurse only when this path reuses an existing local route;
                // in that case only the dynamic descendants need to be added.
                if (item.children?.length && currentName && existing) {
                    register(item.children, absolutePath, currentName)
                }
            }
        }
        register(dynamicMenus.value, '')
    }

    async function refreshMenus(): Promise<boolean> {
        if (!menuSource?.load || mode === 'frontend') {
            if (mode === 'frontend') clearDynamicRoutes()
            return false
        }
        const generation = ++menuLoadGeneration
        try {
            const raw = await menuSource.load()
            if (generation !== menuLoadGeneration) return false
            const items = menuSource.normalize ? menuSource.normalize(raw) : Array.isArray(raw) ? raw as MenuItemInput[] : []
            registerDynamicRoutes(items)
            return true
        } catch (error) {
            if (generation !== menuLoadGeneration) return false
            // eslint-disable-next-line no-console
            console.error('[framework/router] menu load failed:', error)
            clearDynamicRoutes()
            dynamicMenus.value = []
            return false
        }
    }

    return {
        router,
        menus,
        setPermissionFilter: (fn) => { permissionFilter.value = fn },
        progress,
        refreshMenus,
        registerDynamicRoutes,
        clearDynamicRoutes,
        loadedPaths,
    }
}
