/**
 * Interceptor — request + response + single-flight refresh queue.
 *
 * The refresh queue lives at module scope so it's shared across every
 * import of this module. Concurrent 401s from any axios instance reuse
 * the same refresh Promise (single-flight) and replay their original
 * request with the new token.
 */
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { RequestError } from './error'
import type { RequestOptions } from './types'

let inFlightRefresh: Promise<string | null> | null = null

declare module 'axios' {
    export interface InternalAxiosRequestConfig {
        /** Marks a request that has already been retried after a refresh. */
        __retried?: boolean
    }
}

async function performRefresh(
    instance: AxiosInstance,
    opts: RequestOptions,
): Promise<string | null> {
    if (inFlightRefresh) return inFlightRefresh

    const store = opts.useStore()
    const refreshToken = store.getRefreshToken()
    if (!refreshToken) {
        await Promise.resolve(opts.onUnauthorized?.())
        return null
    }

    inFlightRefresh = (async () => {
        try {
            // Bypass interceptors to avoid recursion; use a fresh request.
            const response = await instance.post(
                opts.refreshTokenUrl ?? '/auth/refresh',
                { refreshToken },
                { __skipAuth: true } as any,
            )
            const data = response.data as {
                accessToken: string
                refreshToken: string
                expiresIn: number
            }
            await store.setTokens(data)
            return data.accessToken
        } catch {
            await store.clear()
            await opts.onUnauthorized?.()
            return null
        } finally {
            inFlightRefresh = null
        }
    })()

    return inFlightRefresh
}

/** Install request + response interceptors on the given axios instance. */
export function setupInterceptors(instance: AxiosInstance, opts: RequestOptions): void {
    // ── Request: attach Bearer token (unless opted out) ──
    instance.interceptors.request.use((config) => {
        // Allow a request to bypass auth (e.g. the refresh call itself)
        const skipAuth = (config as any).__skipAuth === true
        if (!skipAuth) {
            const token = opts.useStore().getAccessToken()
            if (token) {
                config.headers.set('Authorization', `Bearer ${token}`)
            }
        }
        if (opts.debug) {
            // eslint-disable-next-line no-console
            console.debug(`[request] ${config.method?.toUpperCase()} ${config.url}`)
        }
        return config
    })

    // ── Response: normalize errors + 401 → single-flight refresh + retry ──
    instance.interceptors.response.use(
        (response) => {
            if (opts.debug) {
                // eslint-disable-next-line no-console
                console.debug(`[request] ← ${response.status} ${response.config.url}`)
            }
            return response
        },
        async (error) => {
            const status: number | undefined = error.response?.status
            const original = error.config as InternalAxiosRequestConfig | undefined

            if (status === 401 && original && !original.__retried) {
                original.__retried = true
                const newToken = await performRefresh(instance, opts)
                if (newToken) {
                    original.headers.set('Authorization', `Bearer ${newToken}`)
                    return instance(original)
                }
                // Refresh failed — fall through to throw the normalized error.
            }

            const message =
                (error.response?.data as { message?: string } | undefined)?.message
                ?? error.message
                ?? 'Request failed'

            throw new RequestError(message, {
                code: error.code,
                httpStatus: status,
                data: error.response?.data,
            })
        },
    )
}
