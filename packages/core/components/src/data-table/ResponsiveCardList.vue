<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed, ref, watch } from 'vue'
import type { HTMLAttributes } from 'vue'
import type { DataTableRowKey, DataTableSelectionScope } from './types'

defineOptions({ name: 'ResponsiveCardList' })

const props = withDefaults(defineProps<{
    rows?: T[]
    columns?: Array<{ key: string; title: string; value?: (row: T) => unknown }>
    rowKey?: string | ((row: T) => string | number)
    loading?: boolean
    emptyText?: string
    selectable?: boolean
    selectedKeys?: DataTableRowKey[]
    selectionScope?: DataTableSelectionScope
    class?: HTMLAttributes['class']
}>(), {
    rows: () => [],
    columns: () => [],
    rowKey: 'id',
    loading: false,
    emptyText: '暂无数据',
    selectable: false,
    selectionScope: 'page',
})

const emit = defineEmits<{
    (event: 'update:selectedKeys', value: DataTableRowKey[]): void
    (event: 'selection-change', value: DataTableRowKey[]): void
}>()

const internalSelectedKeys = ref<DataTableRowKey[]>([...(props.selectedKeys ?? [])])
const currentSelectedKeys = computed(() => props.selectedKeys ?? internalSelectedKeys.value)
const visibleKeys = computed(() => props.rows.map((row, index) => rowKey(row, index)))
const visibleKeySet = computed(() => new Set(visibleKeys.value))
const selected = computed(() => props.selectionScope === 'persistent'
    ? currentSelectedKeys.value
    : currentSelectedKeys.value.filter((key) => visibleKeySet.value.has(key)))
const allVisibleSelected = computed(() => props.selectable && visibleKeys.value.length > 0 && visibleKeys.value.every((key) => selected.value.includes(key)))
const someVisibleSelected = computed(() => props.selectable && visibleKeys.value.some((key) => selected.value.includes(key)))

function rowKey(row: T, index: number): string | number {
    const key = typeof props.rowKey === 'function' ? props.rowKey(row) : row[props.rowKey]
    return typeof key === 'string' || typeof key === 'number' ? key : index
}

function changeSelection(next: DataTableRowKey[]): void {
    const normalized = [...new Set(props.selectionScope === 'persistent' ? next : next.filter((key) => visibleKeySet.value.has(key)))]
    if (props.selectedKeys === undefined) internalSelectedKeys.value = normalized
    emit('update:selectedKeys', normalized)
    emit('selection-change', normalized)
}

function toggleRow(row: T, index: number): void {
    const key = rowKey(row, index)
    changeSelection(selected.value.includes(key)
        ? selected.value.filter((item) => item !== key)
        : [...selected.value, key])
}

function toggleAll(): void {
    const next = allVisibleSelected.value
        ? selected.value.filter((key) => !visibleKeys.value.includes(key))
        : [...selected.value, ...visibleKeys.value]
    changeSelection(next)
}

watch(visibleKeySet, () => {
    if (!props.selectable || props.selectionScope === 'persistent') return
    const current = props.selectedKeys ?? internalSelectedKeys.value
    const next = current.filter((key) => visibleKeySet.value.has(key))
    if (next.length !== current.length) changeSelection(next)
}, { flush: 'post' })
</script>

<template>
    <div :class="['grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3', props.class]">
        <template v-if="props.loading">
            <div role="status" aria-live="polite" class="sr-only">正在加载</div>
            <slot name="loading"><div v-for="index in 3" :key="index" class="min-h-24 animate-pulse rounded-lg border bg-muted/40" /></slot>
        </template>
        <template v-else-if="props.rows.length">
            <div v-if="props.selectable" class="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs">
                <input type="checkbox" :checked="allVisibleSelected" :indeterminate="someVisibleSelected && !allVisibleSelected" aria-label="全选当前页" @change="toggleAll">
                <span>选择当前页</span>
            </div>
            <slot :rows="props.rows" :selected-keys="selected">
            <article v-for="(row, index) in props.rows" :key="String(rowKey(row, index))" class="min-w-0 rounded-lg border bg-card p-3">
                <div class="flex min-w-0 items-start gap-2">
                    <input v-if="props.selectable" type="checkbox" :checked="selected.includes(rowKey(row, index))" :aria-label="`选择第 ${index + 1} 行`" @change="toggleRow(row, index)">
                    <div class="min-w-0 flex-1">
                <slot name="card" :row="row" :index="index" :row-key="rowKey(row, index)" :selected="selected.includes(rowKey(row, index))" :toggle-row="() => toggleRow(row, index)">
                    <dl class="grid gap-2 text-sm">
                        <div v-for="column in props.columns" :key="column.key" class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3">
                            <dt class="text-muted-foreground">{{ column.title }}</dt>
                            <dd class="min-w-0 truncate text-right">{{ column.value ? column.value(row) : row[column.key] ?? '—' }}</dd>
                        </div>
                    </dl>
                </slot>
                    </div>
                </div>
            </article>
            </slot>
        </template>
        <slot v-else name="empty"><div role="status" aria-live="polite" class="col-span-full p-8 text-center text-sm text-muted-foreground">{{ props.emptyText }}</div></slot>
    </div>
</template>
