import type { DataTableColumn, DataTableColumnVisibility } from './types'

export function normalizeDataTableColumnVisibility(
    columns: readonly DataTableColumn[],
    value: DataTableColumnVisibility = {},
): DataTableColumnVisibility {
    const visibleColumns = columns.filter((column) => column.id !== 'selection' && !column.hidden)
    const configurable = visibleColumns.filter((column) => column.hideable !== false)
    const next = Object.fromEntries(visibleColumns.map((column) => {
        const id = column.id ?? column.key
        return [id, column.hideable === false ? true : value[id] !== false]
    })) as DataTableColumnVisibility
    const visibleIds = Object.entries(next).filter(([, visible]) => visible).map(([id]) => id)
    if (configurable.length > 0 && visibleIds.length === 0) {
        const firstId = configurable[0]!.id ?? configurable[0]!.key
        next[firstId] = true
    }
    return next
}
