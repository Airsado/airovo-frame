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
  class?: string
}>(), { placeholder: '选择日期和时间' })
const emit = defineEmits<{ 'update:modelValue': [Date | undefined] }>()
const time = ref(props.modelValue ? formatTime(props.modelValue) : '00:00')

watch(() => props.modelValue, (value) => { time.value = value ? formatTime(value) : '00:00' })
const dateOnly = computed(() => props.modelValue ? new Date(props.modelValue) : undefined)
function formatTime(value: Date): string { return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}` }
function updateDate(value: Date | undefined): void {
  if (!value) { emit('update:modelValue', undefined); return }
  const [hours, minutes] = time.value.split(':').map(Number)
  value.setHours(hours, minutes, 0, 0)
  emit('update:modelValue', value)
}
function updateTime(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  time.value = value
  if (props.modelValue) updateDate(new Date(props.modelValue))
}
</script>

<template>
  <div :class="cn('flex items-center gap-2', props.class)">
    <!-- Override DatePicker's standalone width so this row can shrink in forms. -->
    <DatePicker :model-value="dateOnly" :disabled="props.disabled" :placeholder="props.placeholder" class="w-0 min-w-0 flex-1" @update:model-value="updateDate" />
    <label class="relative flex h-8 shrink-0 items-center">
      <CalendarClock class="pointer-events-none absolute left-2 opacity-60" />
      <input type="time" :value="time" :disabled="props.disabled || !props.modelValue" class="h-8 w-[7.5rem] rounded-lg border border-input bg-background pl-8 pr-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" @input="updateTime">
    </label>
    <Button v-if="props.modelValue" type="button" variant="ghost" size="icon" aria-label="清除日期时间" @click="emit('update:modelValue', undefined)">
      <X />
    </Button>
  </div>
</template>
