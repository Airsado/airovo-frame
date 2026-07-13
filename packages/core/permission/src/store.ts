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
    hasAccess(meta: { roles?: string[]; permissions?: string[] } | undefined | null): boolean
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
        const isSuper = computed(() => permissions.value.includes('*'))

        function syncFromAuth(auth: AuthSurface) {
            roles.value = [...auth.userRoles]
            permissions.value = [...auth.userPermissions]
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
        } | undefined | null): boolean {
            if (!meta) return true
            if (meta.roles?.length && !meta.roles.some(hasRole)) return false
            if (meta.permissions?.length && !meta.permissions.some(hasPermission)) return false
            return true
        }

        function canAccessRoute(to: RouteLocationNormalized): boolean {
            const m = to.meta as { public?: boolean; requiresAuth?: boolean } & {
                roles?: string[]
                permissions?: string[]
            }
            if (m.public) return true
            if (!m.requiresAuth && !m.roles?.length && !m.permissions?.length) return true
            return hasAccess(m)
        }

        return {
            roles, permissions, isSuper,
            syncFromAuth,
            hasRole, hasPermission, hasAccess, canAccessRoute,
        }
    },
)
