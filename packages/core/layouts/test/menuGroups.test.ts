import { describe, expect, it } from 'vitest'
import { groupSidebarMenus } from '../src/basic/sidebar/menuGroups'
import type { SidebarMenuItemType } from '../src/basic/sidebar/types'

describe('sidebar menu ordering', () => {
    it('sorts sections by their first ordered entry and preserves ties/unordered input', () => {
        const input: SidebarMenuItemType[] = [
            { title: 'U1', url: '/u1', group: 'Unordered' },
            { title: 'Late', url: '/late', group: 'Second', order: 20 },
            { title: 'U2', url: '/u2', group: 'Unordered' },
            { title: 'Tie1', url: '/t1', group: 'First', order: 0 },
            { title: 'Tie2', url: '/t2', group: 'First', order: 0 },
            { title: 'Earliest', url: '/earliest', group: 'Second', order: -1 },
            { title: 'Invalid', url: '/invalid', group: 'Unordered', order: NaN },
        ]
        const groups = groupSidebarMenus(input)
        expect(groups.map(group => group.title)).toEqual(['Second', 'First', 'Unordered'])
        expect(groups.map(group => group.items.map(menu => menu.url))).toEqual([
            ['/earliest', '/late'], ['/t1', '/t2'], ['/u1', '/u2', '/invalid'],
        ])
        expect(input.map(menu => menu.url)).toEqual(['/u1', '/late', '/u2', '/t1', '/t2', '/earliest', '/invalid'])
    })

    it('orders children for both expanded and collapsed rendering without changing parent section order', () => {
        const input: SidebarMenuItemType[] = [{
            title: 'Parent', url: '/parent', group: 'Later', order: 30,
            children: [
                { title: 'B', url: '/b', order: 20 },
                { title: 'A', url: '/a', order: -10, children: [
                    { title: 'D', url: '/d' }, { title: 'C', url: '/c', meta: { order: 0 } },
                ] },
            ],
        }, { title: 'Earlier', url: '/earlier', group: 'Earlier', order: 10 }]
        const groups = groupSidebarMenus(input)
        expect(groups.map(group => group.title)).toEqual(['Earlier', 'Later'])
        expect(groups[1]!.items[0]!.children!.map(menu => menu.url)).toEqual(['/a', '/b'])
        expect(groups[1]!.items[0]!.children![0]!.children!.map(menu => menu.url)).toEqual(['/c', '/d'])
        expect(input[0]!.children![0]!.url).toBe('/b')
    })

    it('keeps grouped redirect-container behavior and group keys when ordering', () => {
        const groups = groupSidebarMenus([{
            title: 'Workspace', url: '/workspace', children: [
                { title: 'Other', url: '/other', group: '同名组', groupKey: 'second', order: 20 },
                { title: 'Main', url: '/main', group: '同名组', groupKey: 'first', order: 10 },
            ],
        }])
        expect(groups.map(group => group.titleKey)).toEqual(['first', 'second'])
        expect(groups.map(group => group.items[0]!.url)).toEqual(['/main', '/other'])
    })

    it('preserves disabled state while copying and sorting the menu tree', () => {
        const input: SidebarMenuItemType[] = [{
            title: 'Workspace', url: '/workspace', order: 10, children: [
                { title: 'Unavailable', url: '/workspace/unavailable', order: 20, disabled: true },
                { title: 'Available', url: '/workspace/available', order: 10 },
            ],
        }]
        const groups = groupSidebarMenus(input)
        const children = groups[0]!.items[0]!.children!
        expect(children.map(menu => menu.url)).toEqual(['/workspace/available', '/workspace/unavailable'])
        expect(children[1]!.disabled).toBe(true)
        expect(input[0]!.children![0]!.url).toBe('/workspace/unavailable')
    })
})
