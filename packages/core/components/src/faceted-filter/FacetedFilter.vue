<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { Check, PlusCircle } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@airovo/uikit-shadcnui'
import { Badge } from '@airovo/uikit-shadcnui/components/ui/badge'
import { Button } from '@airovo/uikit-shadcnui/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@airovo/uikit-shadcnui/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@airovo/uikit-shadcnui/components/ui/popover'
import { Separator } from '@airovo/uikit-shadcnui/components/ui/separator'

export interface FacetedFilterOption {
  label: string
  value: string
  icon?: Component
  /** Optional component content for consumers that already have a rendered icon component. */
  iconNode?: Component
  /** Optional count displayed at the end of the option row. */
  count?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  title?: string
  options?: FacetedFilterOption[]
  /** Select exactly one item at a time when true; otherwise the filter is multi-select. */
  singleSelect?: boolean
  searchPlaceholder?: string
  emptyText?: string
  clearText?: string
  selectedText?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
  contentClass?: HTMLAttributes['class']
  align?: 'start' | 'center' | 'end'
}>(), {
  options: () => [],
  singleSelect: false,
  searchPlaceholder: undefined,
  disabled: false,
  align: 'start',
})

const { t, te } = useI18n({ useScope: 'global' })
function copy(key: string, fallback: string): string { return te(key) ? t(key) : fallback }
const resolvedTitle = computed(() => props.title ?? copy('common.filter', 'Filter'))
const resolvedEmptyText = computed(() => props.emptyText ?? copy('common.noResults', 'No results found.'))
const resolvedClearText = computed(() => props.clearText ?? copy('common.clearFilters', 'Clear filters'))
const resolvedSelectedText = computed(() => props.selectedText ?? copy('common.selected', 'selected'))

/**
 * Multi-select values are represented as string[]. In single-select mode the
 * component follows the normal Vue input convention and emits a string (or
 * undefined); passing an array keeps the array model for callers that need it.
 */
const modelValue = defineModel<string | string[] | undefined>()
const open = ref(false)

const selectedValues = computed<string[]>(() => {
  if (Array.isArray(modelValue.value))
    return modelValue.value
  return modelValue.value ? [modelValue.value] : []
})

const selectedSet = computed(() => new Set(selectedValues.value))
const selectedOptions = computed(() => props.options.filter(option => selectedSet.value.has(option.value)))
const triggerSearchPlaceholder = computed(() => props.searchPlaceholder ?? resolvedTitle.value)

function setSelection(values: string[]): void {
  if (props.singleSelect && !Array.isArray(modelValue.value)) {
    modelValue.value = values[0]
    return
  }
  modelValue.value = values
}

function handleOptionSelect(value: string): void {
  if (props.singleSelect) {
    setSelection(selectedSet.value.has(value) ? [] : [value])
    return
  }

  const next = new Set(selectedSet.value)
  if (next.has(value))
    next.delete(value)
  else
    next.add(value)
  setSelection(Array.from(next))
}

function clearSelection(): void {
  setSelection([])
}

function optionCount(option: FacetedFilterOption): number | undefined {
  return typeof option.count === 'number' ? option.count : undefined
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        :disabled="props.disabled"
        :aria-expanded="open"
        :class="cn('h-8 border-dashed', props.class)"
      >
        <PlusCircle class="size-4" />
        <slot name="title">{{ resolvedTitle }}</slot>
        <template v-if="selectedSet.size > 0">
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge
            variant="secondary"
            class="rounded-sm px-1 font-normal lg:hidden"
          >
            {{ selectedSet.size }}
          </Badge>
          <div class="hidden gap-1 lg:flex">
            <Badge
              v-if="selectedSet.size > 2"
              variant="secondary"
              class="rounded-sm px-1 font-normal"
            >
              {{ selectedSet.size }} {{ resolvedSelectedText }}
            </Badge>
            <template v-else>
              <Badge
                v-for="option in selectedOptions"
                :key="option.value"
                variant="secondary"
                class="rounded-sm px-1 font-normal"
              >
                <slot name="selected" :option="option">{{ option.label }}</slot>
              </Badge>
            </template>
          </div>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent
      :align="props.align"
      :class="cn('max-w-[360px] min-w-[200px] rounded-lg border-0 p-0 ring-1 ring-foreground/10 duration-100', props.contentClass)"
    >
      <Command>
        <CommandInput :placeholder="props.searchPlaceholder ?? resolvedTitle" />
        <CommandList>
          <CommandEmpty>{{ resolvedEmptyText }}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in props.options"
              :key="option.value"
              :value="option.value"
              :text-value="option.label"
              :disabled="option.disabled"
              @select="handleOptionSelect(option.value)"
            >
              <div
                :class="cn(
                  'border-primary flex size-4 items-center justify-center rounded-sm border',
                  selectedSet.has(option.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible',
                )"
              >
                <Check class="text-background h-4 w-4" />
              </div>
              <span
                v-if="option.iconNode || option.icon"
                class="text-muted-foreground flex size-4 shrink-0 items-center justify-center"
              >
                <slot name="option-icon" :option="option">
                  <component v-if="option.icon" :is="option.icon" />
                  <component v-else :is="option.iconNode" />
                </slot>
              </span>
              <slot name="option" :option="option" :selected="selectedSet.has(option.value)">
                <span class="min-w-0 flex-1 truncate" :title="option.label">
                  {{ option.label }}
                </span>
              </slot>
              <span
                v-if="optionCount(option) !== undefined"
                class="text-muted-foreground ms-auto flex h-4 min-w-4 items-center justify-center font-mono text-xs"
              >
                {{ optionCount(option) }}
              </span>
            </CommandItem>
          </CommandGroup>
          <template v-if="selectedSet.size > 0">
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                value="__faceted-filter-clear__"
                class="justify-center text-center"
                @select="clearSelection"
              >
                {{ resolvedClearText }}
              </CommandItem>
            </CommandGroup>
          </template>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
