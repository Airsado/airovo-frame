export interface MockUser {
    id: string
    username: string
    email: string
    nickname?: string
    roles: string[]
    permissions: string[]
}

export interface MockAuthPayload {
    username?: string
    email?: string
    password?: string
    confirmPassword?: string
    refreshToken?: string
}

export interface MockAuthResponse {
    accessToken: string
    refreshToken?: string
    expiresIn: number
    user?: MockUser
}

export interface MockMenuItem {
    title: string
    titleKey?: string
    name?: string
    path: string
    icon?: string
    group?: string
    groupKey?: string
    component?: string
    meta?: Record<string, unknown>
    children?: MockMenuItem[]
}
