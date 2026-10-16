import type { DataTableRowKey } from './types'

/**
 * Resolve and validate the stable key used by table rows and card renderers.
 *
 * Keeping this check in one place prevents the table and its responsive card
 * view from silently falling back to array indexes when data is reordered.
 */
export function resolveDataTableRowKey(value: unknown): DataTableRowKey {
    if ((typeof value === 'string' && value.length > 0) || (typeof value === 'number' && Number.isFinite(value))) {
        return value
    }
    throw new Error('DataTable requires a stable row key. Provide rowKey or a rowKey function for every row.')
}

export function assertUniqueDataTableRowKeys(keys: DataTableRowKey[]): void {
    // Both table renderers use String(key) for Vue's DOM key. Treat numeric
    // and string values with the same rendered identity as duplicates too;
    // otherwise `1` and `'1'` would pass this check and collide in the DOM.
    const duplicates = new Set<string>()
    const seen = new Set<string>()
    for (const key of keys) {
        const renderedKey = String(key)
        if (seen.has(renderedKey)) duplicates.add(renderedKey)
        seen.add(renderedKey)
    }
    if (duplicates.size > 0) {
        throw new Error(`DataTable row keys must be unique: ${[...duplicates].join(', ')}`)
    }
}
