<script setup lang="ts">
import { CalendarClock, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { cn } from '@airovo/uikit-shadcnui'
import { Button } from '@airovo/uikit-shadcnui/components/ui/button'
import DatePicker from './DatePicker.vue'

const props = withDefaults(defineProps<{
  modelValue?: Date
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  locale?: string
  class?: string
}>(), { placeholder: '选择日期和时间' })
const emit = defineEmits<{ 'update:modelValue': [Date | undefined] }>()
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
function updateTime(event: Event): void {
  const value = (event.target as HTMLInputElement).value
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
    <DatePicker :model-value="dateOnly" :disabled="props.disabled" :placeholder="props.placeholder" :min-date="props.minDate" :max-date="props.maxDate" :locale="props.locale" class="w-0 min-w-0 flex-1" @update:model-value="updateDate" />
    <label class="relative flex h-8 shrink-0 items-center">
      <CalendarClock class="pointer-events-none absolute left-2 opacity-60" />
      <input type="time" step="1" :value="time" aria-label="时间" :disabled="props.disabled || !props.modelValue" class="h-8 w-[7.5rem] rounded-lg border border-input bg-background pl-8 pr-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" @input="updateTime">
    </label>
    <Button v-if="props.modelValue" type="button" variant="ghost" size="icon" aria-label="清除日期时间" :disabled="props.disabled" @click="clear">
      <X />
    </Button>
  </div>
</template>
