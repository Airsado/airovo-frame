<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@airovo/shared/icons'
import { Skeleton } from '@airovo/uikit-shadcnui'
import type { DataTableColumn, DataTableRow, DataTableRowKey, DataTableSelectionScope, DataTableSort } from './types'

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
})

const emit = defineEmits<{
    (event: 'update:selectedKeys', value: DataTableRowKey[]): void
    (event: 'selection-change', value: DataTableRowKey[]): void
    (event: 'sort-change', value?: DataTableSort): void
    (event: 'update:sort', value?: DataTableSort): void
    (event: 'update:page', value: number): void
    (event: 'update:pageSize', value: number): void
    (event: 'retry'): void
}>()

const { t } = useI18n({ useScope: 'global' })
const slots = useSlots()
const internalSort = ref<DataTableSort>()
const internalSelectedKeys = ref<DataTableRowKey[]>([])
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

const visibleColumns = computed(() => props.columns.filter((column) => !column.hidden))
const currentSort = computed(() => props.sort ?? internalSort.value)
const hasToolbar = computed(() => Boolean(slots.toolbar))
const hasActions = computed(() => Boolean(slots.actions || slots.action))
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
const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / Math.max(props.pageSize, 1))))
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

function rowKeyOf(row: DataTableRow): DataTableRowKey {
    const key = typeof props.rowKey === 'function' ? props.rowKey(row) : row[props.rowKey]
    if ((typeof key === 'string' && key.length > 0) || (typeof key === 'number' && Number.isFinite(key))) return key
    throw new Error('DataTable requires a stable row key. Provide rowKey or a rowKey function for every row.')
}

function cellValue(row: DataTableRow, column: DataTableColumn): unknown {
    return column.value ? column.value(row) : row[column.key]
}

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

function setPage(value: number): void {
    const page = Math.min(Math.max(1, Math.floor(value)), totalPages.value)
    if (page !== props.page) emit('update:page', page)
}

function setPageSize(value: number): void {
    const pageSize = Math.max(1, Math.floor(value))
    emit('update:pageSize', pageSize)
}

function retry(): void {
    emit('retry')
}
</script>

<template>
    <div class="relative w-full overflow-x-auto overflow-y-hidden">
        <div v-if="hasToolbar" class="mb-3 flex flex-wrap items-center gap-2">
            <slot
                name="toolbar"
                :selected-keys="selected"
                :loading="loading"
                :error="error"
                :retry="retry"
                :sort="currentSort"
                :page="page"
                :page-size="pageSize"
            />
        </div>
        <table class="w-full caption-bottom text-sm tabular-nums">
            <caption v-if="caption" class="sr-only">{{ caption }}</caption>
            <thead>
                <tr class="border-b">
                    <th v-if="selectable" scope="col" class="h-10 w-10 px-3 align-middle">
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
                        scope="col"
                        :style="column.width ? { width: column.width } : undefined"
                        :aria-sort="currentSort?.key === column.key ? (currentSort.direction === 'asc' ? 'ascending' : 'descending') : undefined"
                        class="h-10 whitespace-nowrap px-3 text-left align-middle font-medium text-foreground"
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
                    </th>
                    <th v-if="hasActions" scope="col" class="h-10 whitespace-nowrap px-3 text-right align-middle font-medium text-foreground">操作</th>
                </tr>
            </thead>
            <tbody>
                <template v-if="loading">
                    <tr v-for="index in 3" :key="index" class="border-b last:border-0">
                        <td v-if="selectable" class="p-3"><Skeleton class="h-4 w-4" /></td>
                        <td v-for="column in visibleColumns" :key="column.key" class="p-3"><Skeleton class="h-5 w-full" /></td>
                        <td v-if="hasActions" class="p-3"><Skeleton class="ml-auto h-5 w-16" /></td>
                    </tr>
                </template>
                <tr v-else-if="error">
                    <td :colspan="Math.max(visibleColumns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0), 1)" class="p-8 text-center text-sm text-destructive">
                        <slot name="error" :error="error" :retry="retry">
                            <p>{{ errorText ?? '加载失败' }}</p>
                            <button type="button" class="mt-3 rounded-md border px-3 py-1.5 text-xs hover:bg-muted" @click="retry">重试</button>
                        </slot>
                    </td>
                </tr>
                <tr v-else-if="visibleRows.length === 0">
                    <td :colspan="Math.max(visibleColumns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0), 1)" class="p-8 text-center text-sm text-muted-foreground">
                        <slot name="empty">{{ emptyText ?? t('common.noData') }}</slot>
                    </td>
                </tr>
                <template v-else>
                    <tr v-for="(row, index) in visibleRows" :key="String(visibleRowKeys[index])" class="border-b transition-colors last:border-0 hover:bg-muted/50">
                        <td v-if="selectable" class="w-10 p-3 align-middle">
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
                            class="whitespace-nowrap p-3 align-middle"
                            :class="{ 'text-center': column.align === 'center', 'text-right': column.align === 'right' }"
                        >
                            <slot :name="`cell-${column.key}`" :row="row" :value="cellValue(row, column)" :index="index">
                                {{ displayValue(row, column, index) ?? '—' }}
                            </slot>
                        </td>
                        <td v-if="hasActions" class="whitespace-nowrap p-3 text-right align-middle">
                            <slot name="actions" :row="row" :value="row" :index="index" :row-key="visibleRowKeys[index]">
                                <slot name="action" :row="row" :value="row" :index="index" :row-key="visibleRowKeys[index]" />
                            </slot>
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>
        <div v-if="pagination" class="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-3 text-xs text-muted-foreground">
            <span>共 {{ totalRows }} 条，第 {{ props.page }} / {{ totalPages }} 页</span>
            <div class="flex items-center gap-2">
                <label class="flex items-center gap-1">
                    每页
                    <select :value="props.pageSize" class="h-8 rounded-md border bg-background px-2" @change="setPageSize(Number(($event.target as HTMLSelectElement).value))">
                        <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
                    </select>
                </label>
                <button type="button" class="rounded-md border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50" :disabled="props.page <= 1" @click="setPage(props.page - 1)">上一页</button>
                <button type="button" class="rounded-md border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50" :disabled="props.page >= totalPages" @click="setPage(props.page + 1)">下一页</button>
            </div>
        </div>
        <button v-if="currentSort" type="button" class="sr-only" @click="clearSort">清除排序</button>
    </div>
</template>
