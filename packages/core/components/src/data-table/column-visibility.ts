import type { DataTableColumn, DataTableColumnVisibility } from './types'

export function normalizeDataTableColumnVisibility(
    columns: readonly DataTableColumn[],
    value: DataTableColumnVisibility = {},
): DataTableColumnVisibility {
    const configurable = columns.filter((column) => column.id !== 'selection' && !column.hidden)
    const next = Object.fromEntries(configurable.map((column) => {
        const id = column.id ?? column.key
        return [id, value[id] !== false]
    })) as DataTableColumnVisibility
    const visibleIds = Object.entries(next).filter(([, visible]) => visible).map(([id]) => id)
    if (configurable.length > 0 && visibleIds.length === 0) {
        const firstId = configurable[0]!.id ?? configurable[0]!.key
        next[firstId] = true
    }
    return next
}
