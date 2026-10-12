import type { SidebarMenuItemType } from './types'

export interface SidebarMenuGroup {
    title: string
    titleKey?: string
    items: SidebarMenuItemType[]
}

/** Invalid/missing values are unordered; zero and negative orders are valid. */
function menuOrder(menu: SidebarMenuItemType): number {
    const value = menu.order ?? menu.meta?.order
    return typeof value === 'number' && Number.isFinite(value) ? value : Infinity
}

function compareOrder(left: number, right: number): number {
    return left === right ? 0 : left < right ? -1 : 1
}

/** Copy each sibling list so sorting never mutates router or application state. */
function sortMenuTree(menus: SidebarMenuItemType[]): SidebarMenuItemType[] {
    return menus.map(menu => ({
        ...menu,
        ...(menu.children ? { children: sortMenuTree(menu.children) } : {}),
    })).sort((left, right) => compareOrder(menuOrder(left), menuOrder(right)))
}

export function groupSidebarMenus(menus: SidebarMenuItemType[]): SidebarMenuGroup[] {
    const groups = new Map<string, SidebarMenuGroup>()

    function add(menu: SidebarMenuItemType, fallback: { title: string; titleKey?: string } = { title: '导航' }): void {
        // Route containers with grouped children become sections; real parent
        // entries without grouped children keep their collapsible submenu.
        if (menu.children?.length && !menu.group && menu.children.some(child => child.group)) {
            for (const child of menu.children) add(child, { title: menu.title, titleKey: menu.titleKey })
            return
        }
        const title = menu.group ?? fallback.title
        const titleKey = menu.groupKey ?? fallback.titleKey
        const id = titleKey ?? title
        const group = groups.get(id) ?? { title, titleKey, items: [] }
        group.items.push(menu)
        groups.set(id, group)
    }

    for (const menu of menus) add(menu)
    const ordered = [...groups.values()].map(group => ({ ...group, items: sortMenuTree(group.items) }))
    // A group's earliest root entry determines its order. Child orders only
    // arrange siblings and cannot unexpectedly move the enclosing section.
    return ordered.sort((left, right) => compareOrder(menuOrder(left.items[0]!), menuOrder(right.items[0]!)))
}
