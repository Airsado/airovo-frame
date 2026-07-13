/**
 * Sidebar menu filter — drops menu items the current user cannot
 * access. Plugged into the router's `deriveMenusFromRoutes` via the
 * `permissionFilter` option (added by `installPermission`).
 */
import type { PermissionStoreActions } from './store'

export function permissionFilter(perm: Pick<PermissionStoreActions, 'hasAccess'>): (meta: unknown) => boolean {
    return (meta: unknown) => {
        if (!meta) return true
        return perm.hasAccess(meta as { roles?: string[]; permissions?: string[] })
    }
}
