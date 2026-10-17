<script setup lang="ts">
import { computed, inject, ref, useSlots, type Slot } from 'vue'
import DataTableViewModeToggle from './DataTableViewModeToggle.vue'
import DataTable from './DataTable.vue'
import DataTableCardGrid from './DataTableCardGrid.vue'
import DataTableMobileCardList from './DataTableMobileCardList.vue'
import DataTablePagination from './DataTablePagination.vue'
import PageFooterPortal from '../section-page/PageFooterPortal.vue'
import { pageFooterTargetKey } from '../section-page/page-footer-context'
import type { DataTableColumn, DataTableColumnPinning, DataTableColumnVisibility, DataTableRow, DataTableRowKey, DataTableSelectionScope, DataTableSort } from './types'
import { useDataTableViewMode, type DataTableViewMode } from './view-mode'

defineOptions({ name: 'DataTablePage' })

const props = withDefaults(defineProps<{
  class?: string
  mobileCards?: boolean
  /** Render pagination in the surrounding SectionPage footer when available. */
  paginationInFooter?: boolean
  enableViewModeToggle?: boolean
  viewMode?: DataTableViewMode
  defaultViewMode?: DataTableViewMode
  viewModeStorageKey?: string
  viewModeToggleDisabled?: boolean

  /** Shared table/card source. Supplying rows and columns enables the built-in table. */
  rows?: DataTableRow[]
  columns?: DataTableColumn[]
  rowKey?: string | ((row: DataTableRow) => DataTableRowKey)
  loading?: boolean
  error?: unknown
  errorText?: string
  emptyText?: string
  emptyDescription?: string
  emptyIcon?: string
  selectable?: boolean
  selectedKeys?: DataTableRowKey[]
  selectionScope?: DataTableSelectionScope
  pagination?: boolean
  page?: number
  pageSize?: number
  total?: number
  pageSizeOptions?: number[]
  manualSort?: boolean
  sort?: DataTableSort
  columnVisibility?: DataTableColumnVisibility
  columnSizing?: Record<string, number>
  columnSizingStorageKey?: string
  columnPinning?: DataTableColumnPinning
  columnPinningStorageKey?: string
  height?: string | number
  maxHeight?: string | number

  /** Legacy card-only source. Prefer the shared source above. */
  cardRows?: DataTableRow[]
  cardColumns?: DataTableColumn[]
  cardRowKey?: string | ((row: DataTableRow, index: number) => string | number)
  cardLoading?: boolean
  cardSelectable?: boolean
  cardSelectedKeys?: DataTableRowKey[]
  cardSelectionScope?: DataTableSelectionScope
  cardEmptyText?: string
  cardEmptyDescription?: string
  cardError?: unknown
  cardErrorText?: string
}>(), {
  mobileCards: false,
  enableViewModeToggle: false,
  defaultViewMode: 'table',
  viewModeToggleDisabled: false,
  paginationInFooter: true,
  cardLoading: false,
  cardSelectable: false,
  cardSelectionScope: 'page',
})

const emit = defineEmits<{
  (event: 'update:viewMode', value: DataTableViewMode): void
  (event: 'update:selectedKeys', value: DataTableRowKey[]): void
  (event: 'selection-change', value: DataTableRowKey[]): void
  (event: 'update:cardSelectedKeys', value: DataTableRowKey[]): void
  (event: 'card-selection-change', value: DataTableRowKey[]): void
  (event: 'update:page', value: number): void
  (event: 'update:pageSize', value: number): void
  (event: 'update:sort', value?: DataTableSort): void
  (event: 'sort-change', value?: DataTableSort): void
  (event: 'update:columnVisibility', value: DataTableColumnVisibility): void
  (event: 'update:columnSizing', value: Record<string, number>): void
  (event: 'update:columnPinning', value: DataTableColumnPinning): void
  (event: 'retry'): void
}>()

