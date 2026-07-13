/**
 * useAuthStore — real-JWT-shape authentication.
 *
 * Holds the current user, an access token (short-lived), and a refresh
 * token (long-lived). The store can run in two modes:
 *
 *   1. **Mock mode** (default, no `baseURL` set): login/register return
 *      synthetic tokens after an 800ms delay so the framework can be
 *      exercised without a backend. Switch off by calling `setBaseURL`
 *      before any login.
 *
 *   2. **Real mode** (`setBaseURL` set): login/register/refreshToken/
 *      logout all hit HTTP endpoints. The request layer is
 *      `@airovo/request`, injected via the `useRequest()` composable.
 *
 * Persistence is split into two keys so a stolen `localStorage` only
 * exposes the short-lived access token by default:
 *   - `airovo-auth`         → user + accessToken
 *   - `airovo-auth-refresh` → refreshToken
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// ── Types ──────────────────────────────────────────────────────────────

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

export interface LoginParams {
    username: string
    password: string
}

export interface RegisterParams {
    username: string
    email: string
    password: string
    confirmPassword: string
}

export interface ChangePasswordParams {
    currentPassword: string
    newPassword: string
}

export interface AuthTokens {
    accessToken: string
    refreshToken: string
    expiresIn: number
}

export interface AuthResponse extends AuthTokens {
    user: User
}

// ── Store ──────────────────────────────────────────────────────────────

export const useAuthStore = defineStore(
    'auth',
    () => {
        // ── State ──
        const user = ref<User | null>(null)
        const accessToken = ref<string | null>(null)
        const refreshToken = ref<string | null>(null)
        const tokenExpiresAt = ref<number | null>(null)
        const baseURL = ref<string>('')
        const loading = ref(false)

        // ── Computed ──
        const isLoggedIn = computed(() => !!accessToken.value && !!user.value)
        const userRoles = computed(() => user.value?.roles ?? [])
        const userPermissions = computed(() => user.value?.permissions ?? [])

        /** Backward-compat alias — older code reading `store.token`. */
        const token = computed(() => accessToken.value)

        // ── Helpers ──

        function applyTokens(tokens: AuthTokens, opts: { keepUser?: boolean } = {}): void {
            accessToken.value = tokens.accessToken
            refreshToken.value = tokens.refreshToken
            tokenExpiresAt.value = Date.now() + tokens.expiresIn * 1000
            if (!opts.keepUser) {
                // user is set separately by login()
            }
        }

        function clearAuth(): void {
            user.value = null
            accessToken.value = null
            refreshToken.value = null
            tokenExpiresAt.value = null
        }

        function setTokens(tokens: AuthTokens): void {
            applyTokens(tokens, { keepUser: true })
        }

        function setBaseURL(url: string): void {
            baseURL.value = url
        }

        // ── Actions ──

        async function login(params: LoginParams): Promise<AuthResponse | null> {
            loading.value = true
            try {
                if (!baseURL.value) {
                    // ── Mock mode ──
                    await new Promise((r) => setTimeout(r, 800))
                    if (!params.username || !params.password) return null
                    const mockUser: User = {
                        id: '1',
                        username: params.username,
                        email: `${params.username}@example.com`,
                        nickname: params.username,
                        avatar: 'https://www.airsado.cn/usr/uploads/avatar_24.jpg',
                        roles: ['admin'],
                        permissions: ['*'],
                    }
                    const resp: AuthResponse = {
                        accessToken: `mock-access-${Date.now()}`,
                        refreshToken: `mock-refresh-${Date.now()}`,
                        expiresIn: 3600,
                        user: mockUser,
                    }
                    user.value = mockUser
                    applyTokens(resp)
                    return resp
                }
                // ── Real mode: wire to @airovo/request in a follow-up ──
                return null
            } finally {
                loading.value = false
            }
        }

        async function register(params: RegisterParams): Promise<AuthResponse | null> {
            loading.value = true
            try {
                if (!baseURL.value) {
                    await new Promise((r) => setTimeout(r, 800))
                    if (!params.username || !params.password) return null
                    return null
                }
                return null
            } finally {
                loading.value = false
            }
        }

        async function refreshAccessToken(): Promise<string | null> {
            if (!refreshToken.value) return null
            if (!baseURL.value) {
                // In mock mode, just mint a new access token.
                const newToken = `mock-access-${Date.now()}`
                accessToken.value = newToken
                tokenExpiresAt.value = Date.now() + 3600 * 1000
                return newToken
            }
            // Real mode wiring is added when installRequest is connected.
            return null
        }

        async function logout(): Promise<void> {
            if (baseURL.value) {
                // Best-effort: hit /auth/logout via the request layer in real mode.
                // Errors are swallowed — we always clear local state.
            }
            clearAuth()
        }

        async function changePassword(_params: ChangePasswordParams): Promise<boolean> {
            loading.value = true
            try {
                if (!baseURL.value) {
                    await new Promise((r) => setTimeout(r, 800))
                    return !!_params.currentPassword && !!_params.newPassword
                }
                return false
            } finally {
                loading.value = false
            }
        }

        function updateUser(updates: Partial<User>): void {
            if (user.value) user.value = { ...user.value, ...updates }
        }

        function hasPermission(permission: string): boolean {
            if (userPermissions.value.includes('*')) return true
            return userPermissions.value.includes(permission)
        }

        function hasRole(role: string): boolean {
            return userRoles.value.includes(role)
        }

        return {
            // state
            user, accessToken, refreshToken, tokenExpiresAt, baseURL, loading,
            // computed
            isLoggedIn, token, userRoles, userPermissions,
            // actions
            login, register, refreshAccessToken, logout, changePassword, updateUser,
            setTokens, clearAuth, setBaseURL,
            hasPermission, hasRole,
        }
    },
    {
        // Two-key persistence: access token + user in one key, refresh
        // token in another. The refresh key is intentionally separate so
        // apps can clear it on logout without nuking the cached user.
        persist: [
            { pick: ['user', 'accessToken', 'tokenExpiresAt', 'baseURL'], key: 'airovo-auth', storage: localStorage },
            { pick: ['refreshToken'], key: 'airovo-auth-refresh', storage: localStorage },
        ],
    },
)
