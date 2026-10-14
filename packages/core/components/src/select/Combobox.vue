<script setup lang="ts">
import { Check, ChevronsUpDown } from '@lucide/vue'
import { computed, nextTick, ref, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { cn, InputGroup, InputGroupAddon, InputGroupInput } from '@airovo/uikit-shadcnui'
import { Command, CommandGroup, CommandItem, CommandList } from '@airovo/uikit-shadcnui/components/ui/command'
import { Popover, PopoverAnchor, PopoverContent } from '@airovo/uikit-shadcnui/components/ui/popover'
import { Icon } from '@airovo/shared/icons'
import { flattenSelectOptions, selectableSelectOptions, type FlattenedSelectOption, type SelectOption } from './options'

defineOptions({ name: 'Combobox' })

const props = defineProps({
  options: { type: Array as PropType<SelectOption[]>, default: () => [] },
  placeholder: { type: String, default: '请选择' },
  searchPlaceholder: { type: String, default: undefined },
  emptyText: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  allowCustomValue: { type: Boolean, default: false },
  showSelectedIcon: { type: Boolean, default: false },
  openOnFocus: { type: Boolean, default: false },
  popupClass: { type: String, default: undefined },
  id: { type: String, default: undefined },
  name: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  ariaLabelledby: { type: String, default: undefined },
  ariaDescribedby: { type: String, default: undefined },
  ariaInvalid: {
    type: [Boolean, String] as PropType<boolean | string | undefined>,
    default: undefined,
  },
  class: { type: String, default: undefined },
})

const { t, te } = useI18n({ useScope: 'global' })
const modelValue = defineModel<string | undefined>()
const open = ref(false)
const search = ref('')
const activeIndex = ref(0)
const searchInput = ref<{ $el?: HTMLInputElement } | null>(null)

const selectableOptions = computed(() => selectableSelectOptions(props.options))
const hierarchicalOptions = computed(() => flattenSelectOptions(props.options))
const filteredOptions = computed<FlattenedSelectOption[]>(() => {
  const term = search.value.trim().toLocaleLowerCase()
  if (!term) return hierarchicalOptions.value
  const matches = hierarchicalOptions.value.filter(item =>
    !item.group
      && (item.option.label.toLocaleLowerCase().includes(term)
        || item.option.value?.toLocaleLowerCase().includes(term) === true),
  )
  const matchingKeys = new Set(matches.map(item => item.key))
  return hierarchicalOptions.value.filter(item =>
    !item.group
      ? matchingKeys.has(item.key)
      : matches.some(match => match.key.startsWith(`${item.key}.`)),
  )
})
const filteredLeaves = computed(() => filteredOptions.value.filter(item => !item.group && item.option.value !== undefined))
const selectedOption = computed(() => selectableOptions.value.find(option => option.value === modelValue.value))
const selectedLabel = computed(() => selectedOption.value?.label ?? modelValue.value)
const resolvedSearchPlaceholder = computed(() => props.searchPlaceholder ?? (te('common.selectSearch') ? t('common.selectSearch') : '搜索选项'))
const resolvedEmptyText = computed(() => props.emptyText ?? (te('common.selectEmpty') ? t('common.selectEmpty') : '没有匹配的选项'))
const triggerLabel = computed(() => props.ariaLabel ?? (te('common.open') ? t('common.open') : '打开'))
const displayValue = computed(() => open.value ? search.value : selectedLabel.value ?? '')

function updateOpen(value: boolean): void {
  open.value = value && !props.disabled
  activeIndex.value = 0
  if (!open.value) {
    search.value = ''
    return
  }
  void nextTick(() => searchInput.value?.$el?.focus())
}

function select(value: string): void {
  modelValue.value = value
  updateOpen(false)
}

function onSearchInput(value: string): void {
  search.value = value
  activeIndex.value = 0
}

function moveActive(delta: number): void {
  if (!filteredLeaves.value.length) return
  let next = activeIndex.value
  for (let index = 0; index < filteredLeaves.value.length; index += 1) {
    next = (next + delta + filteredLeaves.value.length) % filteredLeaves.value.length
    if (!filteredLeaves.value[next]?.option.disabled) {
      activeIndex.value = next
      return
    }
  }
}

function selectCustom(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    updateOpen(false)
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    updateOpen(true)
    moveActive(1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    updateOpen(true)
    moveActive(-1)
    return
  }
  if (event.key !== 'Enter') return
  const active = filteredLeaves.value[activeIndex.value]
  if (active?.option.value !== undefined && !active.option.disabled) {
    event.preventDefault()
    select(active.option.value)
    return
  }
  if (props.allowCustomValue && search.value.trim()) {
    event.preventDefault()
    select(search.value.trim())
  }
}

function handleGroupClick(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' && !open.value) updateOpen(true)
}

function handleGroupInput(event: Event): void {
  if ((event.target as HTMLInputElement).tagName !== 'INPUT') return
  if (!open.value && (event.target as HTMLInputElement).value) updateOpen(true)
  onSearchInput((event.target as HTMLInputElement).value)
}

function handleGroupFocus(event: FocusEvent): void {
  if (props.openOnFocus && (event.target as HTMLElement).tagName === 'INPUT') updateOpen(true)
}

function handleInputFocus(): void {
  if (props.openOnFocus) updateOpen(true)
}
</script>

<template>
  <Popover :open="open" @update:open="updateOpen">
    <PopoverAnchor class="block min-w-0">
      <div class="min-w-0" :class="props.class" @mousedown="handleGroupClick" @input="handleGroupInput" @keydown="selectCustom" @focusin="handleGroupFocus">
        <InputGroup :class="cn('w-full', props.disabled && 'opacity-50')">
          <InputGroupAddon v-if="props.showSelectedIcon && !open && selectedOption?.icon" data-slot="combobox-selected-icon" align="inline-start" aria-hidden="true">
            <Icon :icon="selectedOption.icon" class="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            ref="searchInput"
            :id="props.id"
            :name="props.name"
            :model-value="displayValue"
            :placeholder="open ? resolvedSearchPlaceholder : (!selectedLabel ? props.placeholder : undefined)"
            :readonly="!open && Boolean(selectedLabel)"
            :disabled="props.disabled"
            role="combobox"
            :aria-expanded="open"
            :aria-label="props.ariaLabel"
            :aria-labelledby="props.ariaLabelledby"
            :aria-describedby="props.ariaDescribedby"
            :aria-invalid="props.ariaInvalid"
            class="h-full min-h-8"
            @focus="handleInputFocus"
          />
          <InputGroupAddon align="inline-end">
            <button
              type="button"
              data-slot="input-group-button"
              :aria-label="triggerLabel"
              :disabled="props.disabled"
              class="text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex size-6 items-center justify-center rounded-md text-xs transition-colors disabled:pointer-events-none disabled:opacity-50"
              @click.prevent.stop="updateOpen(!open)"
            >
              <ChevronsUpDown class="text-muted-foreground size-4" />
            </button>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </PopoverAnchor>
    <PopoverContent :class="cn('w-(--reka-popover-anchor-width) min-w-48 rounded-lg border-0 p-0 ring-1 ring-foreground/10', props.popupClass)" align="start">
      <Command>
        <CommandList>
          <div v-if="!filteredLeaves.length" class="py-6 text-center text-sm text-muted-foreground">{{ resolvedEmptyText }}</div>
          <CommandGroup>
            <template v-for="option in filteredOptions" :key="option.key">
              <div
                v-if="option.group"
                data-slot="combobox-option-group"
                class="text-muted-foreground px-2 py-1.5 text-xs font-medium"
                :style="{ paddingLeft: `${0.5 + option.depth * 0.75}rem` }"
              >
                {{ option.option.label }}
              </div>
              <CommandItem
                v-else-if="option.option.value !== undefined"
                :value="`${option.option.label} ${option.option.value}`"
                :disabled="option.option.disabled"
                :data-depth="option.depth"
                :class="cn('relative rounded-md py-1 pr-8 pl-1.5', filteredLeaves[activeIndex]?.key === option.key && 'bg-accent text-accent-foreground')"
                :style="{ paddingLeft: `${0.375 + option.depth * 0.75}rem` }"
                @mouseenter="activeIndex = filteredLeaves.findIndex(item => item.key === option.key)"
                @select="select(option.option.value)"
              >
                <Check v-if="props.showSelectedIcon" :class="cn('size-4 shrink-0', modelValue === option.option.value ? 'opacity-100' : 'opacity-0')" />
                <Icon v-if="option.option.icon" :icon="option.option.icon" class="size-4 shrink-0" aria-hidden="true" />
                <span class="min-w-0 break-words">
                  <span>{{ option.option.label }}</span>
                  <span v-if="option.option.description" class="text-muted-foreground block text-xs break-all">{{ option.option.description }}</span>
                </span>
                <span aria-hidden="true" class="sr-only">{{ option.option.value }}</span>
              </CommandItem>
            </template>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
