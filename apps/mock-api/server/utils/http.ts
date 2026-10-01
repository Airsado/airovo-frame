import { createError, readBody, type H3Event } from 'h3'
import type { MockAuthPayload } from '../types'

export async function readAuthBody(event: H3Event): Promise<MockAuthPayload> {
    const body = await readBody<MockAuthPayload>(event)
    return body && typeof body === 'object' ? body : {}
}

export function badRequest(message: string, code = 'INVALID_REQUEST'): never {
    throw createError({ statusCode: 400, statusMessage: message, data: { code, message } })
}

export function unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED'): never {
    throw createError({ statusCode: 401, statusMessage: message, data: { code, message } })
}
