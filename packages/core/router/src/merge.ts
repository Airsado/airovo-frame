import type { MenuItem, MenusMod } from './routeTypes'

function dedupByUrl(items: MenuItem[]): MenuItem[] {
    const seen = new Set<string>()
    const out: MenuItem[] = []
    for (const item of items) {
        if (seen.has(item.url)) continue
        seen.add(item.url)
        out.push(item)
    }
    return out
}

/**
 * Merge menu sources per the active `menusMod`:
 *  - `frontend`: use only the local (core + modules) menus
 *  - `backend`: use only the dynamic menus from the API
 *  - `mixed`: combine, deduping by `url` with local taking priority
 */
export function mergeMenus(
    local: MenuItem[],
    dynamic: MenuItem[],
    mod: MenusMod,
): MenuItem[] {
    if (mod === 'backend') return dynamic
    if (mod === 'frontend') return local
    return dedupByUrl([...local, ...dynamic])
}
