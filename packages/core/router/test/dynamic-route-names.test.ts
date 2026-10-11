import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createAppRouter } from '../src/internal'
import type { MenuItem } from '../src'

const Page = defineComponent({ name: 'GenericPage', template: '<div />' })
const menus: MenuItem[] = [{
    title: 'Remote', url: '/remote', name: 'Remote', children: [
        { title: 'Child', url: '/remote/child', name: 'Shared', component: '/views/Generic.vue', children: [
            { title: 'Grandchild', url: '/remote/child/grandchild', name: 'Shared', component: '/views/Generic.vue' },
        ] },
        { title: 'Sibling', url: '/remote/sibling', name: 'Remote', component: '/views/Generic.vue' },
        { title: 'Sibling 2', url: '/remote/second', name: 'Shared', component: '/views/Generic.vue' },
    ],
}]

describe.each(['backend', 'mixed'] as const)('%s dynamic route name isolation', (menusMod) => {
    function setup() {
        return createAppRouter({
            routes: [
                { path: '/local', name: 'Shared', component: Page, meta: { title: 'Local', requiresAuth: true } },
                // The normal deterministic fallback can itself collide.
                { path: '/reserved', name: 'dynamic:/remote/child', component: Page },
                { path: '/reserved-2', name: 'dynamic:/remote/child:2', component: Page },
            ],
            menusMod, history: 'hash', pageMap: { '/views/Generic.vue': Page },
            menus: { load: async () => menus },
        })
    }

    it('allocates collision-free names throughout child/grandchild trees and restores local routes on clear', () => {
        const app = setup()
        const local = app.router.getRoutes().map(route => ({ path: route.path, name: route.name, meta: { ...route.meta } }))
        app.registerDynamicRoutes(menus)
        const records = app.router.getRoutes()
        expect(new Set(records.map(route => route.name)).size).toBe(records.length)
        for (const route of local) expect(records.find(record => record.path === route.path)).toMatchObject(route)
        for (const path of ['/remote', '/remote/child', '/remote/child/grandchild', '/remote/sibling', '/remote/second']) {
            expect(records.filter(record => record.path === path)).toHaveLength(1)
            expect(app.router.resolve(path).matched.at(-1)?.path).toBe(path)
        }
        const child = records.find(route => route.path === '/remote/child')!
        expect(child.name).toBe('dynamic:/remote/child:3')
        const names = records.map(route => route.name)
        app.registerDynamicRoutes(menus)
        expect(app.router.getRoutes().map(route => route.name)).toEqual(names)
        app.clearDynamicRoutes()
        expect(app.router.getRoutes().map(route => ({ path: route.path, name: route.name, meta: { ...route.meta } }))).toEqual(local)
        expect(app.router.resolve('/local').name).toBe('Shared')
        app.clearDynamicRoutes()
        expect(app.router.getRoutes()).toHaveLength(local.length)
    })

    it('keeps local routes through refresh and logout-style dynamic cleanup', async () => {
        const app = setup()
        for (let cycle = 0; cycle < 3; cycle++) {
            expect(await app.refreshMenus()).toBe(true)
            expect(app.router.hasRoute('Shared')).toBe(true)
            expect(app.router.resolve('/local').matched[0].path).toBe('/local')
            app.clearDynamicRoutes()
            expect(app.router.getRoutes().map(route => route.path).sort()).toEqual(['/local', '/reserved', '/reserved-2'])
        }
    })

    it('extends an existing local parent without removing its local descendants or metadata', () => {
        const app = createAppRouter({
            routes: [{ path: '/workspace', name: 'Workspace', component: Page, meta: { title: 'Local', requiresAuth: true }, children: [{ path: 'local', name: 'Shared', component: Page }] }],
            menusMod, history: 'hash', pageMap: { '/views/Generic.vue': Page },
        })
        app.registerDynamicRoutes([{ title: 'Backend', url: '/workspace', name: 'Ignored', meta: { permissions: ['workspace.read'] }, children: [{
            title: 'Remote', url: '/workspace/remote', name: 'Shared', children: [{ title: 'Leaf', url: '/workspace/remote/leaf', name: 'Workspace', component: '/views/Generic.vue' }],
        }] }])
        expect(app.router.resolve('/workspace/local').name).toBe('Shared')
        expect(app.router.resolve('/workspace/remote/leaf').matched.map(route => route.path)).toEqual(['/workspace', '/workspace/remote', '/workspace/remote/leaf'])
        const parent = app.router.getRoutes().find(route => route.name === 'Workspace')!
        expect(parent.meta.requiresAuth).toBe(true)
        expect(parent.meta.permissions).toEqual(['workspace.read'])
        app.clearDynamicRoutes()
        expect(app.router.resolve('/workspace/local').name).toBe('Shared')
        expect(parent.meta).toEqual({ title: 'Local', requiresAuth: true })
        expect(app.router.getRoutes()).toHaveLength(2)
    })

    it('extends an anonymous local parent and restores its local subtree on clear', () => {
        const app = createAppRouter({
            routes: [{
                path: '/workspace', component: Page, meta: { title: 'Local', requiresAuth: true },
                children: [{ path: 'local', name: 'Local', component: Page }],
            }],
            menusMod, history: 'hash', pageMap: { '/views/Generic.vue': Page },
        })
        const parentBefore = app.router.getRoutes().find(route => route.path === '/workspace')!
        expect(parentBefore.name).toBeTruthy()
        app.registerDynamicRoutes([{
            title: 'Workspace', url: '/workspace', children: [{
                title: 'Remote', url: '/workspace/remote', name: 'Remote', component: '/views/Generic.vue',
            }],
        }])

        expect(app.router.resolve('/workspace/local').matched.map(route => route.path)).toEqual(['/workspace', '/workspace/local'])
        expect(app.router.resolve('/workspace/remote').matched.map(route => route.path)).toEqual(['/workspace', '/workspace/remote'])
        expect(app.router.getRoutes().find(route => route.path === '/workspace')?.meta).toMatchObject({
            title: 'Workspace',
            requiresAuth: true,
        })

        app.clearDynamicRoutes()
        expect(app.router.resolve('/workspace/local').matched.map(route => route.path)).toEqual(['/workspace', '/workspace/local'])
        expect(app.router.getRoutes().some(route => route.path === '/workspace/remote')).toBe(false)
        expect(app.router.getRoutes().find(route => route.path === '/workspace')?.meta).toEqual({
            title: 'Local',
            requiresAuth: true,
        })
    })
})
