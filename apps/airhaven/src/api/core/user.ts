import { getRequestClient } from '@airovo/app'
import type { User } from '@airovo/stores/auth'

export async function getCurrentUser(): Promise<User> {
    const response = await getRequestClient().get<any>('/api/v1/user/me')
    return (response.data?.user ?? response.data ?? response) as User
}
