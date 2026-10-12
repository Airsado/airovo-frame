import { defineEventHandler, getHeader } from 'h3'
import type { MockMenuItem } from '../types'
import { bearerToken, sessionFromAccessToken } from '../utils/auth'
import { unauthorized } from '../utils/http'

const menus: MockMenuItem[] = [
    {
        title: 'Mock API',
        titleKey: 'navigation.mockApi',
        name: 'MockApi',
        path: '/mock-api',
        icon: 'lucide:server',
        group: '系统能力',
        groupKey: 'navigation.system',
        children: [{
            title: 'Health',
            titleKey: 'navigation.mockHealth',
            name: 'MockHealth',
            path: '/mock-api/health',
            icon: 'lucide:heart-pulse',
            component: '/views/MockHealth.vue',
        }],
    },
]

export default defineEventHandler((event) => {
    const session = sessionFromAccessToken(bearerToken(getHeader(event, 'authorization')))
    if (!session) unauthorized('access token required')
    return menus
})
