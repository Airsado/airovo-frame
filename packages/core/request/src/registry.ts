import type { AxiosInstance } from 'axios'
import type { RequestErrorHandler, RequestHooks } from './types'

export interface RequestSetupContext {
    client: AxiosInstance
}

export interface RequestRegistration {
    baseURL?: string
    timeout?: number
    debug?: boolean
    hooks?: RequestHooks
    errorHandler?: RequestErrorHandler
    setup?: (context: RequestSetupContext) => void | Promise<void>
}

type RestoreSessionHandler = () => void | Promise<void>

let requestRegistration: RequestRegistration | null = null
let restoreSessionHandler: RestoreSessionHandler | null = null
let activeRequestClient: AxiosInstance | null = null

/** Register application transport policy before createApp() is called. */
export function registerRequestSetup(value: RequestRegistration): void {
    requestRegistration = value
}

export function getRequestRegistration(): RequestRegistration | null {
    return requestRegistration
}

/** Register the application-owned refresh + user restoration workflow. */
export function registerSessionRestore(handler: RestoreSessionHandler): void {
    restoreSessionHandler = handler
}

export function getSessionRestore(): RestoreSessionHandler | null {
    return restoreSessionHandler
}

export function setRequestClient(client: AxiosInstance | null): void {
    activeRequestClient = client
}

/** Use from app API modules. It becomes available during createApp startup. */
export function getRequestClient(): AxiosInstance {
    if (!activeRequestClient) {
        throw new Error('[framework/request] request client is not ready; call createApp() before using app APIs')
    }
    return activeRequestClient
}

/** Test/HMR reset hook. */
export function resetRequestRegistration(): void {
    requestRegistration = null
    restoreSessionHandler = null
    activeRequestClient = null
}
