import type { VNode } from 'vue'

/** Extracts readable text from the common VNode shapes used by table cell slots. */
export function getTruncatedText(value: unknown): string {
    if (value === null || value === undefined || typeof value === 'boolean') return ''
    if (typeof value === 'string' || typeof value === 'number') return String(value)
    if (Array.isArray(value)) return value.map(getTruncatedText).join('')
    if (typeof value !== 'object') return ''

    const vnode = value as VNode
    if (typeof vnode.children === 'string' || typeof vnode.children === 'number') return String(vnode.children)
    if (Array.isArray(vnode.children)) return vnode.children.map(getTruncatedText).join('')
    return ''
}
