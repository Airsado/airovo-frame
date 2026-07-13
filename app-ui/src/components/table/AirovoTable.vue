<script setup lang="ts">
/**
 * AirovoTable — vxe-table wrapped to feel native to airovo-frame.
 *
 * Responsibilities:
 *   - Render the table with token-mapped theme (see theme.css)
 *   - Plumb built-in search/selection/sort/page events to the parent
 *   - Expose a minimal "columns + data + pagination" surface so the
 *     common case is `<AirovoTable :columns :data v-model:pagination />`
 *   - Expose a default `#toolbar`, `#toolbar-after`, and per-column
 *     slots so apps can customise without leaking vxe-table internals
 */
import { computed } from 'vue'
import { VxeTable, VxeColumn } from 'vxe-table'
// vxe-pc-ui doesn't ship a `.d.ts`; the pager is just a runtime component.
// @ts-expect-error — no declaration file for the subpath import
import VxePager from 'vxe-pc-ui/lib/pager'
import 'vxe-pc-ui/lib/style.css'
import 'vxe-table/lib/style.css'
import './theme.css'
import type { AirovoColumn } from './columns'

defineOptions({ name: 'AirovoTable' })

const props = withDefaults(defineProps<{
    columns: AirovoColumn[]
    data: any[]
    loading?: boolean
    /** Two-way bound pagination. */
    pagination?: { page: number; pageSize: number; total: number } | null
    selection?: boolean
    stripe?: boolean
    border?: 'default' | 'inner' | 'outer' | 'none'
    rowKey?: string
    height?: string | number
    /** Per-row max height; useful for dense lists. */
    size?: 'mini' | 'small' | 'medium' | 'large'
}>(), {
    loading: false,
    stripe: true,
    border: 'inner',
    rowKey: 'id',
    pagination: null,
    selection: false,
    size: 'medium',
})

const emit = defineEmits<{
    'update:pagination': [{ page: number; pageSize: number }]
    'selection-change': [rows: any[]]
    'sort-change': [{ field: string; order: 'asc' | 'desc' | 'null' }]
    'row-click': [{ row: any }]
}>()

const rowConfig = computed(() => ({ keyField: props.rowKey, isHover: true }))
const columnConfig = computed(() => ({ resizable: true }))

function onCheckboxChange(e: any) {
    emit('selection-change', e.records ?? [])
}
function onSortChange(e: any) {
    const field = e?.property ?? e?.sortBy
    const order = e?.order === 'asc' || e?.order === 'desc' ? e.order : 'null'
    emit('sort-change', { field, order })
}
function onRowClick(e: any) {
    emit('row-click', { row: e.row })
}
function onPageChange(e: any) {
    emit('update:pagination', { page: e.currentPage, pageSize: e.pageSize })
}
</script>

<template>
    <div class="airovo-table">
        <slot name="toolbar" />

        <VxeTable
            :data="data"
            :loading="loading"
            :stripe="stripe"
            :border="border"
            :size="size"
            :row-config="rowConfig"
            :column-config="columnConfig"
            :height="height"
            @checkbox-change="onCheckboxChange"
            @checkbox-all="onCheckboxChange"
            @sort-change="onSortChange"
            @row-click="onRowClick"
        >
            <VxeColumn
                v-if="selection"
                type="checkbox"
                width="44"
                fixed="left"
            />
            <VxeColumn
                v-for="col in columns"
                :key="col.field"
                :field="col.field"
                :title="col.title"
                :width="col.width"
                :min-width="col.minWidth"
                :align="col.align"
                :fixed="col.fixed"
                :sortable="col.sortable"
                :filters="col.filterable ? [] : undefined"
                :formatter="col.formatter"
            >
                <template v-if="col.slot" #default="{ row }">
                    <slot :name="`col-${col.slot}`" :row="row" :col="col" />
                </template>
            </VxeColumn>
            <slot />
        </VxeTable>

        <VxePager
            v-if="pagination"
            :current-page="pagination.page"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            :layouts="['Total', 'PrevJump', 'PrevPage', 'Number', 'NextPage', 'NextJump', 'Sizes', 'FullJump']"
            @page-change="onPageChange"
        />

        <slot name="toolbar-after" />
    </div>
</template>
