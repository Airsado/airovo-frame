import { groupSidebarMenus } from '../../sidebar/menuGroups'
import type { SidebarMenuItemType } from '../../sidebar/types'

export interface SearchMenuItem {
    id: string
    label: string
    url: string
    icon?: string
    breadcrumb: string[]
    external?: boolean
    disabled?: boolean
}

export interface SearchMenuGroup {
    id: string
    label: string
    items: SearchMenuItem[]
}

const searchMetadata = Symbol('search-menu-metadata')
type SearchMenuSource = SidebarMenuItemType & {
    [searchMetadata]: { breadcrumb: string[]; disabled: boolean }
}

/** Index the visible sidebar tree without reading routes or changing app state. */
export function buildSearchMenuGroups(
    menus: SidebarMenuItemType[],
    label: (key: string | undefined, fallback: string) => string,
): SearchMenuGroup[] {
    function prepare(
        items: SidebarMenuItemType[],
        breadcrumb: string[] = [],
        parentDisabled = false,
    ): SearchMenuSource[] {
        return items.map(item => {
            const disabled = parentDisabled || item.disabled === true
            const sectionContainer = !item.group && item.children?.some(child => child.group)
            const childBreadcrumb = sectionContainer
                ? breadcrumb
                : [...breadcrumb, label(item.titleKey, item.title)]
            return {
                ...item,
                [searchMetadata]: { breadcrumb, disabled },
                ...(item.children ? {
                    children: prepare(item.children, childBreadcrumb, disabled),
                } : {}),
            }
        })
    }

    // Section containers are not visible parent links. Preserve their disabled
    // state while retaining breadcrumbs only for actual parent navigation.
    const groups = groupSidebarMenus(prepare(menus))
    const seenUrls = new Set<string>()

    return groups.flatMap(group => {
        const items: SearchMenuItem[] = []
        function collect(nodes: SidebarMenuItemType[]): void {
            for (const node of nodes) {
                if (node.children?.length) {
                    collect(node.children)
                    continue
                }
                const url = node.url.trim()
                if (!url || url === '#' || seenUrls.has(url)) continue
                seenUrls.add(url)
                const metadata = (node as SearchMenuSource)[searchMetadata]
                items.push({
                    id: url,
                    label: label(node.titleKey, node.title),
                    url,
                    icon: node.icon,
                    breadcrumb: [...metadata.breadcrumb],
                    ...(node.external ? { external: true } : {}),
                    ...(metadata.disabled ? { disabled: true } : {}),
                })
            }
        }
        collect(group.items)
        return items.length ? [{
            id: group.titleKey ?? group.title,
            label: label(group.titleKey, group.title),
            items,
        }] : []
    })
}
