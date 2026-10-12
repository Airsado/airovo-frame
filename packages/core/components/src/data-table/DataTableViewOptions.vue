<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Icon } from '@airovo/shared/icons'
import { Button, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@airovo/uikit-shadcnui'
import { normalizeDataTableColumnVisibility } from './column-visibility'
import type { DataTableColumn, DataTableColumnVisibility } from './types'

defineOptions({ name: 'DataTableViewOptions' })

const props = withDefaults(defineProps<{
  columns: DataTableColumn[]
  modelValue?: DataTableColumnVisibility
  storageKey?: string
  label?: string
}>(), {
  modelValue: () => ({}),
  label: '列显示',
})

const emit = defineEmits<{ (event: 'update:modelValue', value: DataTableColumnVisibility): void }>()
const localVisibility = ref<DataTableColumnVisibility>(normalizeDataTableColumnVisibility(props.columns, props.modelValue))
const configurableColumns = computed(() => props.columns.filter((column) => column.id !== 'selection' && !column.hidden))
const columnId = (column: DataTableColumn): string => column.id ?? column.key
const isVisible = (column: DataTableColumn): boolean => localVisibility.value[columnId(column)] !== false

function persist(value: DataTableColumnVisibility): void {
  if (!props.storageKey || typeof window === 'undefined') return
  try { window.localStorage.setItem(props.storageKey, JSON.stringify(value)) } catch { /* optional storage */ }
}
function setVisible(column: DataTableColumn, value: boolean): void {
  const next = normalizeDataTableColumnVisibility(props.columns, { ...localVisibility.value, [columnId(column)]: value })
  localVisibility.value = next
  persist(next)
  emit('update:modelValue', next)
}
function restoreDefaults(): void {
  const next = normalizeDataTableColumnVisibility(props.columns)
  localVisibility.value = next
  persist(next)
  emit('update:modelValue', next)
}
watch([() => props.modelValue, () => props.columns], ([value]) => {
  localVisibility.value = normalizeDataTableColumnVisibility(props.columns, value)
}, { deep: true })
onMounted(() => {
  if (!props.storageKey || typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(props.storageKey)
    if (raw) {
      const parsed = JSON.parse(raw) as DataTableColumnVisibility
      localVisibility.value = normalizeDataTableColumnVisibility(props.columns, parsed)
      persist(localVisibility.value)
      emit('update:modelValue', localVisibility.value)
    }
  } catch { /* invalid persisted state falls back to defaults */ }
})
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button type="button" variant="outline" size="sm" class="gap-1.5" data-slot="data-table-view-options-trigger" :aria-label="label"><Icon icon="lucide:columns-3" class="size-4" />{{ label }}</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="min-w-48" data-slot="data-table-view-options-menu">
      <DropdownMenuLabel>{{ label }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem v-for="column in configurableColumns" :key="columnId(column)" :model-value="isVisible(column)" @update:model-value="(value) => setVisible(column, value === true)">
        {{ column.title }}
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <button type="button" data-slot="data-table-view-options-reset" aria-label="恢复默认列" class="w-full rounded-sm px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground" @click="restoreDefaults">恢复默认列</button>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
