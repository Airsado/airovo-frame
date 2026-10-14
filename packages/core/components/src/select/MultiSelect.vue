<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Check, ChevronDown, Copy, X } from '@lucide/vue'
import { Button, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@airovo/uikit-shadcnui'
import { Popover, PopoverContent, PopoverTrigger } from '@airovo/uikit-shadcnui/components/ui/popover'
import { cn } from '@airovo/uikit-shadcnui'

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
  allowCreate?: boolean
  createLabel?: string
  emptyText?: string
  disabled?: boolean
  maxVisibleChips?: number
  copyChipOnClick?: boolean
}>(), {
  options: () => [],
  modelValue: () => [],
  allowCreate: false,
  disabled: false,
  copyChipOnClick: false,
})

const emit = defineEmits<{ (event: 'update:modelValue', value: string[]): void }>()
const model = computed(() => props.modelValue ?? [])
const open = ref(false)
const inputValue = ref('')
const expanded = ref(false)
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
const canCreate = computed(() => props.allowCreate && trimmedInput.value.length > 0 && !selectedSet.value.has(trimmedInput.value) && !optionMap.value.has(trimmedInput.value))

function setValues(values: string[]): void { emit('update:modelValue', [...new Set(values.filter(Boolean))]) }
function toggle(value: string): void {
  if (selectedSet.value.has(value)) setValues(model.value.filter(item => item !== value))
  else setValues([...model.value, value])
  inputValue.value = ''
}
function addValues(values: string[]): void {
  const additions = values.flatMap(value => value.replaceAll('，', ',').replaceAll('\n', ',').split(',')).map(value => value.trim()).filter(value => value && !selectedSet.value.has(value))
  if (additions.length) setValues([...model.value, ...additions])
  inputValue.value = ''
}
function remove(value: string): void { if (!props.disabled) setValues(model.value.filter(item => item !== value)) }
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Backspace' && !inputValue.value && model.value.length) { event.preventDefault(); remove(model.value.at(-1)!) }
  if (event.key === 'Enter' && canCreate.value) { event.preventDefault(); addValues([trimmedInput.value]) }
}
async function copyChip(value: string): Promise<void> {
  if (!navigator.clipboard) return
  try { await navigator.clipboard.writeText(value); toast.success(copy('common.copiedValue', `已复制：${value}`, { value })) }
  catch { toast.error(copy('common.copyFailed', '复制失败')) }
}
function createLabel(): string { return props.createLabel?.replace('{{value}}', trimmedInput.value) ?? copy('common.multiSelectCreate', `添加“${trimmedInput.value}”`, { value: trimmedInput.value }) }
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button type="button" variant="outline" role="combobox" :disabled="props.disabled" :aria-expanded="open" :class="cn('min-h-9 w-full justify-between gap-2 rounded-lg font-normal', !model.length && 'text-muted-foreground', props.class)">
        <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-left">
          <template v-for="value in visibleValues" :key="value">
            <span class="inline-flex max-w-full items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-xs text-foreground">
              <span v-if="optionMap.get(value)?.icon" class="shrink-0">{{ optionMap.get(value)?.icon }}</span>
              <button v-if="props.copyChipOnClick" type="button" class="max-w-40 truncate hover:underline" @click.stop="copyChip(value)">{{ labelMap.get(value) ?? value }}</button>
              <span v-else class="max-w-40 truncate">{{ labelMap.get(value) ?? value }}</span>
              <button type="button" class="rounded-sm opacity-60 hover:opacity-100" :aria-label="`${copy('common.remove', '移除')} ${labelMap.get(value) ?? value}`" @click.stop="remove(value)"><X class="size-3" /></button>
            </span>
          </template>
          <span v-if="hiddenCount > 0" class="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">+{{ hiddenCount }}</span>
          <span v-if="!model.length" class="truncate">{{ resolvedPlaceholder }}</span>
        </span>
        <ChevronDown class="size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" class="w-(--reka-popover-trigger-width) min-w-56 rounded-lg border-0 p-0 ring-1 ring-foreground/10">
      <Command>
        <CommandInput :model-value="inputValue" :placeholder="resolvedPlaceholder" @update:model-value="inputValue = String($event)" @keydown="handleKeydown" @paste="(event: ClipboardEvent) => { if (props.allowCreate) { const value = (event.clipboardData?.getData('text') ?? ''); if (/[，,\n]/.test(value)) { event.preventDefault(); addValues([value]) } } }" />
        <CommandList>
          <CommandEmpty>{{ resolvedEmptyText }}</CommandEmpty>
          <CommandGroup>
            <CommandItem v-if="canCreate" :value="trimmedInput" @select="addValues([trimmedInput])"><span class="mr-2">＋</span>{{ createLabel() }}</CommandItem>
            <CommandItem v-for="option in filteredOptions" :key="option.value" :value="option.value" :disabled="option.disabled" @select="toggle(option.value)">
              <Check :class="['mr-2 size-4', selectedSet.has(option.value) ? 'opacity-100' : 'opacity-0']" />
              <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
              <span v-if="option.hint" class="ml-2 text-xs text-muted-foreground">{{ option.hint }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <button v-if="hiddenCount > 0" type="button" class="w-full border-t px-3 py-2 text-left text-xs text-muted-foreground hover:bg-accent" @click="expanded = !expanded">{{ expanded ? copy('common.collapse', '收起') : copy('common.showAll', '显示全部') }}</button>
    </PopoverContent>
  </Popover>
</template>
