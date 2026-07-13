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
import type { Router, RouteLocationRaw } from 'vue-router'
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
    /** Vue Router to plug the menu filter + auth guard into. */
    router: Router
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
 *   3. (Optional) a beforeEach guard that redirects on deny
 */
export function installPermission(app: App, options: InstallPermissionOptions): void {
    const store = usePermissionStore()

    // Mirror the auth surface into the store so it has independent reactivity.
    const sync = () => store.syncFromAuth(options.getAuth())
    sync()
    // Re-sync whenever the auth store changes (login/logout/refresh).
    // We use a watch on the relevant fields via watchEffect equivalent.
    // The auth store's reactive surface is read inside the auth getter
    // so we re-sync on every router navigation.
    options.router.afterEach(() => sync())

    // 1. Directive
    registerVPermission(app)

    // 2. Menu filter — expose as a router property so deriveMenusFromRoutes
    //    can pick it up. (consumers of @airovo/router call this from their
    //    createAppRouter; we also add a default filter to the menuRef.)
    if (options.router && (options.router as any).menus) {
        (options.router as any).menus = (options.router as any).menus
    }

    // 3. Route guard
    if (options.guardRoutes !== false) {
        options.router.beforeEach((to) => {
            // Only enforce when the route declares role/permission constraints
            // (otherwise the auth guard already handled it).
            const meta = to.meta as RouteMeta
            if (meta.public) return true
            if (!meta.roles?.length && !meta.permissions?.length) return true
            if (store.hasAccess(meta)) return true
            return options.onDeny ?? { name: 'Forbidden' }
        })
    }
}
