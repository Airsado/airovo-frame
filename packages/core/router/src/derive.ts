import type { AgnosticRouteRecord, MenuItem } from './routeTypes'

/**
 * Resolve a child route's `path` against its parent URL. Children
 * declared with leading slashes are absolute; otherwise they nest
 * under the parent (with a `/` separator inserted if missing).
 */
function joinUrl(parentUrl: string, childPath: string): string {
    if (childPath.startsWith('/')) return childPath
    if (!parentUrl || parentUrl === '/') return '/' + childPath
    const trimmed = parentUrl.replace(/\/+$/, '')
    return trimmed ? `${trimmed}/${childPath}` : '/' + childPath
}

/**
 * Adapt a single `AgnosticRouteRecord` into a `MenuItem`. Returns `null`
 * when the route should not appear in the sidebar (no `meta.title`,
 * or `meta.hideInMenu` is true). Children are recursed into.
 */
function routeToMenuItem(
    route: AgnosticRouteRecord,
    parentUrl = '',
): MenuItem | null {
    if (route.meta?.hideInMenu) return null
    const title = route.meta?.title
    if (!title) return null

    const ownPath = route.path ?? ''
    const url = ownPath ? joinUrl(parentUrl, ownPath) : parentUrl

    const children: MenuItem[] = (route.children ?? [])
        .map((child) => routeToMenuItem(child, url))
        .filter((c): c is MenuItem => c !== null)

    return {
        title,
        url,
        icon: route.meta?.icon,
        isActive: route.meta?.active,
        children: children.length > 0 ? children : undefined,
    }
}

/**
 * Walk a flat array of `AgnosticRouteRecord` and produce a sidebar menu
 * tree. Routes are returned in declaration order.
 */
export function deriveMenus(routes: AgnosticRouteRecord[]): MenuItem[] {
    const items: MenuItem[] = []
    for (const route of routes) {
        const item = routeToMenuItem(route, '')
        if (item) items.push(item)
    }
    return items
}
