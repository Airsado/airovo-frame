import axios, { type AxiosInstance } from 'axios'
import type { RequestOptions } from './types'

/**
 * Create a new axios instance with the framework-defaults. Callers
 * typically don't use this directly — `installRequest` wraps it with
 * access-token injection and error normalization.
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
