import type { App } from 'vue'
import type { AxiosInstance } from 'axios'
import { createAxios } from './axios'
import { setupInterceptors } from './interceptor'
import { REQUEST_KEY, type RequestOptions } from './types'

/** Framework-only request installation. Applications configure the client through registerRequestSetup. */
export function installRequest(app: App, options: RequestOptions): AxiosInstance {
    const instance = createAxios(options)
    setupInterceptors(instance, options)
    app.provide(REQUEST_KEY, instance)
    return instance
}
