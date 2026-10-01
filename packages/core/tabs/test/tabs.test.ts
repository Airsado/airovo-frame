import { describe, expect, it, beforeEach } from 'vitest'
import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { useTabStore } from '@airovo/stores/tabs'

function makeRoute(path: string, meta: Record<string, unknown> = {}): RouteLocationNormalized {
    return {
        path: path.split('?')[0]!,
        fullPath: path,
        name: path.split('?')[0]!.replace(/[/:?&=]/g, '_') as RouteLocationNormalized['name'],
        meta,
        query: {},
        params: {},
        matched: [],
        hash: '',
        redirectedFrom: undefined,
    } as unknown as RouteLocationNormalized
}

describe('@airovo/tabs', () => {
    beforeEach(() => setActivePinia(createPinia()))

    it('addOrActivate creates a new tab for an unseen route', () => {
        const store = useTabStore()
        store.addOrActivate(makeRoute('/dashboard', { title: '仪表盘' }))

        expect(store.tabs).toHaveLength(1)
        expect(store.tabs[0]?.title).toBe('仪表盘')
        expect(store.activeTabId).toBeTruthy()
    })

    it('addOrActivate activates an existing tab without duplicating', () => {
        const store = useTabStore()
        const r = makeRoute('/dashboard', { title: '仪表盘' })
        store.addOrActivate(r)
        const id = store.activeTabId!
        store.addOrActivate(r)
        expect(store.tabs).toHaveLength(1)
        expect(store.activeTabId).toBe(id)
    })

    it('uses the explicit cacheName instead of the route name for KeepAlive', () => {
        const store = useTabStore()
        store.addOrActivate(makeRoute('/users', {
            title: '用户',
            cacheName: 'UsersPage',
        }))

        expect(store.tabs[0]?.componentName).toBe('UsersPage')
        expect(store.cachedComponentNames).toContain('UsersPage')
        expect(store.cachedComponentNames).not.toContain('_users')
    })

    it('discovers the matched Vue component name when cacheName is omitted', () => {
        const store = useTabStore()
        const route = makeRoute('/users', { title: '用户' })
        route.matched = [{
            components: { default: defineComponent({ name: 'UsersPage' }) },
        }] as never
        store.addOrActivate(route)

        expect(store.tabs[0]?.componentName).toBe('UsersPage')
        expect(store.cachedComponentNames).toContain('UsersPage')
    })

    it('closeTab removes non-affix tabs', () => {
        const store = useTabStore()
        store.addOrActivate(makeRoute('/a', { title: 'A' }))
        store.addOrActivate(makeRoute('/b', { title: 'B' }))
        const aId = store.tabs[0]!.id
        store.closeTab(aId)
        expect(store.tabs.find((t) => t.id === aId)).toBeUndefined()
    })

    it('closeTab refuses to remove affix tabs', () => {
        const store = useTabStore()
        store.addOrActivate(makeRoute('/a', { title: 'A', affix: true }))
        const id = store.tabs[0]!.id
        store.closeTab(id)
        expect(store.tabs).toHaveLength(1)
    })

    it('closeOthers keeps only the current tab + affixes', () => {
        const store = useTabStore()
        store.addOrActivate(makeRoute('/a', { title: 'A', affix: true }))
        store.addOrActivate(makeRoute('/b', { title: 'B' }))
        store.addOrActivate(makeRoute('/c', { title: 'C' }))
        const cId = store.tabs.find((t) => t.path === '/c')!.id
        store.closeOthers(cId)
        expect(store.tabs.map((t) => t.path)).toEqual(['/a', '/c'])
    })

    it('closeAll removes everything except affixes', () => {
        const store = useTabStore()
        store.addOrActivate(makeRoute('/a', { title: 'A', affix: true }))
        store.addOrActivate(makeRoute('/b', { title: 'B' }))
        store.closeAll()
        expect(store.tabs.map((t) => t.path)).toEqual(['/a'])
    })

    it('refreshTab evicts the id from cachedTabIds then re-adds it', async () => {
        const store = useTabStore()
        store.addOrActivate(makeRoute('/a', { title: 'A' }))
        const id = store.activeTabId!
        expect(store.cachedTabIds).toContain(id)
        store.refreshTab(id)
        // Immediately after refresh, the id is evicted.
        expect(store.cachedTabIds).not.toContain(id)
        // After nextTick it's re-added (because it's still active).
        await new Promise((r) => setTimeout(r, 10))
        expect(store.cachedTabIds).toContain(id)
    })

    it('re-adds a refreshed inactive tab when it is activated later', async () => {
        const store = useTabStore()
        store.addOrActivate(makeRoute('/a', { title: 'A' }))
        const firstId = store.activeTabId!
        store.addOrActivate(makeRoute('/b', { title: 'B' }))
        store.refreshTab(firstId)
        expect(store.cachedTabIds).not.toContain(firstId)
        store.activate(firstId)
        expect(store.cachedTabIds).toContain(firstId)
    })

    it('hideInTab route is skipped by addOrActivate callers', () => {
        const store = useTabStore()
        store.addOrActivate(makeRoute('/a', { title: 'A' }))
        store.addOrActivate(makeRoute('/b', { title: 'B', hideInTab: true }))
        // The second route's hideInTab is an opt-out; the store-level
        // check lives in installTabs (router.afterEach). The store
        // itself is permissive so the router can decide.
        expect(store.tabs.map((t) => t.path)).toEqual(['/a', '/b'])
    })

    it('tracks maximize state as a reversible tab action', () => {
        const store = useTabStore()
        store.addOrActivate(makeRoute('/a', { title: 'A' }))
        const id = store.activeTabId!
        store.maximizeTab(id)
        expect(store.maximizedTabId).toBe(id)
        store.maximizeTab(null)
        expect(store.maximizedTabId).toBeNull()
    })

    it('keeps a tab scroll position when the tab is activated again', () => {
        const store = useTabStore()
        const first = makeRoute('/reports?range=week', { title: '周报' })
        const second = makeRoute('/reports?range=month', { title: '月报' })
        store.addOrActivate(first)
        const firstId = store.activeTabId!
        store.setScrollTop(firstId, 320)
        store.addOrActivate(second)
        store.addOrActivate(first)

        expect(store.activeTabId).toBe(firstId)
        expect(store.tabs.find((tab) => tab.id === firstId)?.scrollTop).toBe(320)
        expect(store.tabs.find((tab) => tab.fullPath === second.fullPath)?.scrollTop).toBe(0)
    })

})
