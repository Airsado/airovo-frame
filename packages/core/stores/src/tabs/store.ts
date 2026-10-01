/**
 * useTabStore — multi-tab state with localStorage persistence.
 *
 * The store holds the open tab list, the active tab id, the cached
 * tab ids (for keep-alive), and the maximized tab id. It does NOT
 * own the rendering — that's BasicTabBar's job (in @airovo/tabs).
 */
import { defineStore } from 'pinia'
import { ref, nextTick } from 'vue'
// Keep Pinia's `persist` option augmentation available when this subpath is
// imported directly (`@airovo/stores/tabs`) without first traversing the
// package root export that installs the persistence plugin.
import type {} from 'pinia-plugin-persistedstate'
import type { RouteLocationNormalized, RouteLocationResolvedGeneric } from 'vue-router'
import type { TabItem } from './types'

function hashId(to: RouteLocationNormalized | RouteLocationResolvedGeneric): string {
    // Non-cryptographic — same fullPath always yields the same id.
    let h = 0
    for (let i = 0; i < to.fullPath.length; i++) {
        h = (h * 31 + to.fullPath.charCodeAt(i)) | 0
    }
    return `${to.fullPath}#${Math.abs(h)}`
}

/**
 * Resolve the name Vue KeepAlive will see for a route component.
 *
 * Route names and component names are independent in vue-router. Falling
 * back to `to.name` for every route means an app that names a route
 * `DashboardUsers` but its SFC `Users` silently loses KeepAlive caching. An
 * explicit `meta.cacheName` remains the strongest contract; when it is not
 * supplied we can still discover names for eagerly registered components
 * from the matched route records before falling back to the route name.
 */
function componentNameFor(
    to: RouteLocationNormalized | RouteLocationResolvedGeneric,
): string | undefined {
    const cacheName = to.meta?.cacheName
    if (typeof cacheName === 'string' && cacheName) return cacheName

    const matched = 'matched' in to && Array.isArray(to.matched) ? to.matched : []
    for (let index = matched.length - 1; index >= 0; index -= 1) {
        const component = matched[index]?.components?.default
        if (!component || typeof component !== 'object') continue
        const name = (component as { name?: unknown }).name
        if (typeof name === 'string' && name) return name
    }

    return typeof to.name === 'string' ? to.name : undefined
}

export const useTabStore = defineStore(
    'tabs',
    () => {
        const tabs = ref<TabItem[]>([])
        const activeTabId = ref<string | null>(null)
        const cachedTabIds = ref<string[]>([])
        const cachedComponentNames = ref<string[]>([])
        const maximizedTabId = ref<string | null>(null)

        function addOrActivate(to: RouteLocationNormalized | RouteLocationResolvedGeneric) {
            const id = hashId(to)
            const componentName = componentNameFor(to)
            const existing = tabs.value.find((t) => t.id === id)
            if (!existing) {
                tabs.value.push({
                    id,
                    path: to.path,
                    fullPath: to.fullPath,
                    title: (to.meta?.title as string | undefined) ?? (typeof to.name === 'string' ? to.name : '未命名'),
                    titleKey: to.meta?.titleKey as string | undefined,
                    icon: to.meta?.icon as string | undefined,
                    affix: to.meta?.affix === true,
                    pinned: false,
                    closable: to.meta?.affix !== true,
                    scrollTop: 0,
                    query: { ...(to.query as Record<string, unknown>) },
                    params: { ...(to.params as Record<string, unknown>) },
                    componentName,
                    keepAlive: to.meta?.keepAlive !== false,
                    refreshVersion: 0,
                })
            } else {
                existing.componentName = existing.componentName ?? componentName
                existing.keepAlive = to.meta?.keepAlive !== false
                existing.titleKey = existing.titleKey ?? (to.meta?.titleKey as string | undefined)
                if (to.meta?.title) existing.title = to.meta.title as string
            }
            activeTabId.value = id
            // Keep the historic id list for consumers that evict a specific
            // tab, and expose component names for Vue KeepAlive.
            if (to.meta?.keepAlive !== false && !cachedTabIds.value.includes(id)) {
                cachedTabIds.value.push(id)
            }
            if (to.meta?.keepAlive !== false && componentName && !cachedComponentNames.value.includes(componentName)) {
                cachedComponentNames.value.push(componentName)
            }
        }

        function closeTab(id: string): void {
            const idx = tabs.value.findIndex((t) => t.id === id)
            if (idx === -1) return
            const tab = tabs.value[idx]
            if (tab.affix) return
            tabs.value.splice(idx, 1)
            cachedTabIds.value = cachedTabIds.value.filter((c) => c !== id)
            if (tab.componentName && !tabs.value.some((t) => t.componentName === tab.componentName)) {
                cachedComponentNames.value = cachedComponentNames.value.filter((c) => c !== tab.componentName)
            }
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
            cachedComponentNames.value = cachedComponentNames.value.filter(
                (c) => keep.some((t) => t.componentName === c),
            )
        }

        function closeAll(): void {
            tabs.value = tabs.value.filter((t) => t.affix)
            cachedTabIds.value = tabs.value
                .filter((tab) => tab.keepAlive !== false)
                .map((tab) => tab.id)
            cachedComponentNames.value = tabs.value
                .filter((tab) => tab.keepAlive !== false)
                .map((t) => t.componentName)
                .filter((name): name is string => Boolean(name))
            if (!tabs.value.some((tab) => tab.id === activeTabId.value)) {
                activeTabId.value = tabs.value[tabs.value.length - 1]?.id ?? null
            }
        }

        function refreshTab(id: string): void {
            const tab = tabs.value.find((item) => item.id === id)
            if (tab) tab.refreshVersion = (tab.refreshVersion ?? 0) + 1
            cachedTabIds.value = cachedTabIds.value.filter((c) => c !== id)
            if (tab?.componentName && !tabs.value.some((item) => item.id !== id && item.componentName === tab.componentName)) {
                cachedComponentNames.value = cachedComponentNames.value.filter((c) => c !== tab.componentName)
            }
            nextTick(() => {
                if (id === activeTabId.value) {
                    cachedTabIds.value.push(id)
                    if (tab?.componentName && !cachedComponentNames.value.includes(tab.componentName)) {
                        cachedComponentNames.value.push(tab.componentName)
                    }
                }
            })
        }

        function pinTab(id: string): void {
            const t = tabs.value.find((x) => x.id === id)
            if (t) t.pinned = !t.pinned
        }

        function activate(id: string): void {
            activeTabId.value = id
            const tab = tabs.value.find((item) => item.id === id)
            // Persisted tab records from pre-keepAlive versions do not have
            // this field. Treat an absent value as the historical default.
            if (!tab || tab.keepAlive === false) return
            if (!cachedTabIds.value.includes(id)) cachedTabIds.value.push(id)
            if (tab.componentName && !cachedComponentNames.value.includes(tab.componentName)) {
                cachedComponentNames.value.push(tab.componentName)
            }
        }

        function maximizeTab(id: string | null): void {
            maximizedTabId.value = id
        }

        function setScrollTop(id: string, scrollTop: number): void {
            const t = tabs.value.find((x) => x.id === id)
            if (t) t.scrollTop = scrollTop
        }

        return {
            tabs, activeTabId, cachedTabIds, cachedComponentNames, maximizedTabId,
            addOrActivate, closeTab, closeOthers, closeAll,
            refreshTab, pinTab, activate, maximizeTab, setScrollTop,
        }
    },
    {
        persist: {
            pick: ['tabs', 'cachedTabIds', 'cachedComponentNames'],
            key: 'framework-tabs',
            storage: localStorage,
        },
    },
)
