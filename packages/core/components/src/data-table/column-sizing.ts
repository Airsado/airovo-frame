import type { DataTableColumn } from './types'

/** Normalize persisted widths against the current column schema and bounds. */
export function normalizeDataTableColumnSizing(
    columns: readonly DataTableColumn[],
    value: Record<string, number> = {},
): Record<string, number> {
    const next: Record<string, number> = {}
    for (const column of columns) {
        const id = column.id ?? column.key
        const raw = value[id]
        if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) continue
        const min = column.minSize ?? 1
        const max = column.maxSize
        next[id] = max === undefined ? Math.max(min, raw) : Math.min(max, Math.max(min, raw))
    }
    return next
}
