/** A row accepted by DataTable and useDataTable. */
export type DataTableRow = Record<string, unknown>

/** Keys are deliberately limited to values that can safely be used in DOM keys. */
export type DataTableRowKey = string | number

/** Selection scope used by the built-in selection controller. */
export type DataTableSelectionScope = 'page' | 'persistent'

export interface DataTableColumn<T extends DataTableRow = DataTableRow> {
    key: string
    title: string
    /** Stable id used by column visibility and persisted table settings. */
    id?: string
    sortable?: boolean
    /** Allow the new-api column-header menu to hide this column. */
    hideable?: boolean
    align?: 'left' | 'center' | 'right'
    width?: string
    minWidth?: string
    maxWidth?: string
    /** Enables the header resize handle for this column. */
    resizable?: boolean
    minSize?: number
    maxSize?: number
    /** Hide the column while retaining it in the column configuration. */
    hidden?: boolean
    /** Prefer this column as the generic card title. */
    mobileTitle?: boolean
    /** Render this column beside the generic card title as a badge/status. */
    mobileBadge?: boolean
    /** Hide this column from the generic card renderer. */
    mobileHidden?: boolean
    /** Order this column within generic card fields. */
    mobileOrder?: number
    /** Read a value from a row (useful for nested or computed values). */
    value?: (row: T) => unknown
    /** Format the displayed value without changing the value exposed to slots. */
    formatter?: (value: unknown, row: T, index: number) => unknown
}

export type DataTableColumnVisibility = Record<string, boolean>

export type DataTablePinSide = 'left' | 'right'

/** Pinning state keyed by the stable column id (or column key). */
export type DataTableColumnPinning = Record<string, DataTablePinSide>

export interface DataTableFilterOption {
    label: string
    value: string
    count?: number
    disabled?: boolean
}

export interface DataTableFilterGroup {
    key: string
    title: string
    options: DataTableFilterOption[]
    singleSelect?: boolean
}

export type DataTableFilterValue = string | string[] | undefined

export interface DataTableRowAction<T extends DataTableRow = DataTableRow> {
    key: string
    label: string
    icon?: string
    /** Render an icon-only button; provide ariaLabel or label is used as fallback. */
    iconOnly?: boolean
    ariaLabel?: string
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    permission?: string | string[]
    visible?: boolean | ((row: T) => boolean)
    disabled?: boolean | ((row: T) => boolean)
    loading?: boolean | ((row: T) => boolean)
    onSelect?: (row: T) => void
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

// Static table types live in their own module to keep the server-side table
// contract focused, while remaining available from the established public
// `data-table/types` entry point.
export type {
    StaticDataTableBaseProps,
    StaticDataTableChildrenProps,
    StaticDataTableColumn,
    StaticDataTableDataProps,
    StaticDataTableProps,
    StaticDataTableRowKey,
} from './static-data-table-types'
