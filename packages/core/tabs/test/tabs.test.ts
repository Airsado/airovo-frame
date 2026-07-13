import { describe, expect, it, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { useTabStore } from '@airovo/stores/tabs'

function makeRoute(path: string, meta: Record<string, any> = {}): RouteLocationNormalized {
    return {
        path: path.split('?')[0]!,
        fullPath: path,
        name: path.split('?')[0]!.replace(/[/:?&=]/g, '_') as any,
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

    it('hideInTab route is skipped by addOrActivate callers', () => {
        const store = useTabStore()
        store.addOrActivate(makeRoute('/a', { title: 'A' }))
        store.addOrActivate(makeRoute('/b', { title: 'B', hideInTab: true }))
        // The second route's hideInTab is an opt-out; the store-level
        // check lives in installTabs (router.afterEach). The store
        // itself is permissive so the router can decide.
        expect(store.tabs.map((t) => t.path)).toEqual(['/a', '/b'])
    })
})
