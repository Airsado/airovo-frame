/**
 * TabItem — a single open tab. \`id\` is the stable fullPath identity;
 * \`affix\` is route-fixed and \`pinned\` is user-fixed. Both are protected
 * from individual and bulk close actions.
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
    /** Applications may protect a normal tab without moving it to a fixed group. */
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
