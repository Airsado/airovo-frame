<script setup lang="ts">
import { computed, defineComponent, h, ref, useSlots, watch, type VNodeChild } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { ArrowRightLeft, Check, ChevronDown, X } from '@lucide/vue'
import { Command, CommandGroup, CommandItem, CommandList } from '@airovo/uikit-shadcnui'
import { Popover, PopoverContent, PopoverTrigger } from '@airovo/uikit-shadcnui/components/ui/popover'
import { cn } from '@airovo/uikit-shadcnui'
import { Icon } from '@airovo/shared/icons'
import { useOverlayOwner } from '@airovo/shared/overlay'

export interface MultiSelectOption {
  label: string
  value: string
  hint?: string
  icon?: string
  disabled?: boolean
}

defineOptions({ name: 'MultiSelect' })

const props = withDefaults(defineProps<{
  options?: MultiSelectOption[]
  modelValue?: string[]
  placeholder?: string
  class?: string
  id?: string
  allowCreate?: boolean
  createLabel?: string
  emptyText?: string
  disabled?: boolean
  maxVisibleChips?: number
  renderSelectedSummary?: (values: string[]) => VNodeChild
  copyChipOnClick?: boolean
}>(), {
  options: () => [],
  modelValue: () => [],
  allowCreate: false,
  disabled: false,
  copyChipOnClick: false,
})

const emit = defineEmits<{ (event: 'update:modelValue', value: string[]): void }>()
const slots = useSlots()
const model = computed(() => props.modelValue ?? [])
const open = ref(false)
const owner = useOverlayOwner()
const popupStyle = computed(() => owner?.popupZIndex.value === undefined
  ? undefined
  : { zIndex: owner.popupZIndex.value })
// Portaled options inherit their main overlay's layer, as SelectBox does.
// Closing or covering that owner must close its popup without stealing focus.
watch(() => owner?.active.value, (active) => {
  if (active === false) open.value = false
}, { flush: 'sync' })
const inputValue = ref('')
const expanded = ref(false)
const activeIndex = ref(0)
const { t, te } = useI18n({ useScope: 'global' })
function copy(key: string, fallback: string, values?: Record<string, unknown>): string { return te(key) ? t(key, values ?? {}) : fallback }
const resolvedPlaceholder = computed(() => props.placeholder ?? copy('common.multiSelectPlaceholder', '选择项目…'))
const resolvedEmptyText = computed(() => props.emptyText ?? copy('common.multiSelectEmpty', '没有匹配的项目'))
const selectedSet = computed(() => new Set(model.value))
const labelMap = computed(() => new Map(props.options.map(option => [option.value, option.label])))
const optionMap = computed(() => new Map(props.options.map(option => [option.value, option])))
const trimmedInput = computed(() => inputValue.value.trim())
const filteredOptions = computed(() => {
  const query = trimmedInput.value.toLowerCase()
  if (!query) return props.options
  return props.options.filter(option => `${option.label} ${option.value} ${option.hint ?? ''}`.toLowerCase().includes(query))
})
const visibleValues = computed(() => typeof props.maxVisibleChips === 'number' && !expanded.value ? model.value.slice(0, props.maxVisibleChips) : model.value)
const hiddenCount = computed(() => model.value.length - visibleValues.value.length)
const canCreate = computed(() => props.allowCreate && trimmedInput.value.length > 0 && !selectedSet.value.has(trimmedInput.value) && !props.options.some(option => option.value === trimmedInput.value || option.label === trimmedInput.value))
const menuEntries = computed(() => [
  ...(canCreate.value ? [{ kind: 'create' as const, value: trimmedInput.value }] : []),
  ...filteredOptions.value.map(option => ({ kind: 'option' as const, value: option.value, option })),
])

const hasSummarySlot = computed(() => Boolean(slots['selected-summary']))
const summaryRenderer = computed(() => {
  if (!props.renderSelectedSummary) return null
  const render = props.renderSelectedSummary
  return defineComponent({
    name: 'MultiSelectSummary',
    setup: () => () => h(
      'span',
      { class: 'inline-flex h-[calc(--spacing(5.25))] w-fit items-center justify-center rounded-sm bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground whitespace-nowrap' },
      render(model.value) as any,
    ),
  })
})

