import { getRequestClient } from '@airovo/app'
import type { AuthSession, AuthTokens } from '@airovo/stores/auth'
import type { LoginParams, RegisterParams } from '../../auth/contract'

export async function login(params: LoginParams): Promise<AuthSession> {
    const response = await getRequestClient().post<any>('/api/admin/auth/login', params, { __skipAuth: true })
    const data = response.data ?? response
    return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: { id: data.user_info?.username ?? '', username: data.user_info?.username ?? '', email: '', nickname: data.user_info?.nickname ?? '', roles: ['admin'], permissions: ['*:*:*'] },
    } as AuthSession
}

export async function register(params: RegisterParams): Promise<AuthSession> {
    const response = await getRequestClient().post<AuthSession>('/api/v1/auth/register', params, { __skipAuth: true })
    return response.data
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await getRequestClient().post<any>('/api/admin/auth/refresh', { refreshToken }, { __skipAuth: true })
    return (response.data ?? response) as AuthTokens
}

export async function revoke(tokens: { accessToken: string | null; refreshToken: string | null }): Promise<void> {
    await getRequestClient().post('/api/admin/auth/logout', tokens, { __skipAuth: true })
}
