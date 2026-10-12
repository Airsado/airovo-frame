<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Icon } from '@airovo/shared/icons'
import { Button, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@airovo/uikit-shadcnui'
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
const localVisibility = ref<DataTableColumnVisibility>({ ...props.modelValue })
const configurableColumns = computed(() => props.columns.filter((column) => column.id !== 'selection' && !column.hidden))
const columnId = (column: DataTableColumn): string => column.id ?? column.key
const isVisible = (column: DataTableColumn): boolean => localVisibility.value[columnId(column)] !== false

function persist(value: DataTableColumnVisibility): void {
  if (!props.storageKey || typeof window === 'undefined') return
  try { window.localStorage.setItem(props.storageKey, JSON.stringify(value)) } catch { /* optional storage */ }
}
function setVisible(column: DataTableColumn, value: boolean): void {
  const next = { ...localVisibility.value, [columnId(column)]: value }
  if (Object.values(next).every((visible) => visible === false)) return
  localVisibility.value = next
  persist(next)
  emit('update:modelValue', next)
}
function restoreDefaults(): void {
  const next = Object.fromEntries(configurableColumns.value.map((column) => [columnId(column), true]))
  localVisibility.value = next
  persist(next)
  emit('update:modelValue', next)
}
watch(() => props.modelValue, (value) => { localVisibility.value = { ...value } }, { deep: true })
onMounted(() => {
  if (!props.storageKey || typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(props.storageKey)
    if (raw) {
      const parsed = JSON.parse(raw) as DataTableColumnVisibility
      localVisibility.value = { ...localVisibility.value, ...parsed }
      emit('update:modelValue', localVisibility.value)
    }
  } catch { /* invalid persisted state falls back to defaults */ }
})
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button type="button" variant="outline" size="sm" class="gap-1.5"><Icon icon="lucide:columns-3" class="size-4" />{{ label }}</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="min-w-48">
      <DropdownMenuLabel>{{ label }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem v-for="column in configurableColumns" :key="columnId(column)" :model-value="isVisible(column)" @update:model-value="(value) => setVisible(column, value === true)">
        {{ column.title }}
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <button type="button" class="w-full rounded-sm px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground" @click="restoreDefaults">恢复默认列</button>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
