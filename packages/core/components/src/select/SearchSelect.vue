<script setup lang="ts">
import { Check, ChevronsUpDown } from '@lucide/vue'
import { computed, ref } from 'vue'
import { cn } from '@airovo/uikit-shadcnui'
import { Button } from '@airovo/uikit-shadcnui/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@airovo/uikit-shadcnui/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@airovo/uikit-shadcnui/components/ui/popover'
import type { SelectOption } from './SelectBox.vue'

const props = withDefaults(defineProps<{
  options?: SelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  class?: string
}>(), {
  options: () => [],
  placeholder: '请选择',
  searchPlaceholder: '搜索选项',
  emptyText: '没有匹配的选项',
  disabled: false,
})

const modelValue = defineModel<string | undefined>()
const open = ref(false)
const selectedLabel = computed(() =>
  props.options.find((option) => option.value === modelValue.value)?.label,
)

function select(value: string): void {
  modelValue.value = value
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :disabled="props.disabled"
        :class="cn('h-8 w-full justify-between rounded-lg font-normal select-none', !selectedLabel && 'text-muted-foreground', props.class)"
      >
        <span class="min-w-0 truncate">{{ selectedLabel ?? props.placeholder }}</span>
        <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-(--reka-popover-trigger-width) min-w-48 rounded-lg border-0 p-0 ring-1 ring-foreground/10" align="start">
      <Command>
        <CommandInput :placeholder="props.searchPlaceholder" />
        <CommandList>
          <CommandEmpty>{{ props.emptyText }}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in props.options"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
              @select="select(option.value)"
            >
              <Check :class="cn('size-4', modelValue === option.value ? 'opacity-100' : 'opacity-0')" />
              {{ option.label }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
