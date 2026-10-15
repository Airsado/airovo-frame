<script setup lang="ts">
import { computed, useSlots } from 'vue'
import DataTableViewModeToggle from './DataTableViewModeToggle.vue'
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
}>(), {
  mobileCards: false,
  enableViewModeToggle: false,
  defaultViewMode: 'table',
  viewModeToggleDisabled: false,
})

const emit = defineEmits<{
  (event: 'update:viewMode', value: DataTableViewMode): void
}>()

const slots = useSlots()
const internal = useDataTableViewMode({
  storageKey: () => props.viewModeStorageKey,
  defaultMode: () => props.defaultViewMode,
})
const resolvedViewMode = computed(() => props.viewMode ?? internal.viewMode.value)
const cardView = computed(() => resolvedViewMode.value === 'card' && Boolean(slots.mobile))
const hasToolbar = computed(() => Boolean(slots.toolbar || slots['view-toggle'] || props.enableViewModeToggle))

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
    <div v-if="$slots.mobile && (cardView || mobileCards)" :class="cardView ? 'min-w-0' : 'sm:hidden'">
      <slot name="mobile" />
    </div>
    <slot v-if="!$slots.table && !mobileCards && !cardView" />
  </section>
</template>
