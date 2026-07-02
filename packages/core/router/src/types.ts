import type { NavigationGuardWithThis } from 'vue-router'
import type { AgnosticRouteRecord, MenuItem, MenusMod } from './routeTypes'

export type {
    AgnosticRouteRecord,
    MenuItem,
    MenusMod,
    RouteMeta,
} from './routeTypes'

/**
 * Structural subset of the framework `Preferences` shape that the
 * router is allowed to read. Defined here (not imported from
 * `@airovo/config`) so the router package stays free of preferences
 * runtime deps — any object with these fields is accepted.
 */
export interface PreferencesBridge {
    app?: {
        menusMod?: MenusMod
        homePath?: string
    }
}

export interface RouterOptions {
    /**
     * Route records from the app's `routes/modules/*.ts`. The router
     * converts these to vue-router `RouteRecordRaw[]` and registers them.
     */
    modules?: AgnosticRouteRecord[]
    /**
     * Where the sidebar menu ultimately comes from.
     *  - `frontend` (default): only the local modules contribute menus
     *  - `backend`: only the dynamic API contributes menus
     *  - `mixed`: both, deduplicated by `url`
     *
     * Resolution priority: this option > `preferences.app.menusMod` > 'frontend'.
     */
    menusMod?: MenusMod
    /**
     * Async fetcher for dynamic menus from the backend. Required when
     * `menusMod` is `backend` or `mixed`. Call `refreshMenus()` after
     * login to populate.
     */
    fetchMenus?: () => Promise<MenuItem[]>
    /**
     * Initial path to redirect to from `/`.
     *
     * Resolution priority: this option > `preferences.app.homePath` > '/dashboard'.
     */
    homePath?: string
    /**
     * Optional preferences bridge. When present, the router reads
     * `app.menusMod` and `app.homePath` from it as fallbacks.
     */
    preferences?: PreferencesBridge
    /**
     * Optional vue-router navigation guard, installed at router creation.
     * Use for auth checks, permission redirects, etc.
     */
    beforeEach?: NavigationGuardWithThis<undefined>
}

export interface AppRouter {
    router: import('vue-router').Router
    /** Reactive menu list — updates when dynamic menus are refreshed. */
    menus: import('vue').Ref<MenuItem[]>
    /** Trigger a re-fetch of dynamic menus and re-merge. */
    refreshMenus: () => Promise<void>
}
