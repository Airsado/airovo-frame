<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { Icon } from '@airovo/shared/icons'
import { Button, Input } from '@airovo/uikit-shadcnui'
import FacetedFilter from '../faceted-filter/FacetedFilter.vue'
import type { DataTableColumn, DataTableColumnVisibility, DataTableFilterGroup, DataTableFilterValue } from './types'
import DataTableViewOptions from './DataTableViewOptions.vue'
import DataTableMobileFilterPanel from './DataTableMobileFilterPanel.vue'

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
  collapsibleOnMobile?: boolean
  hasAdditionalFilters?: boolean
  onSearch?: () => void | Promise<void>
  searchLoading?: boolean
  hideViewOptions?: boolean
  hasExpandedActiveFilters?: boolean
  class?: string
}>(), {
  modelValue: '', searchPlaceholder: '搜索…', searchDebounceMs: 300,
  filters: () => [], filterValues: () => ({}), loading: false,
  showReset: true, showRefresh: true, collapsibleOnMobile: false,
  hasAdditionalFilters: false, searchLoading: false, hideViewOptions: false,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'update:filterValues', value: Record<string, DataTableFilterValue>): void
  (event: 'reset'): void
  (event: 'refresh'): void
  (event: 'update:columnVisibility', value: DataTableColumnVisibility): void
}>()

const slots = useSlots()
const draft = ref(props.modelValue)
const expanded = ref(false)
const composing = ref(false)
const isMobileViewport = ref(false)
let mediaQuery: MediaQueryList | undefined
let timer: ReturnType<typeof setTimeout> | undefined

function updateViewport(): void { isMobileViewport.value = mediaQuery?.matches ?? false }
onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  mediaQuery = window.matchMedia('(max-width: 640px)')
  updateViewport()
  mediaQuery.addEventListener?.('change', updateViewport)
})
onBeforeUnmount(() => mediaQuery?.removeEventListener?.('change', updateViewport))

watch(() => props.modelValue, (value) => { if (!composing.value) draft.value = value })
watch(draft, (value) => {
  if (timer) clearTimeout(timer)
  if (composing.value || props.onSearch) return
  timer = setTimeout(() => emit('update:modelValue', value), Math.max(0, props.searchDebounceMs))
})
onBeforeUnmount(() => { if (timer) clearTimeout(timer) })

const isFiltered = computed(() => Boolean(
  draft.value || props.hasAdditionalFilters || Object.values(props.filterValues).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value)),
))
const hasExpandable = computed(() => Boolean(slots.expandable))

function updateFilter(key: string, value: DataTableFilterValue): void { emit('update:filterValues', { ...props.filterValues, [key]: value }) }
function reset(): void { draft.value = ''; emit('update:modelValue', ''); emit('update:filterValues', {}); emit('reset') }
function commitSearch(): void { if (!composing.value) { emit('update:modelValue', draft.value); void props.onSearch?.() } }
function clearSearch(): void { draft.value = ''; if (props.onSearch) commitSearch() }
function startComposition(): void { composing.value = true }
function endComposition(): void { composing.value = false; if (!props.onSearch) emit('update:modelValue', draft.value) }
</script>

