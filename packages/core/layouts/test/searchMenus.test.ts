import { describe, expect, it } from 'vitest'
import { buildSearchMenuGroups } from '../src/basic/components/CommandSearch/searchMenus'
import type { SidebarMenuItemType } from '../src/basic/sidebar/types'

const label = (_key: string | undefined, fallback: string) => fallback

describe('menu search index', () => {
    it('includes top-level leaves and retains external destinations', () => {
        const groups = buildSearchMenuGroups([
            { title: 'Dashboard', url: '/dashboard', icon: 'lucide:chart-bar', group: 'General' },
            { title: 'Docs', url: 'https://example.com/docs', external: true, group: 'General' },
        ], label)
        expect(groups).toEqual([{
            id: 'General', label: 'General', items: [
                { id: '/dashboard', label: 'Dashboard', url: '/dashboard', icon: 'lucide:chart-bar', breadcrumb: [] },
                { id: 'https://example.com/docs', label: 'Docs', url: 'https://example.com/docs', breadcrumb: [], external: true },
            ],
        }])
    })

    it('collects deep leaves with parent labels and omits parent destinations', () => {
        const groups = buildSearchMenuGroups([{
            title: 'Users', url: '/users', group: 'Admin', children: [{
                title: 'Messages', url: '/users/messages', children: [
                    { title: 'Rooms', url: '/users/messages/rooms' },
                ],
            }],
        }], label)
        expect(groups[0]?.items.map(item => [item.url, item.breadcrumb])).toEqual([
            ['/users/messages/rooms', ['Users', 'Messages']],
        ])
    })

    it('follows sidebar section and sibling ordering while translating labels', () => {
        const translations: Record<string, string> = {
            'groups.general': '常规', 'groups.admin': '管理员',
            'menus.users': '用户管理', 'menus.list': '用户列表', 'menus.groups': '用户组权益',
        }
        const groups = buildSearchMenuGroups([
            { title: 'Users', titleKey: 'menus.users', url: '/users', group: 'Admin', groupKey: 'groups.admin', order: 20, children: [
                { title: 'Groups', titleKey: 'menus.groups', url: '/users/groups', order: 20 },
                { title: 'List', titleKey: 'menus.list', url: '/users/list', order: 10 },
            ] },
            { title: 'Dashboard', url: '/dashboard', group: 'General', groupKey: 'groups.general', order: 10 },
        ], (key, fallback) => key ? translations[key] ?? fallback : fallback)
        expect(groups.map(group => [group.id, group.label])).toEqual([
            ['groups.general', '常规'], ['groups.admin', '管理员'],
        ])
        expect(groups[1]?.items.map(item => [item.label, item.breadcrumb])).toEqual([
            ['用户列表', ['用户管理']], ['用户组权益', ['用户管理']],
        ])
    })

    it('keeps same-named destinations distinct and removes duplicate URLs', () => {
        const groups = buildSearchMenuGroups([
            { title: 'Settings', url: '/settings/users', group: 'Admin', order: 10 },
            { title: 'Settings', url: '/settings/videos', group: 'Content', order: 20 },
            { title: 'Repeated settings', url: '/settings/users', group: 'Content', order: 30 },
        ], label)
        expect(groups.flatMap(group => group.items.map(item => [item.id, item.label]))).toEqual([
            ['/settings/users', 'Settings'], ['/settings/videos', 'Settings'],
        ])
    })

    it('inherits disabled state even when sidebar grouping flattens containers', () => {
        const groups = buildSearchMenuGroups([{
            title: 'Content', url: '/content', disabled: true, children: [{
                title: 'Videos', url: '/content/videos', group: 'Content', disabled: false,
            }],
        }, {
            title: 'Standalone disabled', url: '/disabled', disabled: true,
        }], label)
        const items = groups.flatMap(group => group.items)
        expect(items.find(item => item.url === '/content/videos')).toMatchObject({
            disabled: true, breadcrumb: [],
        })
        expect(items.find(item => item.url === '/disabled')?.disabled).toBe(true)
    })

    it('omits empty destinations and sections without searchable leaves', () => {
        expect(buildSearchMenuGroups([
            { title: 'Empty', url: '', children: [] },
            { title: 'Placeholder', url: '#' },
            { title: 'Whitespace', url: '   ' },
            { title: 'Container', url: '/container', children: [{ title: 'Empty child', url: '#' }] },
        ], label)).toEqual([])
        expect(buildSearchMenuGroups([], label)).toEqual([])
    })

    it('does not mutate the supplied menu tree while sorting or adding ancestry', () => {
        const input: SidebarMenuItemType[] = [{
            title: 'Users', url: '/users', children: [
                { title: 'Groups', url: '/users/groups', order: 20 },
                { title: 'List', url: '/users/list', order: 10 },
            ],
        }]
        const snapshot = structuredClone(input)
        Object.freeze(input[0]!.children![0]!)
        Object.freeze(input[0]!.children![1]!)
        Object.freeze(input[0]!.children!)
        Object.freeze(input[0]!)
        Object.freeze(input)
        const groups = buildSearchMenuGroups(input, label)
        groups[0]!.items[0]!.breadcrumb.push('Changed result')
        expect(input).toEqual(snapshot)
        expect(groups[0]!.items[1]!.breadcrumb).toEqual(['Users'])
    })
})
