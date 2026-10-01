/**
 * usePermissionStore — standard RBAC checks.
 *
 * Reads roles + permissions from the auth store (via the function
 * passed to `installPermission`). Supports the `*` wildcard for
 * super-admins.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

/** Minimum surface the store reads from the auth store. */
export interface AuthSurface {
    userRoles: string[]
    userPermissions: string[]
    isLoggedIn: boolean
}

export interface PermissionStoreOptions {
    /** Accessor returning the auth store's reactive surface. */
    getAuth: () => AuthSurface
}

/** The permission store's public action surface (exported for typed access). */
export interface PermissionStoreActions {
    hasRole(role: string): boolean
    hasPermission(permission: string): boolean
    hasAccess(meta: { roles?: string[]; permissions?: string[]; requiresAuth?: boolean } | undefined | null): boolean
    canAccessRoute(to: RouteLocationNormalized): boolean
}

export const usePermissionStore = defineStore(
    'permission',
    () => {
        // We mirror the auth surface as refs so the store has
        // independent reactive tracking (avoids tight coupling to
        // the auth store internals).
        const roles = ref<string[]>([])
        const permissions = ref<string[]>([])
        const isLoggedIn = ref(false)
        const isSuper = computed(() => permissions.value.includes('*'))

        function syncFromAuth(auth: AuthSurface) {
            roles.value = [...auth.userRoles]
            permissions.value = [...auth.userPermissions]
            isLoggedIn.value = auth.isLoggedIn
        }

        function hasRole(role: string): boolean {
            return isSuper.value || roles.value.includes(role)
        }

        function hasPermission(permission: string): boolean {
            return isSuper.value || permissions.value.includes(permission)
        }

        function hasAccess(meta: {
            roles?: string[]
            permissions?: string[]
            requiresAuth?: boolean
        } | undefined | null): boolean {
            if (!meta) return true
            if (meta.requiresAuth && !isLoggedIn.value) return false
            if (meta.roles?.length && !meta.roles.some(hasRole)) return false
            if (meta.permissions?.length && !meta.permissions.some(hasPermission)) return false
            return true
        }

        function canAccessRoute(to: RouteLocationNormalized): boolean {
            // `to.meta` is a shallow merge in vue-router: a child record can
            // overwrite the parent's roles/permissions there. Check every
            // matched record so a restricted parent cannot be bypassed by a
            // permissive child route.
            const metas = to.matched?.length
                ? to.matched.map((record) => record.meta)
                : [to.meta]
            return metas.every((rawMeta) => {
                const meta = rawMeta as { public?: boolean; requiresAuth?: boolean } & {
                    roles?: string[]
                    permissions?: string[]
                }
                // Public is a per-record escape hatch. A public parent does
                // not make restricted child records public because the child
                // is checked in the same `every` pass.
                if (meta.public) return true
                return hasAccess(meta)
            })
        }

        return {
            roles, permissions, isSuper, isLoggedIn,
            syncFromAuth,
            hasRole, hasPermission, hasAccess, canAccessRoute,
        }
    },
)
