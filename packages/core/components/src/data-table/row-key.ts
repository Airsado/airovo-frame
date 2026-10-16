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
    const duplicates = new Set<DataTableRowKey>()
    const seen = new Set<DataTableRowKey>()
    for (const key of keys) {
        if (seen.has(key)) duplicates.add(key)
        seen.add(key)
    }
    if (duplicates.size > 0) {
        throw new Error(`DataTable row keys must be unique: ${[...duplicates].join(', ')}`)
    }
}
