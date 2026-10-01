import { getAppRouter, registerRequestSetup, registerSessionRestore } from '@airovo/app'
import { toast } from '@airovo/composables'
import { useAuthStore } from '@airovo/stores/auth'
import { useI18nStore } from '@airovo/stores/i18n'
import { usePreferencesStore } from '@airovo/stores/preferences'
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { refreshSession, restoreSession } from '../auth/handlers'
import zh from '../locales/zh-CN/auth.json'
import en from '../locales/en-US/auth.json'
import { appEnv } from '../config/env'

export type AppRequestClient = ReturnType<typeof import('@airovo/app').getRequestClient>

interface RetriableConfig extends InternalAxiosRequestConfig {
    __skipAuth?: boolean
    __retried?: boolean
    __authToken?: string | null
}

interface RequestFailure extends Error {
    httpStatus?: number
    config?: RetriableConfig
    cause?: AxiosError
}

const baseURL = appEnv.apiBase

function requestErrorMessage(status?: number): string {
    const copy = (useI18nStore().locale === 'en-US' ? en : zh).errors
    if (status === 403) return copy.forbidden
    if (status === 404) return copy.notFound
    if (status && status >= 500) return copy.server
    if (!status) return copy.network
    return copy.request
}

function unwrapResponse(response: AxiosResponse): AxiosResponse {
    const payload = response.data
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return response
    const record = payload as Record<string, unknown>
    const hasEnvelope = 'data' in record && ('code' in record || 'success' in record || 'status' in record)
    if (hasEnvelope) response.data = record.data
    return response
}

async function expireSession(): Promise<void> {
    const auth = useAuthStore()
    auth.clearSession()
    const router = getAppRouter()
    const redirect = router.currentRoute.value.fullPath
    auth.markSessionExpired(redirect)
    if (usePreferencesStore().preferences.auth?.loginExpiredMode === 'page') {
        await router.push({ path: '/login', query: { redirect } })
    }
}

function installAppInterceptors(client: AxiosInstance): void {
    let refreshing: Promise<string | null> | null = null

    client.interceptors.request.use((config) => {
        config.headers.set('X-Request-Source', appEnv.appName)
        config.headers.set('Accept-Language', document.documentElement.lang || 'zh-CN')
        return config
    })

    client.interceptors.response.use(undefined, async (error: RequestFailure) => {
        const config = error.config ?? error.cause?.config as RetriableConfig | undefined
        const status = error.httpStatus ?? error.cause?.response?.status
        if (status !== 401 || !config || config.__skipAuth) throw error
        if (config.__retried) {
            if (useAuthStore().refreshToken) await expireSession()
            throw error
        }

        config.__retried = true
        const auth = useAuthStore()
        if (auth.accessToken && auth.accessToken !== config.__authToken) return client(config)
        if (!auth.refreshToken) {
            if (auth.accessToken) await expireSession()
            throw error
        }

        // All requests failing with the same access token share one refresh.
        if (!refreshing) {
            const priorRefreshToken = auth.refreshToken
            refreshing = refreshSession(priorRefreshToken)
                .catch(async () => {
                    if (auth.refreshToken === priorRefreshToken) await expireSession()
                    return null
                })
                .finally(() => { refreshing = null })
        }
        const token = await refreshing
        if (!token) throw error
        return client(config)
    })
}

registerRequestSetup({
    baseURL,
    hooks: {
        onResponse: unwrapResponse,
        onError(context) {
            const config = context.config as RetriableConfig | undefined
            // Auth views own their messages; 401 may still be recovered by the app interceptor.
            if (config?.__skipAuth || context.httpStatus === 401) return false
            toast.error(requestErrorMessage(context.httpStatus))
            return false
        },
    },
    setup({ client }) { installAppInterceptors(client) },
})

registerSessionRestore(restoreSession)
