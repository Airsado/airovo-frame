import type { HTMLAttributes, VNodeChild } from 'vue'

export type StaticDataTableRowKey = string | number

export type StaticDataTableColumn<TData = unknown> = {
    id: string
    header: VNodeChild
    className?: string
    cellClassName?: string | ((row: TData, index: number) => string | undefined)
    cell?: (row: TData, index: number) => VNodeChild
}

export interface StaticDataTableBaseProps {
    /** Additional classes for the bordered outer surface. */
    className?: string
    /** Vue-friendly alias for className. */
    class?: string
    /** Additional classes for the table element. */
    tableClassName?: string
    /** Vue-friendly alias for tableClassName. */
    tableClass?: string
    /** Attributes forwarded to the outer surface. */
    containerProps?: Omit<HTMLAttributes, 'class'> & Record<string, unknown>
    /** Attributes forwarded to the table element. */
    tableProps?: Record<string, unknown>
}

export interface StaticDataTableDataProps<TData = unknown> extends StaticDataTableBaseProps {
    columns: StaticDataTableColumn<TData>[]
    data: TData[]
    getRowKey?: (row: TData, index: number) => StaticDataTableRowKey
    getRowClassName?: (row: TData, index: number) => string | undefined
    renderRow?: (row: TData, index: number) => VNodeChild
    empty?: boolean
    emptyContent?: VNodeChild
    emptyClassName?: string
    headerRowClassName?: string
}

export interface StaticDataTableChildrenProps extends StaticDataTableBaseProps {
    columns?: never
    data?: never
}

export type StaticDataTableProps<TData = unknown> =
    | StaticDataTableDataProps<TData>
    | StaticDataTableChildrenProps
