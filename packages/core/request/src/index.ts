/**
 * @airovo/request — unified HTTP client for airovo-frame.
 *
 * Provides a single axios instance wired with auth interceptors (Bearer
 * token + single-flight 401 refresh) and a small surface of error
 * normalization. Pairs with the `@airovo/stores` auth store and
 * installs once per app via `installRequest` in `createApp`.
 */
import { inject, type App } from 'vue'
import type { AxiosInstance } from 'axios'
import { createAxios } from './axios'
import { setupInterceptors } from './interceptor'
import { REQUEST_KEY } from './types'
import type { RequestOptions } from './types'

export { RequestError } from './error'
export type { AuthStoreShape, RequestOptions } from './types'
export { REQUEST_KEY } from './types'

/**
 * Install the request layer on a Vue app. Returns the axios instance
 * for direct use (e.g. in stores that want to bypass inject). Idempotent
 * — calling it twice replaces the previous install.
 */
export function installRequest(app: App, options: RequestOptions): AxiosInstance {
    const instance = createAxios(options)
    setupInterceptors(instance, options)
    app.provide(REQUEST_KEY, instance)
    return instance
}

/** Convenience: pull the axios instance from a component context. */
export function useRequest(): AxiosInstance {
    const instance = inject(REQUEST_KEY)
    if (!instance) {
        throw new Error(
            '[airovo/request] useRequest() called outside a createApp that ran installRequest().',
        )
    }
    return instance
}
