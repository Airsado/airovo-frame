import { describe, expect, it, vi } from 'vitest'
import { createAuthRetryHandler, type AppRetryConfig } from './auth-retry'

function config(token = 'access-1', overrides: Partial<AppRetryConfig> = {}): AppRetryConfig {
    return {
        url: '/protected',
        method: 'get',
        headers: {} as AppRetryConfig['headers'],
        __authToken: token,
        ...overrides,
    } as AppRetryConfig
}

function failure(request: AppRetryConfig, status = 401): { httpStatus: number; config: AppRetryConfig } {
    return { httpStatus: status, config: request }
}

describe('application 401 refresh policy', () => {
    it('does not refresh skipAuth or non-401 failures', async () => {
        const refresh = vi.fn(async () => 'access-2')
        const retry = vi.fn(async () => 'retried')
        const expire = vi.fn()
        const handler = createAuthRetryHandler({
            getSession: () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
            refresh,
            expireSession: expire,
            retry,
        })

        await expect(handler(failure(config('access-1', { __skipAuth: true })))).rejects.toMatchObject({ httpStatus: 401 })
        await expect(handler(failure(config(), 403))).rejects.toMatchObject({ httpStatus: 403 })
        expect(refresh).not.toHaveBeenCalled()
        expect(retry).not.toHaveBeenCalled()
        expect(expire).not.toHaveBeenCalled()
    })

    it('refreshes once and retries the original request once', async () => {
        const refresh = vi.fn(async () => 'access-2')
        const retry = vi.fn(async (request: AppRetryConfig) => request)
        const handler = createAuthRetryHandler({
            getSession: () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
            refresh,
            expireSession: vi.fn(),
            retry,
        })
        const request = config()

        await expect(handler(failure(request))).resolves.toBe(request)
        expect(refresh).toHaveBeenCalledOnce()
        expect(refresh).toHaveBeenCalledWith('refresh-1')
        expect(request.__retried).toBe(true)
        expect(retry).toHaveBeenCalledWith(request)
    })

    it('shares one refresh promise across concurrent 401 failures', async () => {
        let resolveRefresh!: (token: string) => void
        const refresh = vi.fn(() => new Promise<string>((resolve) => { resolveRefresh = resolve }))
        const retry = vi.fn(async (request: AppRetryConfig) => request.url)
        const handler = createAuthRetryHandler({
            getSession: () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
            refresh,
            expireSession: vi.fn(),
            retry,
        })

        const first = handler(failure(config()))
        const second = handler(failure(config()))
        expect(refresh).toHaveBeenCalledOnce()
        resolveRefresh('access-2')
        await expect(Promise.all([first, second])).resolves.toEqual(['/protected', '/protected'])
        expect(retry).toHaveBeenCalledTimes(2)
    })

    it('expires the session when refresh fails', async () => {
        const refresh = vi.fn(async () => { throw new Error('refresh failed') })
        const expire = vi.fn()
        const handler = createAuthRetryHandler({
            getSession: () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
            refresh,
            expireSession: expire,
            retry: vi.fn(),
        })

        await expect(handler(failure(config()))).rejects.toMatchObject({ httpStatus: 401 })
        expect(expire).toHaveBeenCalledOnce()
    })

    it('does not refresh a request twice', async () => {
        const refresh = vi.fn(async () => 'access-2')
        const expire = vi.fn()
        const handler = createAuthRetryHandler({
            getSession: () => ({ accessToken: 'access-2', refreshToken: 'refresh-2' }),
            refresh,
            expireSession: expire,
            retry: vi.fn(),
        })
        const request = config('access-2', { __retried: true })

        await expect(handler(failure(request))).rejects.toMatchObject({ httpStatus: 401 })
        expect(refresh).not.toHaveBeenCalled()
        expect(expire).toHaveBeenCalledOnce()
    })

    it('expires an access-only session after a repeated 401', async () => {
        const expire = vi.fn()
        const handler = createAuthRetryHandler({
            getSession: () => ({ accessToken: 'access-2', refreshToken: null }),
            refresh: vi.fn(),
            expireSession: expire,
            retry: vi.fn(),
        })

        await expect(handler(failure(config('access-2', { __retried: true })))).rejects.toMatchObject({ httpStatus: 401 })
        expect(expire).toHaveBeenCalledOnce()
    })

    it('retries immediately when another request already rotated the access token', async () => {
        const refresh = vi.fn(async () => 'access-3')
        const retry = vi.fn(async () => 'retried')
        const handler = createAuthRetryHandler({
            getSession: () => ({ accessToken: 'access-2', refreshToken: 'refresh-2' }),
            refresh,
            expireSession: vi.fn(),
            retry,
        })

        await expect(handler(failure(config('access-1')))).resolves.toBe('retried')
        expect(refresh).not.toHaveBeenCalled()
        expect(retry).toHaveBeenCalledOnce()
    })

    it('does not clear a session when a stale refresh failure loses a rotation race', async () => {
        let session = { accessToken: 'access-1', refreshToken: 'refresh-1' }
        const expire = vi.fn()
        const refresh = vi.fn(async () => {
            session = { accessToken: 'access-2', refreshToken: 'refresh-2' }
            throw new Error('stale refresh response')
        })
        const handler = createAuthRetryHandler({
            getSession: () => session,
            refresh,
            expireSession: expire,
            retry: vi.fn(),
        })

        await expect(handler(failure(config()))).rejects.toMatchObject({ httpStatus: 401 })
        expect(expire).not.toHaveBeenCalled()
    })
})
