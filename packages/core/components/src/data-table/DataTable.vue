<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@airovo/shared/icons'
import { Skeleton } from '@airovo/uikit-shadcnui'
import type { DataTableColumn } from './types'

defineOptions({ name: 'DataTable' })

const props = withDefaults(defineProps<{
    columns: DataTableColumn[]
    data: Record<string, unknown>[]
    rowKey?: string
    loading?: boolean
    emptyText?: string
    caption?: string
}>(), {
    rowKey: 'id',
    loading: false,
})

const { t } = useI18n({ useScope: 'global' })

const sortKey = ref<string>()
const sortDirection = ref<'asc' | 'desc'>('asc')
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function cellValue(row: Record<string, unknown>, column: DataTableColumn): unknown {
    return column.value ? column.value(row) : row[column.key]
}

const rows = computed(() => {
    const column = props.columns.find((item) => item.key === sortKey.value)
    if (!column) return props.data
    const direction = sortDirection.value === 'asc' ? 1 : -1
    return [...props.data].sort((left, right) =>
        direction * collator.compare(
            String(cellValue(left, column) ?? ''),
            String(cellValue(right, column) ?? ''),
        ),
    )
})

function toggleSort(column: DataTableColumn): void {
    if (!column.sortable) return
    if (sortKey.value === column.key) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortKey.value = column.key
        sortDirection.value = 'asc'
    }
}
</script>

<template>
    <div class="relative w-full overflow-x-auto overflow-y-hidden">
        <table class="w-full caption-bottom text-sm tabular-nums">
            <caption v-if="caption" class="sr-only">{{ caption }}</caption>
            <thead>
                <tr class="border-b">
                    <th
                        v-for="column in columns"
                        :key="column.key"
                        scope="col"
                        :style="column.width ? { width: column.width } : undefined"
                        :aria-sort="sortKey === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined"
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
                            <Icon :icon="sortKey === column.key ? (sortDirection === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down') : 'lucide:arrow-up-down'" class="size-3.5 text-muted-foreground" />
                        </button>
                        <template v-else>{{ column.title }}</template>
                    </th>
                </tr>
            </thead>
            <tbody>
                <template v-if="loading">
                    <tr v-for="index in 3" :key="index" class="border-b last:border-0">
                        <td v-for="column in columns" :key="column.key" class="p-3"><Skeleton class="h-5 w-full" /></td>
                    </tr>
                </template>
                <tr v-else-if="rows.length === 0">
                    <td :colspan="Math.max(columns.length, 1)" class="p-8 text-center text-sm text-muted-foreground">
                        <slot name="empty">{{ emptyText ?? t('common.noData') }}</slot>
                    </td>
                </tr>
                <template v-else>
                    <tr v-for="(row, index) in rows" :key="String(row[rowKey] ?? index)" class="border-b transition-colors last:border-0 hover:bg-muted/50">
                        <td
                            v-for="column in columns"
                            :key="column.key"
                            class="whitespace-nowrap p-3 align-middle"
                            :class="{ 'text-center': column.align === 'center', 'text-right': column.align === 'right' }"
                        >
                            <slot :name="`cell-${column.key}`" :row="row" :value="cellValue(row, column)" :index="index">
                                {{ cellValue(row, column) ?? '—' }}
                            </slot>
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>
    </div>
</template>
