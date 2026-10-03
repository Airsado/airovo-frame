import type { InternalAxiosRequestConfig } from 'axios'

/**
 * RequestError — normalized error type for the request layer.
 *
 * Carries the HTTP status, the (optional) backend error code, and a
 * human-readable message. Apps can `instanceof` to detect network /
 * HTTP failures uniformly.
 */
export class RequestError extends Error {
    public readonly code?: string
    public readonly httpStatus?: number
    public readonly data?: unknown
    public readonly config?: InternalAxiosRequestConfig
    public readonly cause?: unknown

    constructor(
        message: string,
        opts: {
            code?: string
            httpStatus?: number
            data?: unknown
            config?: InternalAxiosRequestConfig
            cause?: unknown
        } = {},
    ) {
        super(message)
        this.name = 'RequestError'
        this.code = opts.code
        this.httpStatus = opts.httpStatus
        this.data = opts.data
        this.config = opts.config
        this.cause = opts.cause
        // Restore prototype chain for `instanceof` across realms.
        Object.setPrototypeOf(this, RequestError.prototype)
    }
}

export interface RequestErrorDetails {
    message: string
    code?: string
    httpStatus?: number
    data?: unknown
}

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function normalizeCode(value: unknown): string | undefined {
    if (typeof value === 'string') {
        return value.length > 0 ? value : undefined
    }
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    return undefined
}

/**
 * Extract the useful part of an Axios/Nitro error without coupling callers to
 * Axios' error shape. Nitro includes `message`, `statusMessage` and `data` in
 * its JSON error envelope; custom APIs often use `code` or `errorCode`.
 */
export function getRequestErrorDetails(error: unknown): RequestErrorDetails {
    const record = asRecord(error)
    const response = asRecord(record.response)
    const responseData = response.data ?? record.data
    const payload = asRecord(responseData)
    // H3/Nitro serializes `createError({ data: { ... } })` under a nested
    // `data` member. Keep both the top-level envelope and its application
    // payload available because different adapters flatten this response.
    const nestedData = asRecord(payload.data)
    const nestedError = asRecord(payload.error)
    const statusValue = record.httpStatus
        ?? response.status
        ?? record.status
        ?? record.statusCode
        ?? payload.statusCode
        ?? nestedData.statusCode
        ?? nestedError.statusCode
        ?? nestedError.status
    const httpStatus = typeof statusValue === 'number'
        ? statusValue
        : typeof statusValue === 'string' && /^\d+$/.test(statusValue) ? Number(statusValue) : undefined
    const codeValue = payload.code
        ?? payload.errorCode
        ?? nestedData.code
        ?? nestedData.errorCode
        ?? nestedError.code
        ?? nestedError.errorCode
    const code = normalizeCode(codeValue)
        ?? (typeof record.code === 'string' && !record.code.startsWith('ERR_') ? record.code : undefined)
        ?? normalizeCode(typeof record.code === 'number' ? record.code : undefined)
    const message = [
        payload.message,
        payload.msg,
        nestedData.message,
        nestedData.msg,
        payload.statusMessage,
        nestedData.statusMessage,
        nestedError.message,
        nestedError.msg,
        record.statusMessage,
        record.message,
        record.msg,
    ].find((value): value is string => typeof value === 'string' && value.trim().length > 0)
        ?? (httpStatus ? `Request failed with status ${httpStatus}` : 'Request failed')

    return {
        message,
        code,
        httpStatus,
        data: responseData,
    }
}
