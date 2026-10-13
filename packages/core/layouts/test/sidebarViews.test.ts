import { describe, expect, it } from 'vitest'
import { resolveSidebarView, type SidebarView } from '../src/basic/sidebar/sidebarViews'

const views: SidebarView[] = [
    {
        id: 'settings',
        pathPattern: /^\/settings(?:\/|$)/,
        parent: { title: 'Dashboard', url: '/' },
        menus: [{ title: 'Profile', url: '/settings/profile' }],
    },
    {
        id: 'reports',
        pathPattern: /^\/reports(?:\/|$)/,
        parent: { title: 'Dashboard', url: '/' },
        menus: [{ title: 'Overview', url: '/reports' }],
    },
]

describe('sidebar view resolution', () => {
    it('returns the first matching contextual view', () => {
        expect(resolveSidebarView('/settings/profile', views)?.id).toBe('settings')
        expect(resolveSidebarView('/reports/weekly', views)?.id).toBe('reports')
    })

    it('returns null for root paths and resets global regex state', () => {
        expect(resolveSidebarView('/', views)).toBeNull()
        const globalPattern = /\/settings(?:\/|$)/g
        const globalView = { ...views[0], pathPattern: globalPattern }
        expect(resolveSidebarView('/settings/profile', [globalView])?.id).toBe('settings')
        expect(resolveSidebarView('/settings/profile', [globalView])?.id).toBe('settings')
    })
})
