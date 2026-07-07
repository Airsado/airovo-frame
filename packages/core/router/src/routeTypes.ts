import 'vue-router'

/**
 * Route metadata recognised by the framework.
 */
export interface RouteMeta {
    /** Menu label. Routes without a title are not surfaced as menu items. */
    title?: string
    /** Iconify icon name (e.g. `'lucide:home'`). */
    icon?: string
    /** When true, the route is registered but never appears in the sidebar. */
    hideInMenu?: boolean
    /** Marks the route as a top-level active entry. */
    active?: boolean
    /** When true, the route is accessible without authentication. */
    public?: boolean
    /** When true, the route renders without the main layout (e.g. login). */
    ignoreLayout?: boolean
}

declare module 'vue-router' {
    interface RouteMeta {
        title?: string
        icon?: string
        hideInMenu?: boolean
        active?: boolean
        public?: boolean
        ignoreLayout?: boolean
    }
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
