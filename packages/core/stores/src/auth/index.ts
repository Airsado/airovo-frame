import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const REFRESH_TOKEN_KEY = 'framework-auth-refresh'

function readRefreshToken(): string | null {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(REFRESH_TOKEN_KEY)
}

function persistRefreshToken(token: string | null): void {
    if (typeof localStorage === 'undefined') return
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token)
    else localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export interface User {
    id: string
    username: string
    email: string
    nickname?: string
    avatar?: string
    roles: string[]
    permissions: string[]
    createdAt?: number
}

export interface AuthTokens {
    accessToken: string
    refreshToken?: string | null
    expiresIn?: number
}

export interface AuthSession extends AuthTokens {
    user: User
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(readRefreshToken())
    const tokenExpiresAt = ref<number | null>(null)
    const sessionExpired = ref(false)
    const sessionExpiredRedirect = ref<string | null>(null)

    const isLoggedIn = computed(() => Boolean(accessToken.value && user.value))
    const userRoles = computed(() => user.value?.roles ?? [])
    const userPermissions = computed(() => user.value?.permissions ?? [])

    function setSession(session: AuthSession): void {
        user.value = session.user
        accessToken.value = session.accessToken
        // An omitted refresh token means the caller intentionally keeps the
        // current refresh flow (for example an access-token-only response),
        // while an explicit null clears the previous session token.
        if (session.refreshToken !== undefined) refreshToken.value = session.refreshToken
        persistRefreshToken(refreshToken.value)
        tokenExpiresAt.value = Date.now() + (session.expiresIn ?? 3600) * 1000
        completeReauthentication()
    }

    function setTokens(tokens: AuthTokens): void {
        accessToken.value = tokens.accessToken
        if (tokens.refreshToken !== undefined) refreshToken.value = tokens.refreshToken
        persistRefreshToken(refreshToken.value)
        tokenExpiresAt.value = Date.now() + (tokens.expiresIn ?? 3600) * 1000
    }

    function setUser(value: User | null): void { user.value = value }

    function clearSession(): void {
        user.value = null
        accessToken.value = null
        refreshToken.value = null
        tokenExpiresAt.value = null
        persistRefreshToken(null)
    }

    function markSessionExpired(redirect?: string): void {
        sessionExpired.value = true
        sessionExpiredRedirect.value = redirect ?? null
    }

    function clearSessionExpired(): void {
        sessionExpired.value = false
        sessionExpiredRedirect.value = null
    }

    function completeReauthentication(): void {
        clearSessionExpired()
    }

    return {
        user,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        sessionExpired,
        sessionExpiredRedirect,
        isLoggedIn,
        userRoles,
        userPermissions,
        setSession,
        setTokens,
        setUser,
        clearSession,
        markSessionExpired,
        clearSessionExpired,
        completeReauthentication,
    }
})
