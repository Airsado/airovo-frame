import { describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { installRequest, RequestError } from '../src'
import type { RequestOptions } from '../src/types'

function makeTokenStore() {
    let accessToken: string | null = 'access-1'
    let refreshToken: string | null = 'refresh-1'
    return {
        getAccessToken: () => accessToken,
        getRefreshToken: () => refreshToken,
        setTokens: vi.fn((t: { accessToken: string; refreshToken: string; expiresIn: number }) => {
            accessToken = t.accessToken
            refreshToken = t.refreshToken
        }),
        clear: vi.fn(() => {
            accessToken = null
            refreshToken = null
        }),
    }
}

function makeOptions(store: ReturnType<typeof makeTokenStore>, overrides: Partial<RequestOptions> = {}): RequestOptions {
    return {
        baseURL: 'http://localhost',
        useStore: () => store,
        ...overrides,
    }
}

describe('@airovo/request', () => {
    it('attaches Authorization header on every request', async () => {
        const store = makeTokenStore()
        const app = { provide: vi.fn() } as any
        const instance = installRequest(app, makeOptions(store))

        // Capture the header from the adapter (the final, post-interceptor config).
        let capturedHeader: string | undefined
        instance.defaults.adapter = vi.fn(async (config: any) => {
            capturedHeader = config.headers.get('Authorization')
            return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config: {} as any }
        })

        await instance.get('/me')
        expect(capturedHeader).toBe('Bearer access-1')
    })

    it('throws RequestError on non-2xx', async () => {
        const store = makeTokenStore()
        const app = { provide: vi.fn() } as any
        const instance = installRequest(app, makeOptions(store))
        instance.defaults.adapter = vi.fn(async () => {
            const err: any = new Error('Request failed with status code 500')
            err.response = { data: { message: 'boom' }, status: 500, statusText: 'Server Error', headers: {}, config: {} }
            throw err
        })

        await expect(instance.get('/boom')).rejects.toBeInstanceOf(RequestError)
        try {
            await instance.get('/boom')
        } catch (e) {
            expect((e as RequestError).httpStatus).toBe(500)
            expect((e as RequestError).message).toBe('boom')
        }
    })

    it('retries once after a successful 401 refresh', async () => {
        const store = makeTokenStore()
        const app = { provide: vi.fn() } as any
        const instance = installRequest(app, makeOptions(store, {
            refreshTokenUrl: '/auth/refresh',
        }))

        let protectedCalls = 0
        instance.defaults.adapter = vi.fn(async (config: any) => {
            if (config.url === '/auth/refresh') {
                return {
                    data: { accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 3600 },
                    status: 200, statusText: 'OK', headers: {}, config: {} as any,
                }
            }
            // /protected
            protectedCalls++
            if (protectedCalls === 1) {
                const err: any = new Error('401')
                err.response = { data: { message: 'expired' }, status: 401, statusText: 'Unauthorized', headers: {}, config: {} }
                err.config = config
                throw err
            }
            return { data: { ok: true, attempt: protectedCalls }, status: 200, statusText: 'OK', headers: {}, config: {} as any }
        })

        const result = await instance.get('/protected')
        // Refresh should have happened exactly once and the second /protected call succeeded.
        expect(protectedCalls).toBe(2)
        expect(result.data).toEqual({ ok: true, attempt: 2 })
        expect(store.setTokens).toHaveBeenCalledOnce()
    })
})
