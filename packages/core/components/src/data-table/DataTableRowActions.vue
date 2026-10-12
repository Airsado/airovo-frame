<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import { Icon } from '@airovo/shared/icons'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@airovo/uikit-shadcnui'
import type { DataTableRowAction } from './types'

defineOptions({ name: 'DataTableRowActions' })
const props = withDefaults(defineProps<{
  row: T
  actions?: DataTableRowAction<T>[]
  dropdownActions?: DataTableRowAction<T>[]
  hasPermission?: (permission?: string | string[]) => boolean
}>(), { actions: () => [], dropdownActions: () => [] })
function allowed(action: DataTableRowAction<T>): boolean {
  if (action.permission && props.hasPermission && !props.hasPermission(action.permission)) return false
  return typeof action.visible === 'function' ? action.visible(props.row) : action.visible !== false
}
function state(value: boolean | ((row: T) => boolean) | undefined): boolean { return typeof value === 'function' ? value(props.row) : value === true }
const visibleActions = computed(() => props.actions.filter(allowed))
const visibleDropdownActions = computed(() => props.dropdownActions.filter(allowed))
function select(action: DataTableRowAction<T>): void { if (!state(action.disabled) && !state(action.loading)) action.onSelect?.(props.row) }
</script>

<template>
  <div class="flex items-center justify-end gap-1">
    <Button v-for="action in visibleActions" :key="action.key" type="button" :variant="action.variant ?? 'ghost'" size="sm" class="gap-1.5" :disabled="state(action.disabled) || state(action.loading)" @click="select(action)">
      <Icon v-if="action.icon" :icon="action.icon" class="size-3.5" :class="state(action.loading) && 'animate-spin'" />{{ action.label }}
    </Button>
    <DropdownMenu v-if="visibleDropdownActions.length">
      <DropdownMenuTrigger as-child><Button type="button" variant="ghost" size="icon" class="size-8" aria-label="更多操作"><Icon icon="lucide:ellipsis" class="size-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <template v-for="(action, index) in visibleDropdownActions" :key="action.key">
          <DropdownMenuSeparator v-if="index > 0" />
          <DropdownMenuItem :disabled="state(action.disabled) || state(action.loading)" @select="select(action)"><Icon v-if="action.icon" :icon="action.icon" class="size-4" />{{ action.label }}</DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
