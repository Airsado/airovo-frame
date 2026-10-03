import type { InternalAxiosRequestConfig } from 'axios'

export interface AppRetryConfig extends InternalAxiosRequestConfig {
    __skipAuth?: boolean
    __retried?: boolean
    __authToken?: string | null
}

export interface AuthRetryFailure {
    httpStatus?: number
    config?: AppRetryConfig
    cause?: { config?: AppRetryConfig; response?: { status?: number } }
    response?: { status?: number }
}

export interface AuthRetrySession {
    accessToken: string | null
    refreshToken: string | null
}

export interface AuthRetryOptions {
    getSession: () => AuthRetrySession
    refresh: (refreshToken: string) => Promise<string | null>
    expireSession: () => Promise<void> | void
    retry: (config: AppRetryConfig) => Promise<unknown>
}

function asFailure(error: unknown): AuthRetryFailure {
    return error && typeof error === 'object' ? error as AuthRetryFailure : {}
}

/**
 * Create the application-owned 401 handler. The framework normalizes the
 * original Axios failure first; this handler only owns refresh policy and can
 * therefore be tested without bootstrapping Vue, Pinia, or the router.
 */
export function createAuthRetryHandler(options: AuthRetryOptions): (error: unknown) => Promise<unknown> {
    let refreshing: Promise<string | null> | null = null

    return async (error: unknown): Promise<unknown> => {
        const failure = asFailure(error)
        const config = failure.config ?? failure.cause?.config
        const status = failure.httpStatus ?? failure.response?.status ?? failure.cause?.response?.status
        if (status !== 401 || !config || config.__skipAuth) throw error

        const session = options.getSession()
        if (config.__retried) {
            if (session.accessToken || session.refreshToken) await options.expireSession()
            throw error
        }

        config.__retried = true
        if (session.accessToken && session.accessToken !== config.__authToken) {
            return options.retry(config)
        }
        if (!session.refreshToken) {
            if (session.accessToken) await options.expireSession()
            throw error
        }

        const priorRefreshToken = session.refreshToken
        if (!refreshing) {
            refreshing = options.refresh(priorRefreshToken)
                .catch(async () => {
                    const current = options.getSession()
                    if (current.refreshToken === priorRefreshToken) await options.expireSession()
                    return null
                })
                .finally(() => { refreshing = null })
        }
        const token = await refreshing
        if (!token) throw error
        return options.retry(config)
    }
}
