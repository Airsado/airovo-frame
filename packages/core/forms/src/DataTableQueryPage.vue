<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
    DataTablePage,
    DataTableToolbar,
    type DataTableColumn,
    type DataTableFilterGroup,
    type DataTableFilterValue,
    type DataTableRow,
    type DataTableRowKey,
    type DataTableSelectionScope,
    type DataTableSort,
    type DataTableViewMode,
    type UseDataTableReturn,
} from '@airovo/components'
import DataTableQueryForm from './DataTableQueryForm.vue'
import type { FormFieldSchema } from './types'
import type { QueryFormNormalizer, QueryFormValues } from './data-table-query'

defineOptions({ name: 'DataTableQueryPage' })

const props = withDefaults(defineProps<{
    table: UseDataTableReturn<DataTableRow>
    columns: DataTableColumn[]
    querySchema?: FormFieldSchema[]
    queryInitialValues?: QueryFormValues
    queryNormalizeValues?: QueryFormNormalizer
    submitOnChange?: boolean
    changeDebounceMs?: number
    showSearchForm?: boolean
    queryFormCollapsed?: boolean
    queryFormShowCollapseButton?: boolean
    filters?: DataTableFilterGroup[]
    searchKey?: string
    searchPlaceholder?: string
    searchDebounceMs?: number
    collapsibleOnMobile?: boolean
    showReset?: boolean
    showRefresh?: boolean
    hideViewOptions?: boolean
    rowKey?: string | ((row: DataTableRow) => DataTableRowKey)
    pagination?: boolean
    pageSizeOptions?: number[]
    selectable?: boolean
    selectionScope?: DataTableSelectionScope
    selectedKeys?: DataTableRowKey[]
    enableViewModeToggle?: boolean
    viewMode?: DataTableViewMode
    defaultViewMode?: DataTableViewMode
    mobileCards?: boolean
    class?: string
}>(), {
    querySchema: () => [],
    queryInitialValues: () => ({}),
    submitOnChange: false,
    changeDebounceMs: 300,
    showSearchForm: true,
    queryFormCollapsed: false,
    queryFormShowCollapseButton: false,
    filters: () => [],
    searchKey: 'search',
    searchPlaceholder: '按名称、ID 或关键字筛选…',
    searchDebounceMs: 500,
    collapsibleOnMobile: true,
    showReset: true,
    showRefresh: true,
    hideViewOptions: false,
    pagination: true,
    selectable: false,
    selectionScope: 'page',
    enableViewModeToggle: false,
    defaultViewMode: 'table',
    mobileCards: false,
})

const emit = defineEmits<{
    (event: 'update:selectedKeys', value: DataTableRowKey[]): void
    (event: 'selection-change', value: DataTableRowKey[]): void
    (event: 'query-submit', value: QueryFormValues): void
    (event: 'query-reset', value: QueryFormValues): void
    (event: 'query-invalid', errors: Record<string, string>): void
}>()

const searchValue = ref(String(props.table.filters.value[props.searchKey] ?? ''))
const queryForm = ref<InstanceType<typeof DataTableQueryForm>>()

watch(() => props.table.filters.value[props.searchKey], (value) => {
    const next = value == null ? '' : String(value)
    if (next !== searchValue.value) searchValue.value = next
})

const filterValues = computed<Record<string, DataTableFilterValue>>(() => Object.fromEntries(
    props.filters.map((filter) => [filter.key, props.table.filters.value[filter.key] as DataTableFilterValue]),
))

function hasValue(value: unknown): boolean {
    return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)
}

function mergeToolbarFilters(values: Record<string, DataTableFilterValue>): Record<string, unknown> {
    const next = { ...props.table.filters.value }
    for (const filter of props.filters) {
        delete next[filter.key]
        const value = values[filter.key]
        if (hasValue(value)) next[filter.key] = value
    }
    return next
}

function updateSearch(value: string): void {
    searchValue.value = value
    const next = { ...props.table.filters.value }
    if (hasValue(value)) next[props.searchKey] = value
    else delete next[props.searchKey]
    void props.table.setFilters(next)
}

function updateFilterValues(values: Record<string, DataTableFilterValue>): void {
    void props.table.setFilters(mergeToolbarFilters(values))
}

