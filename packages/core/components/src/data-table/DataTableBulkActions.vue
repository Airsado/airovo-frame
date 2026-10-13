<script setup lang="ts">
import { computed, useId } from 'vue'
import { Icon } from '@airovo/shared/icons'
import { Badge, Button, Separator, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@airovo/uikit-shadcnui'

defineOptions({ name: 'DataTableBulkActions' })

const props = withDefaults(defineProps<{
  selectedCount: number
  entityName?: string
  placement?: 'floating' | 'inline'
  class?: string
}>(), {
  entityName: '条记录',
  placement: 'floating',
})

const emit = defineEmits<{
  (event: 'clear-selection'): void
}>()

const descriptionId = `data-table-bulk-actions-${useId()}`
const announcement = computed(() => `已选择 ${props.selectedCount} ${props.entityName}，可执行批量操作`)

function clearSelection(): void {
  emit('clear-selection')
}

function handleKeydown(event: KeyboardEvent): void {
  const target = event.target instanceof HTMLElement ? event.target : undefined
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
  if (target?.closest('[data-slot="dropdown-menu-trigger"], [data-slot="dropdown-menu-content"]')
    || active?.closest('[data-slot="dropdown-menu-trigger"], [data-slot="dropdown-menu-content"]')) return

  if (event.key === 'Escape') {
    event.preventDefault()
    clearSelection()
    return
  }
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return

  const root = event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined
  const buttons = root
    ? [...root.querySelectorAll<HTMLButtonElement>('button:not([disabled])')]
    : []
  if (!buttons.length) return
  event.preventDefault()
  const currentIndex = buttons.indexOf(active as HTMLButtonElement)
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? buttons.length - 1
      : event.key === 'ArrowLeft'
        ? (currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1)
        : (currentIndex + 1) % buttons.length
  buttons[nextIndex]?.focus()
}
</script>

<template>
  <template v-if="props.selectedCount > 0">
    <div aria-live="polite" aria-atomic="true" class="sr-only" role="status">
      {{ announcement }}
    </div>
    <div
      data-slot="data-table-bulk-actions"
      role="toolbar"
      :aria-label="`${props.entityName}批量操作`"
      :aria-describedby="descriptionId"
      tabindex="-1"
      :class="[
        props.placement === 'floating'
          ? 'fixed bottom-6 left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl transition-all delay-100 duration-300 ease-out hover:scale-105'
          : 'w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        props.class,
      ]"
      @keydown="handleKeydown"
    >
      <div class="flex flex-wrap items-center gap-2 rounded-xl border bg-background/95 p-2 shadow-xl supports-[backdrop-filter]:bg-background/70 supports-[backdrop-filter]:backdrop-blur-lg">
        <TooltipProvider :delay-duration="0">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="outline"
                size="icon"
                class="size-7"
                aria-label="清除选择"
                title="清除选择（Escape）"
                @click="clearSelection"
              >
                <Icon icon="lucide:x" class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>清除选择（Escape）</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Separator orientation="vertical" class="h-5" aria-hidden="true" />
        <div :id="descriptionId" class="flex items-center gap-1 text-sm">
          <Badge variant="default" class="min-w-8 justify-center rounded-lg" :aria-label="`${props.selectedCount} 项已选择`">
            {{ props.selectedCount }}
          </Badge>
          <span class="hidden sm:inline">{{ props.entityName }}</span>
          <span>已选择</span>
        </div>
        <Separator orientation="vertical" class="h-5" aria-hidden="true" />
        <div class="flex flex-wrap items-center gap-1.5">
          <slot name="actions" :selected-count="props.selectedCount" :clear-selection="clearSelection">
            <slot :selected-count="props.selectedCount" :clear-selection="clearSelection" />
          </slot>
        </div>
      </div>
    </div>
  </template>
</template>
