import type { MockUser } from '../types'

export interface MockSession {
    user: MockUser
    refreshToken: string
    accessToken: string
}

const users = new Map<string, MockUser>([
    ['admin', {
        id: 'mock-admin',
        username: 'admin',
        email: 'admin@example.com',
        nickname: '管理员',
        roles: ['admin'],
        permissions: ['*', 'demo.dynamic'],
    }],
])
const passwords = new Map<string, string>([['admin', '123456']])

const accessSessions = new Map<string, MockSession>()
const refreshSessions = new Map<string, MockSession>()

export const ACCESS_EXPIRES_IN = 3600

function token(prefix: string): string {
    return `${prefix}-${crypto.randomUUID()}`
}

export function findUser(username: string): MockUser | undefined {
    return users.get(username)
}

export function verifyCredentials(username: string, password: string): MockUser | null {
    const user = users.get(username)
    return user && passwords.get(username) === password ? user : null
}

export function createUser(input: { username: string; email: string; password: string }): MockUser {
    const user: MockUser = {
        id: `mock-${crypto.randomUUID()}`,
        username: input.username,
        email: input.email,
        nickname: input.username,
        roles: ['user'],
        permissions: [],
    }
    users.set(user.username, user)
    passwords.set(user.username, input.password)
    return user
}

export function issueSession(user: MockUser): MockSession {
    const session: MockSession = {
        user,
        accessToken: token('mock-access'),
        refreshToken: token('mock-refresh'),
    }
    accessSessions.set(session.accessToken, session)
    refreshSessions.set(session.refreshToken, session)
    return session
}

export function rotateSession(refreshToken: string): MockSession | null {
    const current = refreshSessions.get(refreshToken)
    if (!current) return null
    refreshSessions.delete(refreshToken)
    accessSessions.delete(current.accessToken)
    return issueSession(current.user)
}

export function revokeSession(refreshToken: string | undefined): void {
    if (!refreshToken) return
    const session = refreshSessions.get(refreshToken)
    if (!session) return
    refreshSessions.delete(refreshToken)
    accessSessions.delete(session.accessToken)
}

export function sessionFromAccessToken(accessToken: string | undefined): MockSession | null {
    if (!accessToken) return null
    return accessSessions.get(accessToken) ?? null
}

export function bearerToken(authorization: string | undefined): string | undefined {
    const match = authorization?.match(/^Bearer\s+(.+)$/i)
    return match?.[1]
}