function updateOpen(value: boolean): void {
  open.value = props.disabled || owner?.active.value === false ? false : value
}

function onCloseAutoFocus(event: Event): void {
  if (owner?.active.value === false) event.preventDefault()
}

function setValues(values: string[]): void { emit('update:modelValue', [...new Set(values.filter(Boolean))]) }
function toggle(value: string): void {
  if (selectedSet.value.has(value)) setValues(model.value.filter(item => item !== value))
  else setValues([...model.value, value])
  inputValue.value = ''
  activeIndex.value = 0
}
function addValues(values: string[]): void {
  const additions = values.flatMap(value => value.replaceAll('，', ',').replaceAll('\n', ',').split(',')).map(value => value.trim()).filter(value => value && !selectedSet.value.has(value))
  if (additions.length) setValues([...model.value, ...additions])
  inputValue.value = ''
  activeIndex.value = 0
}
function remove(value: string): void { if (!props.disabled) setValues(model.value.filter(item => item !== value)) }
function handleInput(value: string): void {
  inputValue.value = value
  activeIndex.value = 0
  if (!props.allowCreate) return
  const normalized = value.replaceAll('，', ',').replaceAll('\n', ',')
  if (!normalized.includes(',')) return
  const parts = normalized.split(',')
  const draft = parts.pop() ?? ''
  addValues(parts)
  inputValue.value = draft
}
function moveActive(delta: number): void {
  if (!menuEntries.value.length) return
  let next = activeIndex.value
  for (let index = 0; index < menuEntries.value.length; index += 1) {
    next = (next + delta + menuEntries.value.length) % menuEntries.value.length
    const entry = menuEntries.value[next]
    if (entry.kind === 'create' || !entry.option?.disabled) {
      activeIndex.value = next
      return
    }
  }
}
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Backspace' && !inputValue.value && model.value.length) { event.preventDefault(); remove(model.value.at(-1)!) }
  if (event.key === 'ArrowDown') { event.preventDefault(); open.value = true; moveActive(1) }
  if (event.key === 'ArrowUp') { event.preventDefault(); open.value = true; moveActive(-1) }
  if (event.key === 'Escape') { event.preventDefault(); open.value = false }
  if (event.key === 'Enter') {
    const entry = menuEntries.value[activeIndex.value]
    if (entry?.kind === 'create') { event.preventDefault(); addValues([entry.value]) }
    else if (entry?.kind === 'option' && !entry.option.disabled) { event.preventDefault(); toggle(entry.value) }
  }
}
function handlePaste(event: ClipboardEvent): void {
  if (!props.allowCreate || props.disabled) return
  const value = event.clipboardData?.getData('text') ?? ''
  if (!/[，,\n]/.test(value)) return
  event.preventDefault()
  addValues([value])
}
async function copyChip(value: string): Promise<void> {
  if (!navigator.clipboard) return
  try { await navigator.clipboard.writeText(value); toast.success(copy('common.copiedValue', `已复制：${value}`, { value })) }
  catch { toast.error(copy('common.copyFailed', '复制失败')) }
}
function createLabel(): string { return props.createLabel?.replace('{{value}}', trimmedInput.value) ?? copy('common.multiSelectCreate', `添加“${trimmedInput.value}”`, { value: trimmedInput.value }) }
</script>