const slots = useSlots()
const pageFooterTarget = inject(pageFooterTargetKey, null)
const hasPageFooterTarget = computed(() => Boolean(pageFooterTarget?.value))
const internalSelectedKeys = ref<DataTableRowKey[]>([])
const internalPage = ref(props.page ?? 1)
const internalPageSize = ref(props.pageSize ?? 20)
const internalSort = ref<DataTableSort | undefined>(props.sort)
const resolvedRows = computed(() => props.rows ?? props.cardRows ?? [])
const resolvedColumns = computed(() => props.columns ?? props.cardColumns ?? [])
const hasSharedSource = computed(() => props.rows !== undefined && props.columns !== undefined)
const hasCardConfig = computed(() => Boolean((props.rows !== undefined || props.cardRows !== undefined) && (props.columns !== undefined || props.cardColumns !== undefined)))
const hasCardLayout = computed(() => Boolean(slots.mobile || hasCardConfig.value))
const resolvedLoading = computed(() => Boolean(props.loading || props.cardLoading))
const resolvedError = computed(() => props.error ?? props.cardError)
const resolvedErrorText = computed(() => props.errorText ?? props.cardErrorText)
const resolvedSelectable = computed(() => Boolean(props.selectable || props.cardSelectable))
const resolvedSelectionScope = computed(() => props.selectionScope ?? props.cardSelectionScope)
const resolvedSelectedKeys = computed(() => props.selectedKeys ?? props.cardSelectedKeys ?? internalSelectedKeys.value)
const resolvedPage = computed(() => props.page ?? internalPage.value)
const resolvedPageSize = computed(() => props.pageSize ?? internalPageSize.value)
const resolvedSort = computed(() => props.sort ?? internalSort.value)
const resolvedTableRowKey = computed<string | ((row: DataTableRow) => DataTableRowKey)>(() => {
  if (props.rowKey !== undefined) return props.rowKey
  const legacyRowKey = props.cardRowKey
  if (typeof legacyRowKey === 'function') {
    // Keep the legacy callback's index when the shared source is rendered by
    // DataTable. DataTable callbacks currently receive only the row, so
    // resolve the index against the same rows collection.
    return (row) => legacyRowKey(row, resolvedRows.value.indexOf(row))
  }
  return typeof props.cardRowKey === 'string' ? props.cardRowKey : 'id'
})
const resolvedCardRowKey = computed(() => props.cardRowKey ?? props.rowKey ?? 'id')
const hasAutoTable = computed(() => hasSharedSource.value && !slots.table)
const hasToolbar = computed(() => Boolean(slots.toolbar || slots['view-toggle'] || props.enableViewModeToggle))

const internal = useDataTableViewMode({
  storageKey: () => props.viewModeStorageKey,
  defaultMode: () => props.defaultViewMode,
})
const resolvedViewMode = computed(() => props.viewMode ?? internal.viewMode.value)
const cardView = computed(() => resolvedViewMode.value === 'card' && hasCardLayout.value)

const cardCellSlots = computed<Record<string, Slot>>(() => {
  const forwarded: Record<string, Slot> = {}
  for (const column of resolvedColumns.value) {
    const slotName = `card-cell-${column.key}`
    if (slots[slotName]) forwarded[column.key] = slots[slotName]!
  }
  return forwarded
})

const tableProps = computed(() => ({
  columns: resolvedColumns.value,
  data: resolvedRows.value,
  rowKey: resolvedTableRowKey.value,
  loading: resolvedLoading.value,
  error: resolvedError.value,
  errorText: resolvedErrorText.value,
  emptyText: props.emptyText,
  emptyDescription: props.emptyDescription,
  emptyIcon: props.emptyIcon,
  selectable: resolvedSelectable.value,
  selectedKeys: resolvedSelectedKeys.value,
  selectionScope: resolvedSelectionScope.value,
  pagination: Boolean(props.pagination && !props.paginationInFooter),
  page: resolvedPage.value,
  pageSize: resolvedPageSize.value,
  total: props.total,
  pageSizeOptions: props.pageSizeOptions,
  manualSort: props.manualSort,
  sort: resolvedSort.value,
  columnVisibility: props.columnVisibility,
  columnSizing: props.columnSizing,
  columnSizingStorageKey: props.columnSizingStorageKey,
  columnPinning: props.columnPinning,
  columnPinningStorageKey: props.columnPinningStorageKey,
  height: props.height,
  maxHeight: props.maxHeight,
}))

const tableSlotProps = computed(() => ({
  ...tableProps.value,
  selectedKeys: resolvedSelectedKeys.value,
  updateSelectedKeys,
  updatePage,
  updatePageSize,
  updateSort,
  retry,
}))

const cardGridProps = computed(() => ({
  rows: resolvedRows.value,
  columns: resolvedColumns.value,
  rowKey: resolvedCardRowKey.value,
  loading: resolvedLoading.value,
  error: resolvedError.value,
  errorText: resolvedErrorText.value,
  selectable: resolvedSelectable.value,
  selectedKeys: resolvedSelectedKeys.value,
  selectionScope: resolvedSelectionScope.value,
  pagination: Boolean(props.pagination && !props.paginationInFooter),
  page: resolvedPage.value,
  pageSize: resolvedPageSize.value,
  total: props.total,
  pageSizeOptions: props.pageSizeOptions,
  emptyText: props.cardEmptyText ?? props.emptyText,
  emptyDescription: props.cardEmptyDescription ?? props.emptyDescription,
  emptyIcon: props.emptyIcon,
  cellSlots: cardCellSlots.value,
}))

