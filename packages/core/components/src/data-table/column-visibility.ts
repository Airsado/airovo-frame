import type { DataTableColumn, DataTableColumnVisibility } from './types'

export function normalizeDataTableColumnVisibility(
    columns: readonly DataTableColumn[],
    value: DataTableColumnVisibility = {},
): DataTableColumnVisibility {
    // Keep hidden-by-default columns in the normalized state so the View
    // menu can still expose them and restore them.  Their default visibility
    // is derived from `column.hidden`, while an explicit persisted/controlled
    // value always wins.
    const dataColumns = columns.filter((column) => column.id !== 'selection')
    const configurable = dataColumns.filter((column) => column.hideable !== false)
    const next = Object.fromEntries(dataColumns.map((column) => {
        const id = column.id ?? column.key
        const explicit = value[id]
        const resolved = typeof explicit === 'boolean' ? explicit : !column.hidden
        return [id, column.hideable === false ? true : resolved]
    })) as DataTableColumnVisibility
    const visibleIds = Object.entries(next).filter(([, visible]) => visible).map(([id]) => id)
    if (configurable.length > 0 && visibleIds.length === 0) {
        const firstId = configurable[0]!.id ?? configurable[0]!.key
        next[firstId] = true
    }
    return next
}
