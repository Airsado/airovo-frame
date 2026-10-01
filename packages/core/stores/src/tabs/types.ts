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
    /** i18n key used to recalculate the label after locale changes. */
    titleKey?: string
    icon?: string
    affix: boolean
    pinned: boolean
    closable: boolean
    scrollTop: number
    params?: Record<string, unknown>
    query?: Record<string, unknown>
    /** Vue component name used by `<KeepAlive :include>`. */
    componentName?: string
    /** Whether this tab participates in KeepAlive caching. */
    keepAlive: boolean
    /** Incrementing key used to remount a refreshed tab. */
    refreshVersion?: number
}
