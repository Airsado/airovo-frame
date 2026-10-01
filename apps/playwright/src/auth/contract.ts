export type AuthOperation = 'login' | 'register' | 'refresh' | 'me' | 'logout'

export interface AuthError {
    operation: AuthOperation
    message: string
    code?: string
    status?: number
    data?: unknown
}

export interface LoginParams {
    username: string
    password: string
}

export interface RegisterParams {
    username: string
    email: string
    password: string
    confirmPassword: string
}

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

/** Map transport errors into application-owned auth codes and messages. */
export function normalizeAuthError(error: unknown, operation: AuthOperation): AuthError {
    const record = asRecord(error)
    const response = asRecord(record.response)
    const responseData = response.data ?? record.data
    const payload = asRecord(responseData)
    const nestedData = asRecord(payload.data)
    const nestedError = asRecord(payload.error)
    const statusValue = record.httpStatus ?? response.status ?? record.status
        ?? record.statusCode ?? payload.statusCode ?? nestedData.statusCode
    const status = typeof statusValue === 'number'
        ? statusValue
        : typeof statusValue === 'string' && /^\d+$/.test(statusValue) ? Number(statusValue) : undefined
    const codeValue = payload.code ?? payload.errorCode ?? nestedData.code
        ?? nestedData.errorCode ?? nestedError.code
    const code = typeof codeValue === 'string' && codeValue ? codeValue : undefined
    const message = [
        payload.message,
        nestedData.message,
        payload.statusMessage,
        nestedData.statusMessage,
        nestedError.message,
        record.statusMessage,
        record.message,
    ].find((value): value is string => typeof value === 'string' && value.trim().length > 0)
        ?? (status === 401 ? 'Unauthorized' : status ? `Request failed with status ${status}` : 'Request failed')
    return {
        operation,
        message,
        code: code ?? (status === 401 && operation === 'login' ? 'INVALID_CREDENTIALS' : undefined),
        status,
        data: responseData,
    }
}