<template>
  <DataTableMobileFilterPanel v-if="props.collapsibleOnMobile && isMobileViewport" :class="props.class" compact>
    <template #default>
      <slot name="custom-search">
        <div class="relative min-w-0 flex-1 sm:max-w-xs">
          <Icon icon="lucide:search" class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="draft" :placeholder="props.searchPlaceholder" class="h-8 w-full pl-8 pr-8 text-sm" @compositionstart="startComposition" @compositionend="endComposition" />
          <Button v-if="draft" type="button" variant="ghost" size="icon" class="absolute right-0.5 top-0.5 size-7 text-muted-foreground" aria-label="清除搜索" @click="clearSearch"><Icon icon="lucide:x" class="size-3.5" /></Button>
        </div>
      </slot>
      <slot name="additional-search" />
      <FacetedFilter v-for="filter in props.filters" :key="filter.key" :model-value="props.filterValues[filter.key]" :title="filter.title" :options="filter.options" :single-select="filter.singleSelect" @update:model-value="(value) => updateFilter(filter.key, value)" />
      <template v-if="hasExpandable">
        <slot v-if="expanded" name="expandable" />
        <Button type="button" variant="ghost" size="sm" :aria-expanded="expanded" :class="['gap-1 px-2 text-muted-foreground hover:text-foreground', props.hasExpandedActiveFilters && !expanded && 'text-primary hover:text-primary']" @click="expanded = !expanded">{{ expanded ? '收起' : '展开' }}<Icon icon="lucide:chevron-down" :class="['size-3.5 transition-transform duration-200', expanded && 'rotate-180']" /></Button>
      </template>
    </template>
    <template #actions>
      <slot name="left-actions" /><slot name="pre-actions" />
      <Button v-if="props.showReset && (props.onSearch || isFiltered)" type="button" :variant="props.onSearch ? 'outline' : 'ghost'" size="sm" :disabled="props.onSearch ? !isFiltered : false" :class="!props.onSearch && 'text-muted-foreground hover:text-foreground'" @click="reset">重置<span v-if="!props.onSearch" class="ml-1">×</span></Button>
      <Button v-if="props.onSearch" type="button" size="sm" :disabled="props.searchLoading" @click="commitSearch"><Icon v-if="props.searchLoading" icon="lucide:loader-circle" class="size-4 animate-spin" />搜索</Button>
      <slot name="view-toggle" />
      <DataTableViewOptions v-if="props.columns?.length && !props.hideViewOptions" :columns="props.columns" :model-value="props.columnVisibility" :storage-key="props.columnVisibilityStorageKey" @update:model-value="(value) => emit('update:columnVisibility', value)" />
      <Button v-if="props.showRefresh" type="button" variant="ghost" size="icon" class="size-8 text-muted-foreground" :disabled="props.loading" aria-label="刷新" @click="emit('refresh')"><Icon icon="lucide:refresh-cw" :class="['size-4', props.loading && 'animate-spin']" /></Button><slot name="actions" />
    </template>
  </DataTableMobileFilterPanel>

  <div v-else :class="['flex min-w-0 flex-col gap-2', props.class]">
    <div class="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
      <slot name="custom-search">
        <div class="relative min-w-52 flex-1 sm:max-w-xs">
          <Icon icon="lucide:search" class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="draft" :placeholder="props.searchPlaceholder" class="h-8 pl-8 pr-8 text-sm" @compositionstart="startComposition" @compositionend="endComposition" />
          <Button v-if="draft" type="button" variant="ghost" size="icon" class="absolute right-0.5 top-0.5 size-7 text-muted-foreground" aria-label="清除搜索" @click="clearSearch"><Icon icon="lucide:x" class="size-3.5" /></Button>
        </div>
      </slot>
      <slot name="additional-search" />
      <FacetedFilter v-for="filter in props.filters" :key="filter.key" :model-value="props.filterValues[filter.key]" :title="filter.title" :options="filter.options" :single-select="filter.singleSelect" @update:model-value="(value) => updateFilter(filter.key, value)" />
      <Button v-if="hasExpandable" type="button" variant="ghost" size="sm" :aria-expanded="expanded" :class="['ml-auto gap-1 px-2 text-muted-foreground hover:text-foreground', props.hasExpandedActiveFilters && !expanded && 'text-primary hover:text-primary']" @click="expanded = !expanded">{{ expanded ? '收起' : '展开' }}<Icon icon="lucide:chevron-down" :class="['size-3.5 transition-transform duration-200', expanded && 'rotate-180']" /></Button>
      <div class="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <slot name="pre-actions" />
        <Button v-if="props.showReset && (props.onSearch || isFiltered)" type="button" :variant="props.onSearch ? 'outline' : 'ghost'" size="sm" :disabled="props.onSearch ? !isFiltered : false" :class="!props.onSearch && 'text-muted-foreground hover:text-foreground'" @click="reset">重置<span v-if="!props.onSearch" class="ml-1">×</span></Button>
        <Button v-if="props.onSearch" type="button" size="sm" :disabled="props.searchLoading" @click="commitSearch"><Icon v-if="props.searchLoading" icon="lucide:loader-circle" class="size-4 animate-spin" />搜索</Button>
        <slot name="view-toggle" />
        <DataTableViewOptions v-if="props.columns?.length && !props.hideViewOptions" :columns="props.columns" :model-value="props.columnVisibility" :storage-key="props.columnVisibilityStorageKey" @update:model-value="(value) => emit('update:columnVisibility', value)" />
        <Button v-if="props.showRefresh" type="button" variant="ghost" size="icon" class="size-8 text-muted-foreground" :disabled="props.loading" aria-label="刷新" @click="emit('refresh')"><Icon icon="lucide:refresh-cw" :class="['size-4', props.loading && 'animate-spin']" /></Button><slot name="actions" />
      </div>
    </div>
    <div v-if="expanded && hasExpandable" class="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3"><slot name="expandable" /></div>
    <div v-if="$slots['left-actions']" class="flex flex-wrap items-center gap-2 sm:gap-3"><slot name="left-actions" /></div>
  </div>
</template>