<template>
  <Popover :open="open" @update:open="updateOpen">
    <PopoverTrigger as-child>
      <div data-slot="combobox-chips" role="combobox" :aria-expanded="open" :aria-disabled="props.disabled || undefined" :class="cn('border-input focus-within:border-ring focus-within:ring-ring/50 flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors focus-within:ring-3 focus-within:ring-inset aria-invalid:ring-inset dark:bg-input/30', props.disabled && 'cursor-not-allowed opacity-50', props.class)">
        <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-left">
          <template v-if="hasSummarySlot">
            <span class="inline-flex h-[calc(--spacing(5.25))] w-fit items-center justify-center rounded-sm bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground whitespace-nowrap"><slot name="selected-summary" :values="model" /></span>
          </template>
          <component v-else-if="summaryRenderer" :is="summaryRenderer" />
          <template v-else>
            <template v-for="value in visibleValues" :key="value">
              <span data-slot="combobox-chip" class="inline-flex h-[calc(--spacing(5.25))] w-fit max-w-full items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium text-foreground whitespace-nowrap">
                <Icon v-if="optionMap.get(value)?.icon" :icon="optionMap.get(value)?.icon ?? ''" class="size-3.5 shrink-0" aria-hidden="true" />
                <button v-if="props.copyChipOnClick" type="button" class="max-w-40 cursor-pointer truncate rounded-sm hover:underline" @click.stop="copyChip(value)">{{ labelMap.get(value) ?? value }}</button>
                <span v-else class="max-w-40 truncate">{{ labelMap.get(value) ?? value }}</span>
                <span v-if="optionMap.get(value)?.hint" class="inline-flex shrink-0 text-muted-foreground" :title="optionMap.get(value)?.hint" aria-hidden="true"><ArrowRightLeft class="size-3" /></span>
                <button type="button" data-slot="combobox-chip-remove" class="-ml-1 rounded-sm opacity-50 hover:opacity-100" :aria-label="`${copy('common.remove', '移除')} ${labelMap.get(value) ?? value}`" @click.stop="remove(value)"><X class="size-3" /></button>
              </span>
            </template>
            <button v-if="hiddenCount > 0" type="button" class="inline-flex h-[calc(--spacing(5.25))] items-center rounded-sm bg-muted px-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground" :title="copy('common.showAll', '显示全部')" @click.stop="expanded = true">+{{ hiddenCount }}</button>
          </template>
          <input data-slot="combobox-chip-input" :id="props.id" :value="inputValue" :placeholder="!model.length && !hasSummarySlot && !props.renderSelectedSummary ? resolvedPlaceholder : undefined" :disabled="props.disabled" :aria-label="resolvedPlaceholder" class="min-w-16 flex-1 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed" @input="handleInput(($event.target as HTMLInputElement).value)" @keydown="handleKeydown" @paste="handlePaste" />
        </span>
        <ChevronDown class="size-4 shrink-0 opacity-50" />
      </div>
    </PopoverTrigger>
    <PopoverContent align="start" :style="popupStyle" @close-auto-focus="onCloseAutoFocus" class="w-(--reka-popover-trigger-width) min-w-56 rounded-lg border-0 p-0 shadow-md ring-1 ring-foreground/10">
      <Command>
        <CommandList>
          <div v-if="!menuEntries.length" class="py-6 text-center text-sm text-muted-foreground">{{ resolvedEmptyText }}</div>
          <CommandGroup>
            <CommandItem v-if="canCreate" :value="trimmedInput" :class="activeIndex === 0 ? 'bg-accent text-accent-foreground' : undefined" @mouseenter="activeIndex = 0" @select="addValues([trimmedInput])"><span class="mr-2">＋</span>{{ createLabel() }}</CommandItem>
            <CommandItem v-for="(option, index) in filteredOptions" :key="option.value" :value="option.value" :disabled="option.disabled" :class="activeIndex === index + (canCreate ? 1 : 0) ? 'bg-accent text-accent-foreground' : undefined" @mouseenter="activeIndex = index + (canCreate ? 1 : 0)" @select="toggle(option.value)">
              <Icon v-if="option.icon" :icon="option.icon" class="mr-2 size-4 shrink-0" aria-hidden="true" />
              <Check :class="['mr-2 size-4', selectedSet.has(option.value) ? 'opacity-100' : 'opacity-0']" />
              <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
              <span v-if="option.hint" class="ml-auto max-w-40 truncate text-xs text-muted-foreground">{{ option.hint }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <button v-if="expanded && typeof props.maxVisibleChips === 'number' && model.length > props.maxVisibleChips" type="button" class="w-full border-t px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" @click="expanded = false">{{ copy('common.collapse', '收起') }}</button>
    </PopoverContent>
  </Popover>
</template>
