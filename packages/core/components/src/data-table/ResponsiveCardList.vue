<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { HTMLAttributes } from 'vue'

defineOptions({ name: 'ResponsiveCardList' })

const props = withDefaults(defineProps<{
    rows?: T[]
    columns?: Array<{ key: string; title: string; value?: (row: T) => unknown }>
    rowKey?: string | ((row: T) => string | number)
    loading?: boolean
    emptyText?: string
    class?: HTMLAttributes['class']
}>(), {
    rows: () => [],
    columns: () => [],
    rowKey: 'id',
    loading: false,
    emptyText: '暂无数据',
})

function rowKey(row: T, index: number): string | number {
    const key = typeof props.rowKey === 'function' ? props.rowKey(row) : row[props.rowKey]
    return typeof key === 'string' || typeof key === 'number' ? key : index
}
</script>

<template>
    <div :class="['grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3', props.class]">
        <template v-if="props.loading">
            <slot name="loading"><div v-for="index in 3" :key="index" class="min-h-24 animate-pulse rounded-lg border bg-muted/40" /></slot>
        </template>
        <slot v-else-if="props.rows.length" :rows="props.rows">
            <article v-for="(row, index) in props.rows" :key="String(rowKey(row, index))" class="min-w-0 rounded-lg border bg-card p-3">
                <slot name="card" :row="row" :index="index" :row-key="rowKey(row, index)">
                    <dl class="grid gap-2 text-sm">
                        <div v-for="column in props.columns" :key="column.key" class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3">
                            <dt class="text-muted-foreground">{{ column.title }}</dt>
                            <dd class="min-w-0 truncate text-right">{{ column.value ? column.value(row) : row[column.key] ?? '—' }}</dd>
                        </div>
                    </dl>
                </slot>
            </article>
        </slot>
        <slot v-else name="empty"><div class="col-span-full p-8 text-center text-sm text-muted-foreground">{{ props.emptyText }}</div></slot>
    </div>
</template>
