<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@airovo/shared/icons'
import { Skeleton } from '@airovo/uikit-shadcnui'
import { normalizeDataTableColumnPinning, parseStoredDataTableColumnPinning, resolveDataTableColumnPinning, type ResolvedDataTablePinnedColumn } from './column-pinning'
import { normalizeDataTableColumnSizing } from './column-sizing'
import type { DataTableColumn, DataTableColumnPinning, DataTableColumnVisibility, DataTableRow, DataTableRowKey, DataTableSelectionScope, DataTableSort } from './types'
import DataTablePagination from './DataTablePagination.vue'

defineOptions({ name: 'DataTable' })

const props = withDefaults(defineProps<{
    columns: DataTableColumn[]
    data: DataTableRow[]
    rowKey?: string | ((row: DataTableRow) => DataTableRowKey)
    loading?: boolean
    error?: unknown
    emptyText?: string
    errorText?: string
    caption?: string
    selectable?: boolean
    selectedKeys?: DataTableRowKey[]
    /** Keep selection limited to the currently rendered page by default. */
    selectionScope?: DataTableSelectionScope
    /** Enables server-side sorting and emits sort-change without reordering rows locally. */
    manualSort?: boolean
    sort?: DataTableSort
    pagination?: boolean
    page?: number
    pageSize?: number
    total?: number
    pageSizeOptions?: number[]
    /** Fixed table viewport height, expressed as CSS text or pixels. */
    height?: string | number
    /** Maximum table viewport height, expressed as CSS text or pixels. */
    maxHeight?: string | number
    /** Controlled column visibility; omitted columns follow their hidden flag. */
    columnVisibility?: DataTableColumnVisibility
    /** Controlled fixed-column state keyed by column id/key. */
    columnPinning?: DataTableColumnPinning
    /** Optional localStorage key for fixed-column state. */
    columnPinningStorageKey?: string
    /** Render the table on desktop and the mobile slot below the sm breakpoint. */
    mobileCards?: boolean
    /** Controlled pixel widths keyed by column id/key. */
    columnSizing?: Record<string, number>
    /** Optional localStorage key for column widths. */
    columnSizingStorageKey?: string
}>(), {
    rowKey: 'id',
    loading: false,
    selectable: false,
    selectionScope: 'page',
    manualSort: false,
    pagination: false,
    page: 1,
    pageSize: 20,
    pageSizeOptions: () => [10, 20, 50, 100],
    mobileCards: false,
})

const emit = defineEmits<{
    (event: 'update:selectedKeys', value: DataTableRowKey[]): void
    (event: 'selection-change', value: DataTableRowKey[]): void
    (event: 'sort-change', value?: DataTableSort): void
    (event: 'update:sort', value?: DataTableSort): void
    (event: 'update:page', value: number): void
    (event: 'update:pageSize', value: number): void
    (event: 'update:columnVisibility', value: DataTableColumnVisibility): void
    (event: 'update:columnSizing', value: Record<string, number>): void
    (event: 'update:columnPinning', value: DataTableColumnPinning): void
    (event: 'retry'): void
}>()

const { t } = useI18n({ useScope: 'global' })
const slots = useSlots()
const internalSort = ref<DataTableSort>()
const internalSelectedKeys = ref<DataTableRowKey[]>([])
const internalColumnSizing = ref<Record<string, number>>(normalizeDataTableColumnSizing(props.columns, props.columnSizing))
const resizing = ref<{ id: string; startX: number; startWidth: number; min: number; max?: number }>()
const internalColumnPinning = ref<DataTableColumnPinning>({})
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function columnId(column: DataTableColumn): string {
    return column.id ?? column.key
}

