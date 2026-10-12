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
import { flattenSelectOptions, selectableSelectOptions, type SelectOption } from './options'

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
const flattenedOptions = computed(() => flattenSelectOptions(props.options))
const selectableOptions = computed(() => selectableSelectOptions(props.options))
const open = ref(false)
const selectedLabel = computed(() =>
  selectableOptions.value.find((option) => option.value === modelValue.value)?.label,
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
            <template v-for="item in flattenedOptions" :key="`${item.option.label}:${item.depth}:${item.option.value ?? 'group'}`">
              <div v-if="item.group" class="px-2 py-1.5 text-xs font-semibold text-muted-foreground" :style="{ paddingLeft: `${0.5 + item.depth * 0.75}rem` }">{{ item.option.label }}</div>
              <CommandItem v-else-if="item.option.value !== undefined" :value="item.option.value" :disabled="item.option.disabled" :style="{ paddingLeft: `${0.5 + item.depth * 0.75}rem` }" @select="select(item.option.value)">
                <Check :class="cn('size-4', modelValue === item.option.value ? 'opacity-100' : 'opacity-0')" />
                {{ item.option.label }}
              </CommandItem>
            </template>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
