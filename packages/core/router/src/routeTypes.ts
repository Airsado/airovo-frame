/**
 * Route metadata recognised by the framework. Routes without a title
 * are not surfaced as menu items.
 */
export interface RouteMeta {
    /** Menu label. Routes without a title are not surfaced as menu items. */
    title?: string
    /** Iconify icon name (e.g. `'lucide:home'`). */
    icon?: string
    /** When true, the route is registered but never appears in the sidebar. */
    hideInMenu?: boolean
    /** Marks the route as a top-level active entry (sidebar highlights it). */
    active?: boolean
    /** When true, the route is accessible without authentication. */
    public?: boolean
}

/**
 * Framework route record (vue-router targeted). Business modules export
 * these as default exports; the framework converts them to vue-router
 * `RouteRecordRaw` at registration time.
 *
 * The `component` field is a lazy loader returning `Promise<unknown>`.
 * The router casts the resolved module to vue-router's component type.
 */
export interface AgnosticRouteRecord {
    path: string
    name?: string
    /** Redirect target. When set, `component` is ignored. */
    redirect?: string
    /** Lazy component loader. */
    component?: () => Promise<unknown>
    meta?: RouteMeta
    children?: AgnosticRouteRecord[]
}

/** Sidebar menu item — derived from a route tree or fetched from backend. */
export interface MenuItem {
    title: string
    url: string
    icon?: string
    isActive?: boolean
    children?: MenuItem[]
}

export type MenusMod = 'frontend' | 'backend' | 'mixed'