function refresh(): void {
    void props.table.reload()
}

function updatePage(value: number): void {
    void props.table.setPage(value)
}

function updatePageSize(value: number): void {
    void props.table.setPageSize(value)
}

function updateSort(value?: DataTableSort): void {
    void props.table.setSort(value)
}

function updateSelectedKeys(value: DataTableRowKey[]): void {
    emit('update:selectedKeys', value)
    emit('selection-change', value)
}

function onQuerySubmit(filters: QueryFormValues): void {
    emit('query-submit', filters)
}

function onQueryReset(filters: QueryFormValues): void {
    emit('query-reset', filters)
}
</script>

<template>
    <section :class="['data-table-query-page min-w-0', props.class]" data-slot="data-table-query-page">
        <DataTablePage
            :rows="props.table.rows.value"
            :columns="props.columns"
            :row-key="props.rowKey"
            :loading="props.table.loading.value"
            :error="props.table.error.value"
            :pagination="props.pagination"
            :page="props.table.page.value"
            :page-size="props.table.pageSize.value"
            :total="props.table.total.value"
            :page-size-options="props.pageSizeOptions"
            manual-sort
            :sort="props.table.sort.value"
            :selectable="props.selectable"
            :selection-scope="props.selectionScope"
            :selected-keys="props.selectedKeys"
            :enable-view-mode-toggle="props.enableViewModeToggle"
            :view-mode="props.viewMode"
            :default-view-mode="props.defaultViewMode"
            :mobile-cards="props.mobileCards"
            @update:page="updatePage"
            @update:page-size="updatePageSize"
            @update:sort="updateSort"
            @update:selected-keys="updateSelectedKeys"
            @retry="refresh"
        >
            <template #toolbar>
                <DataTableToolbar
                    :model-value="searchValue"
                    :search-placeholder="props.searchPlaceholder"
                    :search-debounce-ms="props.searchDebounceMs"
                    :filters="props.filters"
                    :filter-values="filterValues"
                    :loading="props.table.loading.value"
                    :columns="props.columns"
                    :show-reset="props.showReset"
                    :show-refresh="props.showRefresh"
                    :collapsible-on-mobile="props.collapsibleOnMobile"
                    :hide-view-options="props.hideViewOptions"
                    :on-search="undefined"
                    @update:model-value="updateSearch"
                    @update:filter-values="updateFilterValues"
                    @refresh="refresh"
                >
                    <template #left-actions><slot name="toolbar-actions" /></template>
                    <template #pre-actions><slot name="toolbar-pre-actions" /></template>
                    <template #actions><slot name="toolbar-tools" /></template>
                </DataTableToolbar>
            </template>
            <template #toolbar-bottom>
                <DataTableQueryForm
                    v-if="props.showSearchForm && props.querySchema.length"
                    ref="queryForm"
                    :schema="props.querySchema"
                    :initial-values="props.queryInitialValues"
                    :table="props.table"
                    :normalize-values="props.queryNormalizeValues"
                    :submit-on-change="props.submitOnChange"
                    :change-debounce-ms="props.changeDebounceMs"
                    :collapsed="props.queryFormCollapsed"
                    :show-collapse-button="props.queryFormShowCollapseButton"
                    class="mt-2"
                    @submit="onQuerySubmit"
                    @reset="onQueryReset"
                    @invalid="(errors) => emit('query-invalid', errors)"
                >
                    <template #title><slot name="query-title" /></template>
                    <template #actions="slotProps"><slot name="query-actions" v-bind="slotProps" /></template>
                </DataTableQueryForm>
                <div v-if="$slots.actionbar" class="mt-2 flex min-w-0 items-center">
                    <slot name="actionbar" :table="props.table" :query-form="queryForm" />
                </div>
            </template>
            <template v-if="$slots.table" #table="slotProps"><slot name="table" v-bind="slotProps" /></template>
            <template v-if="$slots.mobile" #mobile="slotProps"><slot name="mobile" v-bind="slotProps" /></template>
            <template v-if="$slots.card" #card="slotProps"><slot name="card" v-bind="slotProps" /></template>
            <template v-if="$slots['card-actions']" #card-actions="slotProps"><slot name="card-actions" v-bind="slotProps" /></template>
        </DataTablePage>
    </section>
</template>
