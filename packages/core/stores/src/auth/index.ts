import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
    id: string
    username: string
    email: string
    nickname?: string
    avatar?: string
    roles: string[]
    permissions: string[]
    createdAt?: number
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

export interface ChangePasswordParams {
    currentPassword: string
    newPassword: string
}

export const useAuthStore = defineStore(
    'auth',
    () => {
        const user = ref<User | null>(null)
        const token = ref<string | null>(null)
        const loading = ref(false)

        const isLoggedIn = computed(() => !!token.value && !!user.value)
        const userRoles = computed(() => user.value?.roles ?? [])
        const userPermissions = computed(() => user.value?.permissions ?? [])

        // 模拟登录
        async function login(params: LoginParams): Promise<boolean> {
            loading.value = true
            try {
                // 模拟 API 调用
                await new Promise((resolve) => setTimeout(resolve, 800))

                // 模拟验证 - 任意非空账号密码均可登录
                if (params.username && params.password) {
                    token.value = `mock-token-${Date.now()}`
                    user.value = {
                        id: '1',
                        username: params.username,
                        email: `${params.username}@example.com`,
                        nickname: params.username,
                        avatar: 'https://www.airsado.cn/usr/uploads/avatar_24.jpg',
                        roles: ['admin'],
                        permissions: ['*'],
                    }
                    return true
                }
                return false
            } finally {
                loading.value = false
            }
        }

        // 模拟注册
        async function register(params: RegisterParams): Promise<boolean> {
            loading.value = true
            try {
                await new Promise((resolve) => setTimeout(resolve, 800))
                // 模拟成功
                return true
            } finally {
                loading.value = false
            }
        }

        // 修改密码
        async function changePassword(params: ChangePasswordParams): Promise<boolean> {
            loading.value = true
            try {
                await new Promise((resolve) => setTimeout(resolve, 800))
                if (params.currentPassword && params.newPassword) {
                    return true
                }
                return false
            } finally {
                loading.value = false
            }
        }

        // 登出
        function logout(): void {
            user.value = null
            token.value = null
        }

        // 更新用户信息
        function updateUser(updates: Partial<User>): void {
            if (user.value) {
                user.value = { ...user.value, ...updates }
            }
        }

        // 检查权限
        function hasPermission(permission: string): boolean {
            if (userPermissions.value.includes('*')) return true
            return userPermissions.value.includes(permission)
        }

        // 检查角色
        function hasRole(role: string): boolean {
            return userRoles.value.includes(role)
        }

        return {
            user,
            token,
            loading,
            isLoggedIn,
            userRoles,
            userPermissions,
            login,
            register,
            changePassword,
            logout,
            updateUser,
            hasPermission,
            hasRole,
        }
    },
    {
        persist: {
            key: 'airovo-auth',
            storage: localStorage,
        },
    },
)
