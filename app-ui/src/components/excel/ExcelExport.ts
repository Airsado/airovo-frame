/**
 * ExcelExport — helper that takes columns + data and downloads an
 * .xlsx file via SheetJS.
 * TODO(v5): implement with `xlsx` (`writeFile`).
 */
export interface ExcelColumnDef {
    field: string
    title: string
    width?: number
    formatter?: (row: any) => any
}

export async function exportExcel(
    columns: ExcelColumnDef[],
    data: Record<string, any>[],
    filename = 'export.xlsx',
): Promise<void> {
    // TODO(v5): use xlsx to build a worksheet and write to file
    void columns
    void data
    void filename
    throw new Error('ExcelExport not yet implemented — install `xlsx` and fill in')
}
