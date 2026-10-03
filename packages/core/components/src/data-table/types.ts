/** A row accepted by DataTable and useDataTable. */
export type DataTableRow = Record<string, unknown>

/** Keys are deliberately limited to values that can safely be used in DOM keys. */
export type DataTableRowKey = string | number

/** Selection scope used by the built-in selection controller. */
export type DataTableSelectionScope = 'page' | 'persistent'

export interface DataTableColumn<T extends DataTableRow = DataTableRow> {
    key: string
    title: string
    sortable?: boolean
    align?: 'left' | 'center' | 'right'
    width?: string
    /** Hide the column while retaining it in the column configuration. */
    hidden?: boolean
    /** Read a value from a row (useful for nested or computed values). */
    value?: (row: T) => unknown
    /** Format the displayed value without changing the value exposed to slots. */
    formatter?: (value: unknown, row: T, index: number) => unknown
}

export interface DataTableSort {
    key: string
    direction: 'asc' | 'desc'
}

export interface DataTableQuery {
    page: number
    pageSize: number
    sort?: DataTableSort
    filters?: Record<string, unknown>
}

export interface DataTableResult<T extends DataTableRow = DataTableRow> {
    data: T[]
    total?: number
    page?: number
    pageSize?: number
}

export interface DataTableFetchContext {
    signal: AbortSignal
}

export type DataTableFetcher<T extends DataTableRow = DataTableRow> = (
    query: DataTableQuery,
    context: DataTableFetchContext,
) => Promise<DataTableResult<T> | T[]>
