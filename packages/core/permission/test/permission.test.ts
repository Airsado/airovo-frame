import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePermissionStore, type AuthSurface } from '../src/store'

function makeAuthSurface(overrides: Partial<AuthSurface> = {}): AuthSurface {
    return {
        userRoles: [],
        userPermissions: [],
        isLoggedIn: true,
        ...overrides,
    }
}

describe('@airovo/permission', () => {
    beforeEachReset()
    it('hasRole returns true for held roles and false otherwise', () => {
        setActivePinia(createPinia())
        const store = usePermissionStore()
        store.syncFromAuth(makeAuthSurface({ userRoles: ['admin', 'editor'] }))

        expect(store.hasRole('admin')).toBe(true)
        expect(store.hasRole('editor')).toBe(true)
        expect(store.hasRole('viewer')).toBe(false)
    })

    it('* wildcard grants all permissions', () => {
        setActivePinia(createPinia())
        const store = usePermissionStore()
        store.syncFromAuth(makeAuthSurface({ userPermissions: ['*'] }))

        expect(store.hasPermission('sys.user.read')).toBe(true)
        expect(store.hasPermission('anything.at.all')).toBe(true)
    })

    it('hasAccess is any-of for both roles and permissions', () => {
        setActivePinia(createPinia())
        const store = usePermissionStore()
        store.syncFromAuth(makeAuthSurface({
            userRoles: ['editor'],
            userPermissions: ['sys.post.read'],
        }))

        // matches role
        expect(store.hasAccess({ roles: ['admin', 'editor'] })).toBe(true)
        // matches permission
        expect(store.hasAccess({ permissions: ['sys.user.read', 'sys.post.read'] })).toBe(true)
        // matches neither
        expect(store.hasAccess({ roles: ['admin'], permissions: ['sys.user.read'] })).toBe(false)
        // no constraints → allowed
        expect(store.hasAccess({})).toBe(true)
        expect(store.hasAccess(null)).toBe(true)
    })
})

// vitest doesn't have a global beforeEach import here; use a tiny helper
function beforeEachReset() {
    // intentionally empty — we use setActivePinia in each test
}
