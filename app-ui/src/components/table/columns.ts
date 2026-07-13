/**
 * AirovoColumn — type-safe vxe-table column descriptor.
 *
 * Mirrors the common vxe-table column options we use in the demo;
 * the rest can be added as `& Record<string, any>` escape hatch.
 */
import type { VxeColumnPropTypes } from 'vxe-table'

export interface AirovoColumn {
    field: string
    title: string
    width?: number
    minWidth?: number
    /** Tailwind-friendly alignment; vxe-table supports more. */
    align?: 'left' | 'center' | 'right'
    fixed?: 'left' | 'right'
    /** Sortable, filterable, etc. */
    sortable?: boolean
    filterable?: boolean
    /** Custom cell renderer (slot name). */
    slot?: string
    /** Optional formatter — for non-slot custom display. */
    formatter?: VxeColumnPropTypes.Formatter
    /** Extra vxe-table column config. */
    [key: string]: any
}
