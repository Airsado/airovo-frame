import 'vue-router'

/**
 * Route metadata recognised by the framework.
 */
export interface RouteMeta {
    /** Menu label. Routes without a title are not surfaced as menu items. */
    title?: string
    /** i18n key for the menu label; title remains a readable fallback. */
    titleKey?: string
    /** Iconify icon name (e.g. `'lucide:home'`). */
    icon?: string
    /** Optional sidebar section label. */
    group?: string
    /** i18n key for the sidebar section; group remains a fallback. */
    groupKey?: string
    /** Optional stable sidebar sort order; lower values render first. */
    order?: number
    /** Optional badge rendered beside the menu item. */
    badge?: string | number
    /** External navigation entry. External entries are rendered as anchors. */
    external?: boolean
    /** When true, the route is registered but never appears in the sidebar. */
    hideInMenu?: boolean
    /** Marks the route as a top-level active entry. */
    active?: boolean
    /** When true, the route is accessible without authentication. */
    public?: boolean
    /** When true, the route renders without the main layout (e.g. login). */
    ignoreLayout?: boolean
    /** Restrict access to users that have one of these roles. */
    roles?: string[]
    /** Restrict access to users that have one of these permissions. */
    permissions?: string[]
    /** Explicitly mark a route as requiring an authenticated session. */
    requiresAuth?: boolean
    /** Keep this route component alive while switching tabs. */
    keepAlive?: boolean
    /** Explicit Vue component name for KeepAlive when it differs from route name. */
    cacheName?: string
    /** Keep this tab permanently open. */
    affix?: boolean
    /** Set false to protect this tab from close actions without affixing it. */
    closable?: boolean
    /** Do not create a tab for this route. */
    hideInTab?: boolean
    /** Keep a different menu entry active while this route is displayed. */
    activeMenu?: string
    /** Vben-style view path returned by a backend menu (for example `/views/dashboard/Overview.vue`). */
    component?: string
    /** Optional layout key consumed by an app's layout host. */
    layout?: string
}

declare module 'vue-router' {
    interface RouteMeta {
        title?: string
        titleKey?: string
        icon?: string
        hideInMenu?: boolean
        active?: boolean
        public?: boolean
        ignoreLayout?: boolean
        group?: string
        groupKey?: string
        order?: number
        badge?: string | number
        external?: boolean
        roles?: string[]
        permissions?: string[]
        requiresAuth?: boolean
        keepAlive?: boolean
        cacheName?: string
        affix?: boolean
        closable?: boolean
        hideInTab?: boolean
        activeMenu?: string
        component?: string
        layout?: string
    }
}

/** Sidebar menu item — derived from a route tree or fetched from backend. */
export interface MenuItem {
    title: string
    titleKey?: string
    /** Canonical menu URL used by the framework after normalization. */
    url: string
    /** Vben-style backend menu path. Applications may return this instead of `url`. */
    path?: string
    icon?: string
    group?: string
    groupKey?: string
    /** Optional stable sidebar sort order; lower values render first. */
    order?: number
    badge?: string | number
    /** Render the menu entry as unavailable without removing it from the tree. */
    disabled?: boolean
    isActive?: boolean
    /** Stable route name, when supplied by a backend menu adapter. */
    name?: string
    /** Backend view path. It is resolved only against the app's static page map. */
    component?: string
    /** Route metadata transported by a backend menu endpoint. */
    meta?: Partial<RouteMeta>
    /** Optional route redirect. */
    redirect?: string
    /** External link; external entries do not become router records. */
    external?: boolean
    children?: MenuItem[]
}

/** Raw menu shape accepted from an application-owned backend adapter. */
export type MenuItemInput = Omit<MenuItem, 'url' | 'children'> & {
    url?: string
    /** Vben-style route path; normalized to `url` by the framework. */
    path?: string
    children?: MenuItemInput[]
}

export type MenusMod = 'frontend' | 'backend' | 'mixed'
