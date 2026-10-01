import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getRequestErrorDetails, RequestError } from './error'
import type { RequestOptions } from './types'

declare module 'axios' {
    export interface AxiosRequestConfig {
        /** Auth endpoints do not receive an access token. */
        __skipAuth?: boolean
    }
    export interface InternalAxiosRequestConfig {
        /** Application-owned retry marker. */
        __retried?: boolean
        /** Auth endpoints do not receive an access token. */
        __skipAuth?: boolean
        /** Token applied on the request, available to application interceptors. */
        __authToken?: string | null
    }
}

async function getAccessToken(
    opts: RequestOptions,
    config: InternalAxiosRequestConfig,
): Promise<string | null> {
    const store = opts.useStore()
    return opts.hooks?.getAccessToken
        ? opts.hooks.getAccessToken(store, config)
        : store.getAccessToken()
}


export function setupInterceptors(instance: AxiosInstance, opts: RequestOptions): void {
    instance.interceptors.request.use(async (config) => {
        let token: string | null = null
        if (!config.__skipAuth) {
            token = await getAccessToken(opts, config)
            if (opts.hooks?.setAuthHeader) {
                config = await opts.hooks.setAuthHeader(config, token) ?? config
            } else if (token) {
                config.headers.set('Authorization', `Bearer ${token}`)
            }
        }
        config = await opts.hooks?.onRequest?.(config) ?? config
        if (!config.__skipAuth) config.__authToken = token
        if (opts.debug) {
            // eslint-disable-next-line no-console
            console.debug(`[request] ${config.method?.toUpperCase()} ${config.url}`)
        }
        return config
    })

    instance.interceptors.response.use(
        async (response) => {
            try {
                if (opts.debug) {
                    // eslint-disable-next-line no-console
                    console.debug(`[request] ← ${response.status} ${response.config.url}`)
                }
                return await opts.hooks?.onResponse?.(response) ?? response
            } catch (error) {
                const requestError = toRequestError(error, undefined, response.config as InternalAxiosRequestConfig)
                await notifyError(opts, requestError, response.config as InternalAxiosRequestConfig, error)
                throw requestError
            }
        },
        async (error) => {
            const status: number | undefined = error.response?.status
            const original = error.config as InternalAxiosRequestConfig | undefined

            const requestError = toRequestError(error, status, original)
            await notifyError(opts, requestError, original, error)
            throw requestError
        },
    )
}

async function notifyError(
    opts: RequestOptions,
    error: RequestError,
    config: InternalAxiosRequestConfig | undefined,
    originalError: unknown,
): Promise<void> {
    const context = {
        error,
        originalError,
        message: error.message,
        code: error.code,
        httpStatus: error.httpStatus,
        data: error.data,
        config,
    }
    let shouldNotify = true
    try {
        shouldNotify = await opts.hooks?.onError?.(context) !== false
    } catch {
        // Error reporting must never replace the original request failure.
    }
    if (!shouldNotify) return
    try {
        await opts.errorHandler?.(context)
    } catch {
        // Error reporting must never replace the original request failure.
    }
}

function toRequestError(error: unknown, status?: number, config?: InternalAxiosRequestConfig): RequestError {
    if (error instanceof RequestError) return error
    const details = getRequestErrorDetails(error)
    return new RequestError(details.message, {
        code: details.code,
        httpStatus: status ?? details.httpStatus,
        data: details.data,
        config,
        cause: error,
    })
}
