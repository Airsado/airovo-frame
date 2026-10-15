<script setup lang="ts">
import { computed, useSlots, type Slot } from 'vue'
import DataTableViewModeToggle from './DataTableViewModeToggle.vue'
import DataTableCardGrid from './DataTableCardGrid.vue'
import type { DataTableColumn, DataTableRow, DataTableRowKey, DataTableSelectionScope } from './types'
import { useDataTableViewMode, type DataTableViewMode } from './view-mode'

defineOptions({ name: 'DataTablePage' })

const props = withDefaults(defineProps<{
  class?: string
  mobileCards?: boolean
  enableViewModeToggle?: boolean
  viewMode?: DataTableViewMode
  defaultViewMode?: DataTableViewMode
  viewModeStorageKey?: string
  viewModeToggleDisabled?: boolean
  cardRows?: DataTableRow[]
  cardColumns?: DataTableColumn[]
  cardRowKey?: string | ((row: DataTableRow, index: number) => string | number)
  cardLoading?: boolean
  cardSelectable?: boolean
  cardSelectedKeys?: DataTableRowKey[]
  cardSelectionScope?: DataTableSelectionScope
  cardEmptyText?: string
  cardEmptyDescription?: string
}>(), {
  mobileCards: false,
  enableViewModeToggle: false,
  defaultViewMode: 'table',
  viewModeToggleDisabled: false,
  cardLoading: false,
  cardSelectable: false,
  cardSelectionScope: 'page',
})

const emit = defineEmits<{
  (event: 'update:viewMode', value: DataTableViewMode): void
  (event: 'update:cardSelectedKeys', value: DataTableRowKey[]): void
  (event: 'card-selection-change', value: DataTableRowKey[]): void
}>()

const slots = useSlots()
const hasCardConfig = computed(() => props.cardRows !== undefined && props.cardColumns !== undefined)
const hasCardLayout = computed(() => Boolean(slots.mobile || hasCardConfig.value))
const internal = useDataTableViewMode({
  storageKey: () => props.viewModeStorageKey,
  defaultMode: () => props.defaultViewMode,
})
const resolvedViewMode = computed(() => props.viewMode ?? internal.viewMode.value)
const cardView = computed(() => resolvedViewMode.value === 'card' && hasCardLayout.value)
const hasToolbar = computed(() => Boolean(slots.toolbar || slots['view-toggle'] || props.enableViewModeToggle))
const hasCardOverrides = computed(() => Boolean(slots.card || slots['card-actions']))
const cardCellSlots = computed<Record<string, Slot>>(() => {
  const forwarded: Record<string, Slot> = {}
  for (const column of props.cardColumns ?? []) {
    const slotName = `card-cell-${column.key}`
    if (slots[slotName]) forwarded[column.key] = slots[slotName]!
  }
  return forwarded
})
const cardGridProps = computed(() => ({
  rows: props.cardRows,
  columns: props.cardColumns,
  rowKey: props.cardRowKey,
  loading: props.cardLoading,
  selectable: props.cardSelectable,
  selectedKeys: props.cardSelectedKeys,
  selectionScope: props.cardSelectionScope,
  emptyText: props.cardEmptyText,
  emptyDescription: props.cardEmptyDescription,
  cellSlots: cardCellSlots.value,
}))

function setViewMode(value: DataTableViewMode): void {
  internal.setViewMode(value)
  emit('update:viewMode', value)
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
    <div v-if="$slots.table && !cardView" :class="mobileCards ? 'hidden sm:block' : undefined">
      <slot name="table" />
    </div>
    <div v-if="hasCardLayout && (cardView || mobileCards)" :class="cardView ? 'min-w-0' : 'sm:hidden'">
      <slot v-if="$slots.mobile" name="mobile" />
      <DataTableCardGrid
        v-else-if="!hasCardOverrides"
        v-bind="cardGridProps"
        @update:selected-keys="emit('update:cardSelectedKeys', $event)"
        @selection-change="emit('card-selection-change', $event)"
      />
      <DataTableCardGrid
        v-else
        v-bind="cardGridProps"
        @update:selected-keys="emit('update:cardSelectedKeys', $event)"
        @selection-change="emit('card-selection-change', $event)"
      >
        <template v-if="$slots.card" #card="slotProps"><slot name="card" v-bind="slotProps" /></template>
        <template v-if="$slots['card-actions']" #card-actions="slotProps"><slot name="card-actions" v-bind="slotProps" /></template>
      </DataTableCardGrid>
    </div>
    <slot v-if="!$slots.table && !mobileCards && !cardView" />
  </section>
</template>