function setViewMode(value: DataTableViewMode): void {
  internal.setViewMode(value)
  emit('update:viewMode', value)
}

function updateSelectedKeys(value: DataTableRowKey[], source: 'table' | 'card' = 'table'): void {
  if (props.selectedKeys === undefined && props.cardSelectedKeys === undefined) internalSelectedKeys.value = [...value]
  emit('update:selectedKeys', value)
  emit('selection-change', value)
  if (props.cardSelectedKeys !== undefined || !hasSharedSource.value) emit('update:cardSelectedKeys', value)
  if (source === 'card') emit('card-selection-change', value)
}

function updatePage(value: number): void {
  if (props.page === undefined) internalPage.value = value
  emit('update:page', value)
}

function updatePageSize(value: number): void {
  if (props.pageSize === undefined) internalPageSize.value = value
  emit('update:pageSize', value)
}

function updateSort(value?: DataTableSort): void {
  if (props.sort === undefined) internalSort.value = value
  emit('update:sort', value)
  emit('sort-change', value)
}

function retry(): void {
  emit('retry')
}
</script>

<template>
  <section :class="['min-w-0 space-y-3', $props.class]">
    <div v-if="hasToolbar" class="flex min-w-0 flex-wrap items-center gap-2">
      <slot name="toolbar" />
      <slot name="view-toggle" :view-mode="resolvedViewMode" :set-view-mode="setViewMode">
        <DataTableViewModeToggle
          v-if="props.enableViewModeToggle"
          :model-value="resolvedViewMode"
          :disabled="props.viewModeToggleDisabled"
          class="ml-auto"
          @update:model-value="setViewMode"
        />
      </slot>
    </div>
    <slot name="toolbar-bottom" />
    <div v-if="($slots.table || hasAutoTable) && !cardView" :class="mobileCards ? 'hidden sm:block' : undefined">
      <slot v-if="$slots.table" name="table" v-bind="tableSlotProps" />
      <DataTable
        v-else
        v-bind="tableProps"
        @update:selected-keys="updateSelectedKeys"
        @update:page="updatePage"
        @update:page-size="updatePageSize"
        @update:sort="updateSort"
        @update:column-visibility="(value) => emit('update:columnVisibility', value)"
        @update:column-sizing="(value) => emit('update:columnSizing', value)"
        @update:column-pinning="(value) => emit('update:columnPinning', value)"
        @retry="retry"
      />
    </div>
    <div v-if="hasCardLayout && (cardView || mobileCards)" :class="cardView ? 'min-w-0' : 'sm:hidden'">
      <slot v-if="$slots.mobile" name="mobile" :rows="resolvedRows" :selected-keys="resolvedSelectedKeys" />
      <DataTableCardGrid
        v-else-if="cardView"
        v-bind="cardGridProps"
        @update:selected-keys="(value) => updateSelectedKeys(value, 'card')"
        @update:page="updatePage"
        @update:page-size="updatePageSize"
        @retry="retry"
      >
        <template v-if="$slots.card" #card="slotProps"><slot name="card" v-bind="slotProps" /></template>
        <template v-if="$slots['card-actions']" #card-actions="slotProps"><slot name="card-actions" v-bind="slotProps" /></template>
      </DataTableCardGrid>
      <DataTableMobileCardList
        v-else
        v-bind="cardGridProps"
        @update:selected-keys="(value) => updateSelectedKeys(value, 'card')"
        @update:page="updatePage"
        @update:page-size="updatePageSize"
        @retry="retry"
      >
        <template v-if="$slots.card" #card="slotProps"><slot name="card" v-bind="slotProps" /></template>
        <template v-if="$slots['card-actions']" #card-actions="slotProps"><slot name="card-actions" v-bind="slotProps" /></template>
      </DataTableMobileCardList>
    </div>
    <slot v-if="!$slots.table && !hasAutoTable && !mobileCards && !cardView" />

    <PageFooterPortal v-if="props.pagination && props.paginationInFooter && hasPageFooterTarget">
      <DataTablePagination
        :page="resolvedPage"
        :page-size="resolvedPageSize"
        :total="props.total ?? resolvedRows.length"
        :page-size-options="props.pageSizeOptions"
        :compact="false"
        @update:page="updatePage"
        @update:page-size="updatePageSize"
      />
    </PageFooterPortal>
    <div v-else-if="props.pagination && props.paginationInFooter" class="pt-2">
      <DataTablePagination
        :page="resolvedPage"
        :page-size="resolvedPageSize"
        :total="props.total ?? resolvedRows.length"
        :page-size-options="props.pageSizeOptions"
        :compact="false"
        @update:page="updatePage"
        @update:page-size="updatePageSize"
      />
    </div>
  </section>
</template>
