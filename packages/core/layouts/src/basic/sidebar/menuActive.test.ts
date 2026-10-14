import { describe, expect, it } from 'vitest'
import { containsActiveMenu, isActiveMenu, normalizeMenuPath } from './menuActive'
import { groupSidebarMenus } from './menuGroups'
import type { SidebarMenuItemType } from './types'

const nestedMenu: SidebarMenuItemType = {
    title: '运营',
    url: '/operations',
    children: [
        { title: '站点运营', url: '/operations/sites' },
        { title: '推荐与广告', url: '/operations/recommendations' },
    ],
}

describe('sidebar menu active semantics', () => {
    it('normalizes query strings and trailing slashes for exact matches', () => {
        expect(normalizeMenuPath('/operations/sites/?tab=all')).toBe('/operations/sites')
        expect(isActiveMenu({ title: 'Sites', url: '/operations/sites' }, '/operations/sites?tab=all')).toBe(true)
    })

    it('keeps child active scope separate from parent exact active state', () => {
        expect(containsActiveMenu(nestedMenu, '/operations/recommendations')).toBe(true)
        expect(isActiveMenu(nestedMenu, '/operations/recommendations')).toBe(false)
        expect(isActiveMenu(nestedMenu, '/operations')).toBe(true)
    })
})

describe('sidebar menu groups', () => {
    it('sorts groups and siblings by order without mutating input', () => {
        const menus: SidebarMenuItemType[] = [
            { title: 'Later', url: '/later', group: '二级', order: 20 },
            { title: 'Earlier', url: '/earlier', group: '一级', order: 10 },
            { title: 'First sibling', url: '/first', group: '一级', order: 1 },
        ]
        const groups = groupSidebarMenus(menus)
        expect(groups.map(group => group.title)).toEqual(['一级', '二级'])
        expect(groups[0]?.items.map(item => item.title)).toEqual(['First sibling', 'Earlier'])
        expect(menus.map(item => item.title)).toEqual(['Later', 'Earlier', 'First sibling'])
    })

    it('flattens grouped children into their own visible sections', () => {
        const groups = groupSidebarMenus([{
            title: '工作台',
            url: '/workspace',
            children: [
                { title: '站点运营', url: '/workspace/sites', group: '运营', order: 1 },
                { title: '系统设置', url: '/workspace/settings', group: '设置', order: 2 },
            ],
        }])
        expect(groups.map(group => group.title)).toEqual(['运营', '设置'])
        expect(groups[0]?.items[0]?.title).toBe('站点运营')
    })
})
