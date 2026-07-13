import axios, { type AxiosInstance } from 'axios'
import type { RequestOptions } from './types'

/**
 * Create a new axios instance with the framework-defaults. Callers
 * typically don't use this directly — `installRequest` wraps it with
 * the auth interceptors. Exposed for advanced use (e.g. parallel
 * request layers, mock servers).
 */
export function createAxios(opts: Pick<RequestOptions, 'baseURL' | 'timeout'>): AxiosInstance {
    return axios.create({
        baseURL: opts.baseURL,
        timeout: opts.timeout ?? 15000,
        headers: {
            'Content-Type': 'application/json',
        },
    })
}
