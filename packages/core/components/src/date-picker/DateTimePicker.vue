<script setup lang="ts">
import { CalendarClock, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@airovo/uikit-shadcnui'
import { Input } from '@airovo/uikit-shadcnui/components/ui/input'
import { Button } from '@airovo/uikit-shadcnui/components/ui/button'
import DatePicker from './DatePicker.vue'

const props = defineProps<{
  modelValue?: Date
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  locale?: string
  id?: string
  name?: string
  ariaDescribedby?: string
  ariaInvalid?: boolean | string
  class?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [Date | undefined] }>()
const { t, te } = useI18n({ useScope: 'global' })
const resolvedPlaceholder = computed(() => props.placeholder ?? (te('common.dateTimePickerPlaceholder') ? t('common.dateTimePickerPlaceholder') : '选择日期和时间'))
const time = ref(props.modelValue ? formatTime(props.modelValue) : '00:00:00')

watch(() => props.modelValue, (value) => { time.value = value ? formatTime(value) : '00:00:00' })
const dateOnly = computed(() => props.modelValue ? new Date(props.modelValue) : undefined)
function formatTime(value: Date): string {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}:${String(value.getSeconds()).padStart(2, '0')}`
}
function parseTime(value: string): [number, number, number] {
  const [hours = 0, minutes = 0, seconds = 0] = value.split(':').map(Number)
  return [
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0,
    Number.isFinite(seconds) ? seconds : 0,
  ]
}
function updateDate(value: Date | undefined): void {
  if (!value) { emit('update:modelValue', undefined); return }
  const next = new Date(value)
  const [hours, minutes, seconds] = parseTime(time.value)
  next.setHours(hours, minutes, seconds, 0)
  emit('update:modelValue', next)
}
function updateTime(valueOrEvent: string | number | Event): void {
  const value = typeof valueOrEvent === 'string' || typeof valueOrEvent === 'number'
    ? String(valueOrEvent)
    : (valueOrEvent.target as HTMLInputElement).value
  if (!value) return
  const [hours, minutes, seconds] = parseTime(value)
  time.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  if (props.modelValue) updateDate(new Date(props.modelValue))
}
function clear(): void {
  if (props.disabled) return
  time.value = '00:00:00'
  emit('update:modelValue', undefined)
}
</script>

<template>
  <div :class="cn('flex items-center gap-2', props.class)">
    <!-- Override DatePicker's standalone width so this row can shrink in forms. -->
    <DatePicker :model-value="dateOnly" :disabled="props.disabled" :placeholder="resolvedPlaceholder" :min-date="props.minDate" :max-date="props.maxDate" :locale="props.locale" :id="props.id" :name="props.name" :aria-describedby="props.ariaDescribedby" :aria-invalid="props.ariaInvalid" class="w-0 min-w-0 flex-1" @update:model-value="updateDate" />
    <label class="relative flex h-8 shrink-0 items-center">
      <CalendarClock class="pointer-events-none absolute left-2 opacity-60" />
      <Input type="time" step="1" :model-value="time" aria-label="时间" :disabled="props.disabled || !props.modelValue" class="w-32 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" @update:model-value="updateTime" />
    </label>
      <Button v-if="props.modelValue" type="button" variant="outline" size="icon" class="shrink-0" aria-label="清除日期时间" :disabled="props.disabled" @click="clear">
      <X />
    </Button>
  </div>
</template>
