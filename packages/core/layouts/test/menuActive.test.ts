import { describe, expect, it } from 'vitest'
import { activeMenuPath, containsActiveMenu, isActiveMenu } from '../src/basic/sidebar/menuActive'

describe('active menu resolution', () => {
    const parent = {
        title: 'Users',
        url: '/users',
        children: [{ title: 'List', url: '/users/list' }],
    }

    it('uses the current path when there is no activeMenu override', () => {
        expect(activeMenuPath({ path: '/users/list', meta: {} })).toBe('/users/list')
        expect(containsActiveMenu(parent, '/users/list')).toBe(true)
    })

    it('selects an explicit menu entry for a detail route', () => {
        const path = activeMenuPath({ path: '/users/42', meta: { activeMenu: '/users?tab=all' } })
        expect(path).toBe('/users')
        expect(isActiveMenu(parent, path)).toBe(true)
        expect(isActiveMenu(parent.children[0]!, path)).toBe(false)
    })
    it('keeps expanded parent and child active semantics separate', () => {
        expect(isActiveMenu(parent, '/users/list')).toBe(false)
        expect(isActiveMenu(parent.children[0]!, '/users/list')).toBe(true)
        expect(containsActiveMenu(parent, '/users/list')).toBe(true)
    })
})
