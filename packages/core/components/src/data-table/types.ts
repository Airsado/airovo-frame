export interface DataTableColumn {
    key: string
    title: string
    sortable?: boolean
    align?: 'left' | 'center' | 'right'
    width?: string
    value?: (row: Record<string, unknown>) => unknown
}
