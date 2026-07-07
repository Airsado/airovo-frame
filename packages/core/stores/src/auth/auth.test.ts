import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './index'

describe('useAuthStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('starts logged-out', () => {
        const store = useAuthStore()
        expect(store.isLoggedIn).toBe(false)
        expect(store.user).toBeNull()
        expect(store.token).toBeNull()
    })

    it('logs in with valid credentials', async () => {
        const store = useAuthStore()
        const success = await store.login({ username: 'admin', password: '123456' })
        expect(success).toBe(true)
        expect(store.isLoggedIn).toBe(true)
        expect(store.user?.username).toBe('admin')
        expect(store.token).toBeTruthy()
    })

    it('rejects empty credentials', async () => {
        const store = useAuthStore()
        const ok1 = await store.login({ username: '', password: '' })
        expect(ok1).toBe(false)

        const ok2 = await store.login({ username: 'admin', password: '' })
        expect(ok2).toBe(false)
    })

    it('logs out', async () => {
        const store = useAuthStore()
        await store.login({ username: 'admin', password: '123456' })
        expect(store.isLoggedIn).toBe(true)

        store.logout()
        expect(store.isLoggedIn).toBe(false)
        expect(store.user).toBeNull()
        expect(store.token).toBeNull()
    })

    it('updates user info', async () => {
        const store = useAuthStore()
        await store.login({ username: 'admin', password: '123456' })

        store.updateUser({ email: 'new@example.com' })
        expect(store.user?.email).toBe('new@example.com')
        expect(store.user?.username).toBe('admin') // unchanged
    })

    it('checks permissions and roles', async () => {
        const store = useAuthStore()
        await store.login({ username: 'admin', password: '123456' })

        // Mock user has '*' permission and 'admin' role
        expect(store.hasPermission('*')).toBe(true)
        expect(store.hasRole('admin')).toBe(true)
        expect(store.hasRole('user')).toBe(false)
    })
})