const visibleColumns = computed(() => props.columns.filter((column) => {
    const visibility = props.columnVisibility?.[columnId(column)]
    return visibility === undefined ? !column.hidden : visibility
}))
const currentColumnSizing = computed(() => props.columnSizing ?? internalColumnSizing.value)
const columnSize = (column: DataTableColumn): number | undefined => {
    const value = currentColumnSizing.value[columnId(column)]
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
const columnStyle = (column: DataTableColumn): Record<string, string> => {
    const size = columnSize(column)
    return {
        width: size === undefined ? (column.width ?? '') : `${size}px`,
        minWidth: column.minWidth ?? (column.minSize ? `${column.minSize}px` : ''),
        maxWidth: column.maxWidth ?? (column.maxSize ? `${column.maxSize}px` : ''),
    }
}
const currentColumnPinning = computed(() => normalizeDataTableColumnPinning(pinningColumns.value, props.columnPinning ?? internalColumnPinning.value))
const currentSort = computed(() => props.sort ?? internalSort.value)
const hasToolbar = computed(() => Boolean(slots.toolbar))
const hasActions = computed(() => Boolean(slots.actions || slots.action))
const tableViewportStyle = computed(() => ({
    height: toCssSize(props.height),
    maxHeight: toCssSize(props.maxHeight),
}))
const tableViewportClass = computed(() => props.height !== undefined || props.maxHeight !== undefined
    ? 'overflow-y-auto'
    : 'overflow-y-hidden')
const selected = computed(() => {
    const keys = props.selectedKeys ?? internalSelectedKeys.value
    if (props.selectionScope === 'persistent') return keys
    return keys.filter((key) => visibleKeySet.value.has(key))
})
const visibleRows = computed(() => {
    if (props.manualSort || !currentSort.value) return props.data
    const column = props.columns.find((item) => item.key === currentSort.value?.key)
    if (!column) return props.data
    const direction = currentSort.value.direction === 'asc' ? 1 : -1
    return [...props.data].sort((left, right) => direction * collator.compare(
        String(cellValue(left, column) ?? ''),
        String(cellValue(right, column) ?? ''),
    ))
})
const totalRows = computed(() => props.total ?? props.data.length)
const visibleRowKeys = computed(() => {
    const keys = visibleRows.value.map((row) => rowKeyOf(row))
    const duplicates = new Set<DataTableRowKey>()
    const seen = new Set<DataTableRowKey>()
    for (const key of keys) {
        if (seen.has(key)) duplicates.add(key)
        seen.add(key)
    }
    if (duplicates.size > 0) {
        throw new Error(`DataTable row keys must be unique: ${[...duplicates].join(', ')}`)
    }
    return keys
})
const visibleKeySet = computed(() => new Set(visibleRowKeys.value))
const allVisibleSelected = computed(() => {
    if (!props.selectable || visibleRows.value.length === 0) return false
    return visibleRowKeys.value.every((key) => selected.value.includes(key))
})
const someVisibleSelected = computed(() => {
    if (!props.selectable || visibleRows.value.length === 0) return false
    return visibleRowKeys.value.some((key) => selected.value.includes(key))
})
const pinningColumns = computed(() => [
    ...(props.selectable ? [{ id: 'selection', width: 40 }] : []),
    ...visibleColumns.value.map((column) => ({ id: columnId(column), width: columnWidth(column) })),
    ...(hasActions.value ? [{ id: 'actions', width: 100 }] : []),
])
const resolvedPinnedColumns = computed(() => resolveDataTableColumnPinning(pinningColumns.value, currentColumnPinning.value))
const hasPinnedColumns = computed(() => resolvedPinnedColumns.value.size > 0)

function rowKeyOf(row: DataTableRow): DataTableRowKey {
    const key = typeof props.rowKey === 'function' ? props.rowKey(row) : row[props.rowKey]
    if ((typeof key === 'string' && key.length > 0) || (typeof key === 'number' && Number.isFinite(key))) return key
    throw new Error('DataTable requires a stable row key. Provide rowKey or a rowKey function for every row.')
}

function cellValue(row: DataTableRow, column: DataTableColumn): unknown {
    return column.value ? column.value(row) : row[column.key]
}

function columnWidth(column: DataTableColumn): number {
    return columnSize(column) ?? parsePixelSize(column.width) ?? parsePixelSize(column.minWidth) ?? 160
}

function parsePixelSize(value: string | undefined): number | undefined {
    const match = /^\s*(\d+(?:\.\d+)?)px\s*$/i.exec(value ?? '')
    if (!match) return undefined
    const size = Number(match[1])
    return Number.isFinite(size) && size > 0 ? size : undefined
}

function pinnedColumn(id: string): ResolvedDataTablePinnedColumn | undefined {
    return resolvedPinnedColumns.value.get(id)
}

function pinnedStyle(id: string, kind: 'header' | 'cell'): Record<string, string | number> | undefined {
    const pinned = pinnedColumn(id)
    if (!pinned) return undefined
    return {
        position: 'sticky',
        [pinned.side]: `${pinned.offset}px`,
        zIndex: kind === 'header' ? 30 : 10,
        boxShadow: pinned.edge
            ? pinned.side === 'left'
                ? '8px 0 10px -10px var(--foreground)'
                : '-8px 0 10px -10px var(--foreground)'
            : 'none',
    }
}

function setColumnPinning(value: DataTableColumnPinning): void {
    const next = normalizeDataTableColumnPinning(pinningColumns.value, value)
    if (props.columnPinning === undefined) internalColumnPinning.value = next
    emit('update:columnPinning', next)
}

function readStoredColumnPinning(key: string | undefined): DataTableColumnPinning {
    if (!key || typeof window === 'undefined') return {}
    try {
        return parseStoredDataTableColumnPinning(window.localStorage.getItem(key))
    } catch {
        return {}
    }
}

function persistColumnPinning(value: DataTableColumnPinning): void {
    const key = props.columnPinningStorageKey
    if (!key || typeof window === 'undefined') return
    try {
        window.localStorage.setItem(key, JSON.stringify(normalizeDataTableColumnPinning(pinningColumns.value, value)))
    } catch {
        // Storage is optional and can be unavailable in private/embedded contexts.
    }
}

watch(currentColumnPinning, persistColumnPinning, { deep: true })
function loadColumnPinning(): void {
    if (!props.columnPinningStorageKey || typeof window === 'undefined' || props.columnPinning !== undefined) return
    const normalized = normalizeDataTableColumnPinning(pinningColumns.value, readStoredColumnPinning(props.columnPinningStorageKey))
    internalColumnPinning.value = normalized
    persistColumnPinning(normalized)
}

watch(() => props.columnPinningStorageKey, (key, previousKey) => {
    if (props.columnPinning !== undefined || key === previousKey) return
    loadColumnPinning()
}, { flush: 'post' })

function displayValue(row: DataTableRow, column: DataTableColumn, index: number): unknown {
    const value = cellValue(row, column)
    return column.formatter ? column.formatter(value, row, index) : value
}

function changeSelection(keys: DataTableRowKey[]): void {
    const next = [...new Set(props.selectionScope === 'persistent'
        ? keys
        : keys.filter((key) => visibleKeySet.value.has(key)))]
    if (props.selectedKeys === undefined) internalSelectedKeys.value = next
    emit('update:selectedKeys', next)
    emit('selection-change', next)
}

// A controlled page-scoped selection must not leave stale keys in the parent
// when pagination or a server query replaces the visible rows.
watch(visibleKeySet, () => {
    if (!props.selectable || props.selectionScope === 'persistent') return
    const current = props.selectedKeys ?? internalSelectedKeys.value
    const next = current.filter((key) => visibleKeySet.value.has(key))
    if (next.length === current.length) return
    if (props.selectedKeys === undefined) internalSelectedKeys.value = next
    emit('update:selectedKeys', next)
    emit('selection-change', next)
}, { flush: 'post' })

function toggleRow(row: DataTableRow): void {
    const key = rowKeyOf(row)
    const keys = selected.value.includes(key)
        ? selected.value.filter((item) => item !== key)
        : [...selected.value, key]
    changeSelection(keys)
}

function toggleAll(): void {
    const visibleKeys = visibleRowKeys.value
    const next = allVisibleSelected.value
        ? selected.value.filter((key) => !visibleKeys.includes(key))
        : [...selected.value, ...visibleKeys]
    changeSelection(next)
}

function toggleSort(column: DataTableColumn): void {
    if (!column.sortable) return
    const sort: DataTableSort = currentSort.value?.key === column.key
        ? { key: column.key, direction: currentSort.value.direction === 'asc' ? 'desc' : 'asc' }
        : { key: column.key, direction: 'asc' }
    if (!props.manualSort && props.sort === undefined) internalSort.value = sort
    emit('update:sort', sort)
    emit('sort-change', sort)
}

function clearSort(): void {
    internalSort.value = undefined
    emit('update:sort', undefined)
    emit('sort-change', undefined)
}

function initialColumnSize(column: DataTableColumn): number {
    const controlled = columnSize(column)
    if (controlled !== undefined) return controlled
    const width = Number.parseFloat(column.width ?? '')
    return Number.isFinite(width) ? width : 160
}

function updateColumnSizing(next: Record<string, number>): void {
    const normalized = normalizeDataTableColumnSizing(props.columns, next)
    if (props.columnSizing === undefined) internalColumnSizing.value = normalized
    if (props.columnSizingStorageKey && typeof window !== 'undefined') {
        try { window.localStorage.setItem(props.columnSizingStorageKey, JSON.stringify(normalized)) } catch { /* optional storage */ }
    }
    emit('update:columnSizing', normalized)
}

function startResize(event: PointerEvent, column: DataTableColumn): void {
    if (!column.resizable) return
    event.preventDefault()
    event.stopPropagation()
    resizing.value = {
        id: columnId(column),
        startX: event.clientX,
        startWidth: initialColumnSize(column),
        min: column.minSize ?? 72,
        max: column.maxSize,
    }
    window.addEventListener('pointermove', resizeColumn)
    window.addEventListener('pointerup', stopResize, { once: true })
}

function resizeColumn(event: PointerEvent): void {
    const active = resizing.value
    if (!active) return
    const proposed = active.startWidth + event.clientX - active.startX
    const nextWidth = Math.max(active.min, active.max === undefined ? proposed : Math.min(active.max, proposed))
    updateColumnSizing({ ...currentColumnSizing.value, [active.id]: nextWidth })
}

function stopResize(): void {
    resizing.value = undefined
    window.removeEventListener('pointermove', resizeColumn)
}

function loadColumnSizing(): void {
    if (!props.columnSizingStorageKey || typeof window === 'undefined' || props.columnSizing !== undefined) return
    try {
        const raw = window.localStorage.getItem(props.columnSizingStorageKey)
        if (raw) {
            internalColumnSizing.value = normalizeDataTableColumnSizing(props.columns, JSON.parse(raw) as Record<string, number>)
            window.localStorage.setItem(props.columnSizingStorageKey, JSON.stringify(internalColumnSizing.value))
        }
    } catch { /* invalid persisted state falls back to defaults */ }
}

onMounted(() => {
    loadColumnSizing()
    loadColumnPinning()
})
onBeforeUnmount(stopResize)
watch(() => props.columnSizing, value => { internalColumnSizing.value = normalizeDataTableColumnSizing(props.columns, value) }, { deep: true })
watch(() => props.columns, columns => {
    const normalized = normalizeDataTableColumnSizing(columns, currentColumnSizing.value)
    if (props.columnSizing === undefined) internalColumnSizing.value = normalized
    if (props.columnSizingStorageKey && typeof window !== 'undefined') {
        try { window.localStorage.setItem(props.columnSizingStorageKey, JSON.stringify(normalized)) } catch { /* optional storage */ }
    }
}, { deep: true })

function retry(): void {
    emit('retry')
}

function toCssSize(value: string | number | undefined): string | undefined {
    if (value === undefined) return undefined
    return typeof value === 'number' ? `${value}px` : value
}
</script>

<template>
    <div class="relative w-full overflow-x-auto" :class="tableViewportClass" :style="tableViewportStyle">
        <div v-if="hasToolbar" class="mb-3 flex flex-wrap items-center gap-2">
            <slot
                name="toolbar"
                :selected-keys="selected"
                :loading="loading"
                :error="error"
                :retry="retry"
                :sort="currentSort"
                :column-pinning="currentColumnPinning"
                :set-column-pinning="setColumnPinning"
                :page="page"
                :page-size="pageSize"
            />
        </div>
        <div :class="mobileCards ? 'hidden sm:block' : undefined">
        <table class="w-full caption-bottom text-sm tabular-nums" :class="hasPinnedColumns ? 'min-w-max' : undefined">
            <caption v-if="caption" class="sr-only">{{ caption }}</caption>
            <thead>
                <tr class="border-b">
                    <th v-if="selectable" data-column-id="selection" scope="col" class="data-table-pinned-header h-10 w-10 px-3 align-middle" :style="pinnedStyle('selection', 'header')">
                        <input
                            type="checkbox"
                            :checked="allVisibleSelected"
                            :indeterminate="someVisibleSelected && !allVisibleSelected"
                            aria-label="全选当前页"
                            @change="toggleAll"
                        />
                    </th>
                    <th
                        v-for="column in visibleColumns"
                        :key="column.key"
                        :data-column-id="columnId(column)"
                        scope="col"
                        :style="{ ...columnStyle(column), ...pinnedStyle(columnId(column), 'header') }"
                        :aria-sort="currentSort?.key === column.key ? (currentSort.direction === 'asc' ? 'ascending' : 'descending') : undefined"
                        class="data-table-pinned-header relative h-10 whitespace-nowrap px-3 text-left align-middle font-medium text-foreground"
                        :class="{ 'text-center': column.align === 'center', 'text-right': column.align === 'right' }"
                    >
                        <button
                            v-if="column.sortable"
                            type="button"
                            class="inline-flex items-center gap-1.5 rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            @click="toggleSort(column)"
                        >
                            {{ column.title }}
                            <Icon :icon="currentSort?.key === column.key ? (currentSort.direction === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down') : 'lucide:arrow-up-down'" class="size-3.5 text-muted-foreground" />
                        </button>
                        <template v-else>{{ column.title }}</template>
                        <span
                            v-if="column.resizable"
                            class="absolute inset-y-0 right-0 z-10 w-1 cursor-col-resize touch-none select-none hover:bg-primary/40"
                            aria-hidden="true"
                            @pointerdown="startResize($event, column)"
                        />
                    </th>
                    <th v-if="hasActions" data-column-id="actions" scope="col" class="data-table-pinned-header h-10 whitespace-nowrap px-3 text-right align-middle font-medium text-foreground" :style="pinnedStyle('actions', 'header')">操作</th>
                </tr>
            </thead>
            <tbody>
                <template v-if="loading">
                    <tr v-for="index in 3" :key="index" class="border-b last:border-0">
                        <td v-if="selectable" class="data-table-pinned-cell p-3" :style="pinnedStyle('selection', 'cell')"><Skeleton class="h-4 w-4" /></td>
                        <td v-for="column in visibleColumns" :key="column.key" :data-column-id="columnId(column)" class="data-table-pinned-cell p-3" :style="{ ...columnStyle(column), ...pinnedStyle(columnId(column), 'cell') }"><Skeleton class="h-5 w-full" /></td>
                        <td v-if="hasActions" data-column-id="actions" class="data-table-pinned-cell p-3" :style="pinnedStyle('actions', 'cell')"><Skeleton class="ml-auto h-5 w-16" /></td>
                    </tr>
                </template>
                <tr v-else-if="error">
                    <td :colspan="Math.max(visibleColumns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0), 1)" class="p-8 text-center text-sm text-destructive">
                        <slot name="error" :error="error" :retry="retry">
                            <p>{{ errorText ?? '加载失败' }}</p>
                            <button type="button" class="mt-3 rounded-md border px-3 py-1.5 text-xs hover:bg-accent" @click="retry">重试</button>
                        </slot>
                    </td>
                </tr>
                <tr v-else-if="visibleRows.length === 0">
                    <td :colspan="Math.max(visibleColumns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0), 1)" class="p-8 text-center text-sm text-muted-foreground">
                        <slot name="empty">{{ emptyText ?? t('common.noData') }}</slot>
                    </td>
                </tr>
                <template v-else>
                    <tr v-for="(row, index) in visibleRows" :key="String(visibleRowKeys[index])" class="data-table-row group border-b transition-colors last:border-0 hover:bg-accent" :data-state="selected.includes(visibleRowKeys[index]) ? 'selected' : undefined">
                        <td v-if="selectable" data-column-id="selection" class="data-table-pinned-cell w-10 p-3 align-middle" :style="pinnedStyle('selection', 'cell')">
                            <input
                                type="checkbox"
                                :checked="selected.includes(visibleRowKeys[index])"
                                :aria-label="`选择第 ${index + 1} 行`"
                                @change="toggleRow(row)"
                            />
                        </td>
                        <td
                            v-for="column in visibleColumns"
                            :key="column.key"
                            :data-column-id="columnId(column)"
                            class="data-table-pinned-cell whitespace-nowrap p-3 align-middle"
                            :style="{ ...columnStyle(column), ...pinnedStyle(columnId(column), 'cell') }"
                            :class="{ 'text-center': column.align === 'center', 'text-right': column.align === 'right' }"
                        >
                            <slot :name="`cell-${column.key}`" :row="row" :value="cellValue(row, column)" :index="index">
                                {{ displayValue(row, column, index) ?? '—' }}
                            </slot>
                        </td>
                        <td v-if="hasActions" data-column-id="actions" class="data-table-pinned-cell whitespace-nowrap p-3 text-right align-middle" :style="pinnedStyle('actions', 'cell')">
                            <slot name="actions" :row="row" :value="row" :index="index" :row-key="visibleRowKeys[index]">
                                <slot name="action" :row="row" :value="row" :index="index" :row-key="visibleRowKeys[index]" />
                            </slot>
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>
        </div>
        <div v-if="mobileCards" class="space-y-3 sm:hidden">
            <slot name="mobile" :rows="visibleRows" :selected-keys="selected" :toggle-row="toggleRow" />
        </div>
        <DataTablePagination
            v-if="pagination"
            :page="page"
            :page-size="pageSize"
            :total="totalRows"
            :page-size-options="pageSizeOptions"
            @update:page="(value) => emit('update:page', value)"
            @update:page-size="(value) => emit('update:pageSize', value)"
        />
        <button v-if="currentSort" type="button" class="sr-only" @click="clearSort">清除排序</button>
    </div>
</template>

<style>
.data-table-pinned-header {
    background-color: var(--table-header, var(--background));
}

.data-table-pinned-cell {
    background-color: var(--background);
}

.data-table-row:hover > .data-table-pinned-cell {
    background-color: color-mix(in oklch, var(--muted) 50%, var(--background));
}

.data-table-row[data-state='selected'] > .data-table-pinned-cell {
    background-color: var(--muted);
}
</style>
