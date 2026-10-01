import { getRequestClient } from '@airovo/app'
import type { User } from '@airovo/stores/auth'

export async function getCurrentUser(): Promise<User> {
    const response = await getRequestClient().get<{ user: User }>('/auth/me')
    return response.data.user
}
