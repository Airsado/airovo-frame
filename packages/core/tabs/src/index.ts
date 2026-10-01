/**
 * @airovo/tabs — vben-style multi-tab system.
 *
 * Exports:
 *   - BasicTabBar          — the strip component (slot it into your layout)
 *   - useCachedTabNames    — pair with <KeepAlive :include="..."> in App.vue
 *   - installTabs(app, { router, defaultTabPath? })
 *
 * The tab state itself (`useTabStore`, `TabItem`) lives in
 * `@airovo/stores/tabs` — every framework store is centralised there
 * to keep the import surface predictable. This package only owns the
 * UI + the router wiring.
 */
import { computed } from 'vue'
import type { App } from 'vue'
import type { Router } from 'vue-router'
import { useTabStore } from '@airovo/stores/tabs'
import BasicTabBar from './components/BasicTabBar.vue'

export { useTabStore } from '@airovo/stores/tabs'
export type { TabItem } from '@airovo/stores/tabs'
export { BasicTabBar }

export function useCachedTabNames() {
    const store = useTabStore()
    return computed(() => store.cachedComponentNames)
}

export interface InstallTabsOptions {
    /** The Vue Router instance. */
    router: Router
    /**
     * If set, the tab for this path is added once on first install
     * (e.g. '/dashboard') so the strip isn't empty on first load.
     */
    defaultTabPath?: string
}

/**
 * Install the tabs system: registers BasicTabBar as a global
 * component and wires router.afterEach to keep the tab list in sync.
 */
export function installTabs(app: App, options: InstallTabsOptions): { tabStore: ReturnType<typeof useTabStore> } {
    const store = useTabStore()

    // BasicLayout consumes the tab strip through its named slot. Registering
    // it globally keeps the framework install path useful for apps that use
    // the layout without importing the component into every root.
    app.component('BasicTabBar', BasicTabBar)

    // Seed the default tab on first install (so the strip isn't empty
    // before any navigation happens).
    if (options.defaultTabPath && store.tabs.length === 0) {
        const resolved = options.router.resolve(options.defaultTabPath)
        if (resolved) store.addOrActivate(resolved)
    }

    // Auto-track every navigation.
    options.router.afterEach((to) => {
        // Skip tabs that opt out via meta.hideInTab.
        if (to.meta?.hideInTab === true || to.meta?.ignoreLayout === true) return
        store.addOrActivate(to)
    })

    return { tabStore: store }
}
