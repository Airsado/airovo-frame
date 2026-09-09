/**
 * @airovo/permission — standard RBAC for airovo-frame.
 *
 * Provides:
 *   - \`usePermissionStore\`         — hasRole / hasPermission / hasAccess
 *   - \`v-permission\` directive     — hide elements the user can't use
 *   - \`installPermission(app, { getAuth, onDenyRoute })\`
 *   - \`permissionFilter\` helper     — drop menu items the user can't see
 *
 * Depends on \`@airovo/stores\` for the auth surface and
 * \`@airovo/uikit-shadcnui\` for nothing (kept for symmetry; remove
 * if a circular dep surfaces).
 */
import type { App } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { AirovoRouter } from '@airovo/router'
import { usePermissionStore, type AuthSurface } from './store'
import { registerVPermission } from './directive'
import { permissionFilter } from './menu-filter'
import type { RouteMeta } from './types'

export { usePermissionStore } from './store'
export type { AuthSurface } from './store'
export { registerVPermission } from './directive'
export { permissionFilter } from './menu-filter'
export type { RouteMeta }

export interface InstallPermissionOptions {
    /** Accessor returning the current auth surface (roles, permissions, isLoggedIn). */
    getAuth: () => AuthSurface
    /** Framework router — uses `setPermissionFilter` for menu filtering + `beforeEach` for guards. */
    router: AirovoRouter
    /**
     * Where to send users when they hit a route they don't have access
     * to. Default: the route named 'Forbidden' (apps should register it).
     * Set to a string path or { name, query } for custom handling.
     */
    onDeny?: RouteLocationRaw
    /**
     * If true, the router's built-in auth guard will also enforce
     * role/permission meta on every navigation. Default: true.
     */
    guardRoutes?: boolean
}

/**
 * Install the permission layer. Wires up:
 *   1. \`v-permission\` directive
 *   2. A route filter that drops inaccessible menu items
 *      (installed via \`router.setPermissionFilter\` so the
 *      \`menus\` computed re-evaluates when login/logout flips roles)
 *   3. (Optional) a beforeEach guard that redirects on deny
 */
export function installPermission(app: App, options: InstallPermissionOptions): void {
    const store = usePermissionStore()

    // Mirror the auth surface into the store so it has independent reactivity.
    const sync = () => store.syncFromAuth(options.getAuth())
    sync()
    // Re-sync on every navigation via the underlying vue-router.
    options.router.router.afterEach(() => sync())

    // 1. Directive
    registerVPermission(app)

    // 2. Menu filter — actually inject the filter into the router so
    //    RBAC-driven menu filtering works. Before this assignment the
    //    filter was a no-op (the previous code reassigned router.menus
    //    to itself, which doesn't re-trigger the computed).
    options.router.setPermissionFilter(
        permissionFilter({ hasAccess: (meta) => store.hasAccess(meta as any) }),
    )

    // 3. Route guard (uses the underlying vue-router)
    if (options.guardRoutes !== false) {
        options.router.router.beforeEach((to) => {
            const meta = to.meta as RouteMeta
            if (meta.public) return true
            if (!meta.roles?.length && !meta.permissions?.length) return true
            if (store.hasAccess(meta)) return true
            return options.onDeny ?? { name: 'Forbidden' }
        })
    }
}
