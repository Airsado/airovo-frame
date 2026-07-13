import type { App } from 'vue'
import type { AxiosInstance } from 'axios'

/**
 * The auth store shape that the request layer needs. This is the
 * minimum surface the request layer uses; it does NOT import the real
 * `@airovo/stores/auth` to avoid a runtime circular dependency.
 */
export interface AuthStoreShape {
    /** Current access token (or null if signed out). */
    getAccessToken: () => string | null
    /** Current refresh token (or null if signed out). */
    getRefreshToken: () => string | null
    /** Persist a fresh token pair. */
    setTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => void | Promise<void>
    /** Clear all auth state (e.g. after refresh failure). */
    clear: () => void | Promise<void>
}

/** Options accepted by `installRequest`. */
export interface RequestOptions {
    baseURL: string
    timeout?: number
    /** Accessor that returns the auth-store shape (used by interceptors). */
    useStore: () => AuthStoreShape
    /** Path for refreshing the access token. Defaults to `/auth/refresh`. */
    refreshTokenUrl?: string
    /** Path for logging out (called on refresh failure). Defaults to `/auth/logout`. */
    logoutUrl?: string
    /** Called when the user is bounced to /login after a refresh failure. */
    onUnauthorized?: () => void | Promise<void>
    /** Whether to log request/response info to the console. */
    debug?: boolean
}

/** Vue injection key — apps use `inject(REQUEST_KEY)` to get the instance. */
export const REQUEST_KEY = Symbol('airovoRequest') as InjectionKey<AxiosInstance>

import type { InjectionKey } from 'vue'
