<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@airovo/shared/icons'
import { Button, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@airovo/uikit-shadcnui'
import { normalizeDataTableColumnVisibility } from './column-visibility'
import type { DataTableColumn, DataTableColumnVisibility } from './types'

defineOptions({ name: 'DataTableViewOptions' })

const props = withDefaults(defineProps<{
  columns: DataTableColumn[]
  modelValue?: DataTableColumnVisibility
  storageKey?: string
  label?: string
  resetLabel?: string
  modal?: boolean
  dropdownContentClass?: string
}>(), {
  modelValue: () => ({}),
  modal: false,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: DataTableColumnVisibility): void
  (event: 'dropdown-open-change', open: boolean): void
}>()
const { t, te } = useI18n({ useScope: 'global' })
function copy(key: string, fallback: string): string { return te(key) ? t(key) : fallback }
const resolvedLabel = computed(() => props.label ?? copy('common.columnVisibility', '列显示'))
const resolvedResetLabel = computed(() => props.resetLabel ?? copy('common.restoreColumns', '恢复默认列'))
const resolvedGroupLabel = computed(() => copy('common.columnVisibilityOptions', '列显示选项'))
const localVisibility = ref<DataTableColumnVisibility>(normalizeDataTableColumnVisibility(props.columns, props.modelValue))
const configurableColumns = computed(() => props.columns.filter((column) => column.id !== 'selection' && !column.hidden && column.hideable !== false))
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
  <DropdownMenu :modal="props.modal" @update:open="(open) => emit('dropdown-open-change', open)">
    <DropdownMenuTrigger as-child>
      <Button type="button" variant="outline" size="sm" class="shrink-0 gap-1.5" data-slot="data-table-view-options-trigger" :aria-label="resolvedLabel"><Icon icon="lucide:columns-3" class="size-4" />{{ resolvedLabel }}</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" :class="['w-[150px]', props.dropdownContentClass]" data-slot="data-table-view-options-menu">
      <DropdownMenuGroup :aria-label="resolvedGroupLabel" data-slot="data-table-view-options-group">
        <DropdownMenuLabel>{{ resolvedLabel }}</DropdownMenuLabel>
        <DropdownMenuCheckboxItem v-for="column in configurableColumns" :key="columnId(column)" :model-value="isVisible(column)" class="capitalize" @update:model-value="(value) => setVisible(column, value === true)">
          {{ column.title }}
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem as-child data-slot="data-table-view-options-reset" :aria-label="resolvedResetLabel">
        <button type="button" class="w-full text-left text-xs text-muted-foreground" @click="restoreDefaults">{{ resolvedResetLabel }}</button>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
