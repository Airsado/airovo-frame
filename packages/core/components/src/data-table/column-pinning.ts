import type { DataTableColumnPinning, DataTablePinSide } from './types'

export interface DataTablePinningColumn {
    id: string
    width: number
}

export interface ResolvedDataTablePinnedColumn {
    id: string
    side: DataTablePinSide
    offset: number
    edge: boolean
}

/**
 * Resolve sticky offsets from the current DOM order. Hidden columns should be
 * omitted by the caller so they do not leave gaps in the fixed region.
 */
export function resolveDataTableColumnPinning(
    columns: readonly DataTablePinningColumn[],
    pinning: DataTableColumnPinning = {},
): Map<string, ResolvedDataTablePinnedColumn> {
    const resolved = new Map<string, ResolvedDataTablePinnedColumn>()
    const left = columns.filter((column) => pinning[column.id] === 'left')
    const right = columns.filter((column) => pinning[column.id] === 'right')

    let leftOffset = 0
    left.forEach((column, index) => {
        resolved.set(column.id, {
            id: column.id,
            side: 'left',
            offset: leftOffset,
            edge: index === left.length - 1,
        })
        leftOffset += column.width
    })

    let rightOffset = 0
    right.slice().reverse().forEach((column, index) => {
        resolved.set(column.id, {
            id: column.id,
            side: 'right',
            offset: rightOffset,
            edge: index === right.length - 1,
        })
        rightOffset += column.width
    })

    return resolved
}

export function parseStoredDataTableColumnPinning(value: string | null): DataTableColumnPinning {
    if (!value) return {}
    try {
        const parsed: unknown = JSON.parse(value)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
        return Object.fromEntries(
            Object.entries(parsed).filter((entry): entry is [string, DataTableColumnPinning[string]] =>
                entry[1] === 'left' || entry[1] === 'right'),
        )
    } catch {
        return {}
    }
}
