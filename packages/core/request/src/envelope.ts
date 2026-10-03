import type { AxiosResponse } from 'axios'

export type ResponseEnvelopeCode = string | number | boolean

export interface ResponseEnvelopeOptions {
    /** Keys that identify an application status/code. */
    codeKeys?: readonly string[]
    /** Keys that carry an explicit boolean success flag. */
    successKeys?: readonly string[]
    /** Keys that carry the response payload. */
    dataKeys?: readonly string[]
    /** Message aliases used by the backend. */
    messageKeys?: readonly string[]
    /** Codes considered successful by the application protocol. */
    successCodes?: readonly ResponseEnvelopeCode[]
}

export interface ResponseEnvelopeDetails<T = unknown> {
    isEnvelope: boolean
    data: T
    code?: ResponseEnvelopeCode
    success?: boolean
    message?: string
    raw: unknown
}

const DEFAULT_OPTIONS: Required<ResponseEnvelopeOptions> = {
    codeKeys: ['code'],
    successKeys: ['success'],
    dataKeys: ['data'],
    messageKeys: ['message', 'msg', 'statusMessage'],
    successCodes: [],
}

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {}
}

function firstValue(records: Record<string, unknown>[], keys: readonly string[]): unknown {
    for (const record of records) {
        for (const key of keys) {
            if (record[key] !== undefined && record[key] !== null) return record[key]
        }
    }
    return undefined
}

function isCode(value: unknown): value is ResponseEnvelopeCode {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function firstMessage(records: Record<string, unknown>[], keys: readonly string[]): string | undefined {
    const value = firstValue(records, keys)
    return typeof value === 'string' && value.trim() ? value : undefined
}

function sameCode(left: ResponseEnvelopeCode, right: ResponseEnvelopeCode): boolean {
    return String(left) === String(right)
}

/**
 * Read a backend response envelope without imposing a universal success code.
 * Applications choose their protocol with `successCodes` and decide whether
 * an unsuccessful envelope should become a RequestError.
 */
export function getResponseEnvelopeDetails<T = unknown>(
    value: unknown,
    options: ResponseEnvelopeOptions = {},
): ResponseEnvelopeDetails<T> {
    const config = { ...DEFAULT_OPTIONS, ...options }
    return readResponseEnvelope<T>(value, config, 0)
}

function readResponseEnvelope<T>(
    value: unknown,
    config: Required<ResponseEnvelopeOptions>,
    depth: number,
): ResponseEnvelopeDetails<T> {
    const payload = asRecord(value)
    const nestedData = asRecord(payload.data)
    const nestedError = asRecord(payload.error)
    const directRecords = [payload, nestedError]
    const codeValue = firstValue(directRecords, config.codeKeys)
    const successValue = firstValue(directRecords, config.successKeys)
    const dataValue = firstValue([payload], config.dataKeys)
    const hasDirectCode = config.codeKeys.some((key) => key in payload)
    const hasDirectSuccess = config.successKeys.some((key) => key in payload)
    const hasDirectMessage = config.messageKeys.some((key) => key in payload)
    const hasData = config.dataKeys.some((key) => key in payload)
    const isEnvelope = hasDirectCode || hasDirectSuccess || (hasData && hasDirectMessage)

    // Nitro commonly wraps an application envelope in `data`. Resolve that
    // inner envelope so `{ statusCode, data: { code, data } }` has the same
    // result as `{ code, data }`, while keeping the original response in raw.
    if (depth < 3 && !hasDirectCode && !hasDirectSuccess && Object.keys(nestedData).length > 0) {
        const nested = readResponseEnvelope<T>(nestedData, config, depth + 1)
        if (nested.isEnvelope) return { ...nested, raw: value }
    }

    const code = isCode(codeValue) ? codeValue : undefined
    const explicitSuccess = typeof successValue === 'boolean' ? successValue : undefined
    const success = explicitSuccess
        ?? (code !== undefined && config.successCodes.length > 0
            ? config.successCodes.some((expected) => sameCode(code, expected))
            : undefined)

    return {
        isEnvelope,
        data: (isEnvelope && dataValue !== undefined ? dataValue : value) as T,
        code,
        success,
        message: firstMessage([payload, nestedData, nestedError], config.messageKeys),
        raw: value,
    }
}

/** Convenience response hook for applications that only need data unwrapping. */
export function unwrapResponseEnvelope<T = unknown>(
    response: AxiosResponse,
    options: ResponseEnvelopeOptions = {},
): AxiosResponse<T> {
    const details = getResponseEnvelopeDetails<T>(response.data, options)
    if (details.isEnvelope) response.data = details.data
    return response as AxiosResponse<T>
}
