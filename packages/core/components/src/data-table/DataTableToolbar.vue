<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { Icon } from '@airovo/shared/icons'
import { Button, Input } from '@airovo/uikit-shadcnui'
import FacetedFilter from '../faceted-filter/FacetedFilter.vue'
import type { DataTableColumn, DataTableColumnVisibility, DataTableFilterGroup, DataTableFilterValue } from './types'
import DataTableViewOptions from './DataTableViewOptions.vue'

defineOptions({ name: 'DataTableToolbar' })

const props = withDefaults(defineProps<{
  modelValue?: string
  searchPlaceholder?: string
  searchDebounceMs?: number
  filters?: DataTableFilterGroup[]
  filterValues?: Record<string, DataTableFilterValue>
  loading?: boolean
  columns?: DataTableColumn[]
  columnVisibility?: DataTableColumnVisibility
  columnVisibilityStorageKey?: string
  showReset?: boolean
  showRefresh?: boolean
}>(), {
  modelValue: '',
  searchPlaceholder: '搜索…',
  searchDebounceMs: 300,
  filters: () => [],
  filterValues: () => ({}),
  loading: false,
  showReset: true,
  showRefresh: true,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'update:filterValues', value: Record<string, DataTableFilterValue>): void
  (event: 'reset'): void
  (event: 'refresh'): void
  (event: 'update:columnVisibility', value: DataTableColumnVisibility): void
}>()

const draft = ref(props.modelValue)
let timer: ReturnType<typeof setTimeout> | undefined
watch(() => props.modelValue, (value) => { draft.value = value })
watch(draft, (value) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => emit('update:modelValue', value), Math.max(0, props.searchDebounceMs))
})
onBeforeUnmount(() => { if (timer) clearTimeout(timer) })

function updateFilter(key: string, value: DataTableFilterValue): void { emit('update:filterValues', { ...props.filterValues, [key]: value }) }
function reset(): void {
  draft.value = ''
  emit('update:modelValue', '')
  emit('update:filterValues', {})
  emit('reset')
}
</script>

<template>
  <div class="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
    <div class="relative min-w-52 flex-1 sm:max-w-xs">
      <Icon icon="lucide:search" class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="draft" :placeholder="searchPlaceholder" class="h-8 pl-8 pr-8 text-sm" />
      <Button v-if="draft" type="button" variant="ghost" size="icon" class="absolute right-0.5 top-0.5 size-7 text-muted-foreground" aria-label="清除搜索" @click="draft = ''"><Icon icon="lucide:x" class="size-3.5" /></Button>
    </div>
    <FacetedFilter v-for="filter in filters" :key="filter.key" :model-value="filterValues[filter.key]" :title="filter.title" :options="filter.options" :single-select="filter.singleSelect" @update:model-value="(value) => updateFilter(filter.key, value)" />
    <div class="ml-auto flex shrink-0 items-center gap-1.5">
      <Button v-if="showReset" type="button" variant="ghost" size="sm" class="text-muted-foreground" @click="reset">重置</Button>
      <Button v-if="showRefresh" type="button" variant="ghost" size="icon" class="size-8 text-muted-foreground" :disabled="loading" aria-label="刷新" @click="emit('refresh')"><Icon icon="lucide:refresh-cw" :class="['size-4', loading && 'animate-spin']" /></Button>
      <DataTableViewOptions v-if="columns?.length" :columns="columns" :model-value="columnVisibility" :storage-key="columnVisibilityStorageKey" @update:model-value="(value) => emit('update:columnVisibility', value)" />
      <slot name="actions" />
    </div>
  </div>
</template>
