/**
 * TabItem — a single open tab. \`id\` is the stable identity (path +
 * params hash); \`affix\` means the tab can't be closed; \`pinned\` is
 * the user-pinned state (separate from \`affix\`).
 */
export interface TabItem {
    id: string
    path: string
    fullPath: string
    title: string
    icon?: string
    affix: boolean
    pinned: boolean
    closable: boolean
    scrollTop: number
    params?: Record<string, any>
    query?: Record<string, any>
}
