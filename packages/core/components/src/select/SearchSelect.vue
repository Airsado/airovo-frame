<script setup lang="ts">
import { Check, ChevronsUpDown } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
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
  disabled: false,
})

const { t, te } = useI18n({ useScope: 'global' })
const resolvedPlaceholder = computed(() => props.placeholder ?? (te('common.selectPlaceholder') ? t('common.selectPlaceholder') : '请选择'))
const resolvedSearchPlaceholder = computed(() => props.searchPlaceholder ?? (te('common.selectSearch') ? t('common.selectSearch') : '搜索选项'))
const resolvedEmptyText = computed(() => props.emptyText ?? (te('common.selectEmpty') ? t('common.selectEmpty') : '没有匹配的选项'))

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
        <span class="min-w-0 truncate">{{ selectedLabel ?? resolvedPlaceholder }}</span>
        <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-(--reka-popover-trigger-width) min-w-48 rounded-lg border-0 p-0 ring-1 ring-foreground/10" align="start">
      <Command>
        <CommandInput :placeholder="resolvedSearchPlaceholder" />
        <CommandList>
          <CommandEmpty>{{ resolvedEmptyText }}</CommandEmpty>
          <CommandGroup>
            <template v-for="item in flattenedOptions" :key="item.key">
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
