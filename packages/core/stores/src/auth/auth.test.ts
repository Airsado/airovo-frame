import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './index'

const user = {
    id: '1', username: 'ada', email: 'ada@example.com',
    roles: ['admin'], permissions: ['reports.read'],
}

describe('useAuthStore session state', () => {
    beforeEach(() => {
        localStorage.clear()
        setActivePinia(createPinia())
    })

    it('keeps login data and token persistence without performing API calls', () => {
        const auth = useAuthStore()
        expect(auth.isLoggedIn).toBe(false)
        auth.setSession({ user, accessToken: 'access-1', refreshToken: 'refresh-1', expiresIn: 60 })

        expect(auth.isLoggedIn).toBe(true)
        expect(auth.userRoles).toEqual(['admin'])
        expect(auth.userPermissions).toEqual(['reports.read'])
        expect(localStorage.getItem('framework-auth-refresh')).toBe('refresh-1')

        auth.setTokens({ accessToken: 'access-2', refreshToken: 'refresh-2' })
        expect(auth.accessToken).toBe('access-2')
        expect(localStorage.getItem('framework-auth-refresh')).toBe('refresh-2')

        auth.clearSession()
        expect(auth.isLoggedIn).toBe(false)
        expect(auth.user).toBeNull()
        expect(localStorage.getItem('framework-auth-refresh')).toBeNull()
    })

    it('clears the expired-session state after reauthentication', () => {
        const auth = useAuthStore()
        auth.markSessionExpired('/reports')
        expect(auth.sessionExpiredRedirect).toBe('/reports')
        auth.setSession({ user, accessToken: 'new-access', refreshToken: 'new-refresh' })
        expect(auth.sessionExpired).toBe(false)
        auth.markSessionExpired('/reports')
        auth.completeReauthentication()
        expect(auth.sessionExpired).toBe(false)
    })

    it('treats an explicit null refresh token as a session reset', () => {
        const auth = useAuthStore()
        auth.setSession({ user, accessToken: 'access-1', refreshToken: 'refresh-1' })
        auth.setSession({ user, accessToken: 'access-2', refreshToken: null })

        expect(auth.refreshToken).toBeNull()
        expect(localStorage.getItem('framework-auth-refresh')).toBeNull()
    })
})
