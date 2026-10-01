import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { SidebarMenuItemType } from './types'

export function activeMenuPath(route: Pick<RouteLocationNormalizedLoaded, 'path' | 'meta'>): string {
    const activeMenu = (route.meta as { activeMenu?: unknown }).activeMenu
    const path = typeof activeMenu === 'string' && activeMenu ? activeMenu : route.path
    return normalizeMenuPath(path)
}

/** Keep menu paths comparable across history modes, base URLs and redirects. */
export function normalizeMenuPath(path: string): string {
    const clean = path.split(/[?#]/, 1)[0] || '/'
    if (clean === '/') return '/'
    return `/${clean.replace(/^\/+|\/+$/g, '')}`
}

export function isActiveMenu(item: SidebarMenuItemType, path: string): boolean {
    return normalizeMenuPath(item.url) === normalizeMenuPath(path)
}

export function containsActiveMenu(item: SidebarMenuItemType, path: string): boolean {
    return isActiveMenu(item, path)
        || item.children?.some((child) => containsActiveMenu(child, path)) === true
}
