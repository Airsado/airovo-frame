/**
 * useTabStore — multi-tab state with localStorage persistence.
 *
 * The store holds the open tab list, the active tab id, the cached
 * tab ids (for keep-alive), and the maximized tab id. It does NOT
 * own the rendering — that's BasicTabBar's job (in @airovo/tabs).
 */
import { defineStore } from 'pinia'
import { ref, nextTick } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import type { TabItem } from './types'

function hashId(to: RouteLocationNormalized): string {
    // Non-cryptographic — same fullPath always yields the same id.
    let h = 0
    for (let i = 0; i < to.fullPath.length; i++) {
        h = (h * 31 + to.fullPath.charCodeAt(i)) | 0
    }
    return `${to.fullPath}#${Math.abs(h)}`
}

export const useTabStore = defineStore(
    'tabs',
    () => {
        const tabs = ref<TabItem[]>([])
        const activeTabId = ref<string | null>(null)
        const cachedTabIds = ref<string[]>([])
        const maximizedTabId = ref<string | null>(null)

        function addOrActivate(to: RouteLocationNormalized) {
            const id = hashId(to)
            const existing = tabs.value.find((t) => t.id === id)
            if (!existing) {
                tabs.value.push({
                    id,
                    path: to.path,
                    fullPath: to.fullPath,
                    title: (to.meta?.title as string | undefined) ?? (typeof to.name === 'string' ? to.name : '未命名'),
                    icon: to.meta?.icon as string | undefined,
                    affix: to.meta?.affix === true,
                    pinned: false,
                    closable: to.meta?.affix !== true,
                    scrollTop: 0,
                    query: { ...(to.query as Record<string, any>) },
                    params: { ...(to.params as Record<string, any>) },
                })
            }
            activeTabId.value = id
            if (!cachedTabIds.value.includes(id)) {
                cachedTabIds.value.push(id)
            }
        }

        function closeTab(id: string): void {
            const idx = tabs.value.findIndex((t) => t.id === id)
            if (idx === -1) return
            const tab = tabs.value[idx]
            if (tab.affix) return
            tabs.value.splice(idx, 1)
            cachedTabIds.value = cachedTabIds.value.filter((c) => c !== id)
            if (activeTabId.value === id) {
                const next = tabs.value[Math.min(idx, tabs.value.length - 1)]
                activeTabId.value = next?.id ?? null
            }
        }

        function closeOthers(id: string): void {
            const keep = tabs.value.filter((t) => t.affix || t.id === id)
            tabs.value = keep
            cachedTabIds.value = cachedTabIds.value.filter(
                (c) => keep.some((t) => t.id === c),
            )
        }

        function closeAll(): void {
            tabs.value = tabs.value.filter((t) => t.affix)
            cachedTabIds.value = []
        }

        function refreshTab(id: string): void {
            cachedTabIds.value = cachedTabIds.value.filter((c) => c !== id)
            nextTick(() => {
                if (id === activeTabId.value) {
                    cachedTabIds.value.push(id)
                }
            })
        }

        function pinTab(id: string): void {
            const t = tabs.value.find((x) => x.id === id)
            if (t) t.pinned = !t.pinned
        }

        function activate(id: string): void {
            activeTabId.value = id
        }

        function maximizeTab(id: string | null): void {
            maximizedTabId.value = id
        }

        function setScrollTop(id: string, scrollTop: number): void {
            const t = tabs.value.find((x) => x.id === id)
            if (t) t.scrollTop = scrollTop
        }

        return {
            tabs, activeTabId, cachedTabIds, maximizedTabId,
            addOrActivate, closeTab, closeOthers, closeAll,
            refreshTab, pinTab, activate, maximizeTab, setScrollTop,
        }
    },
    {
        persist: {
            pick: ['tabs', 'cachedTabIds'],
            key: 'airovo-tabs',
            storage: localStorage,
        },
    } as any,
)
