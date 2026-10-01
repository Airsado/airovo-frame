<script setup lang="ts">
import type { DateValue } from 'reka-ui'
import { CalendarDays } from '@lucide/vue'
import { fromDate, getLocalTimeZone, toCalendarDate } from '@internationalized/date'
import { computed, ref, watch } from 'vue'
import { cn } from '@airovo/uikit-shadcnui'
import { Button } from '@airovo/uikit-shadcnui/components/ui/button'
import { Calendar } from '@airovo/uikit-shadcnui/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@airovo/uikit-shadcnui/components/ui/popover'
import { toDate } from 'reka-ui/date'

const props = withDefaults(defineProps<{
  modelValue?: Date
  placeholder?: string
  disabled?: boolean
  class?: string
}>(), { placeholder: '选择日期' })

const emit = defineEmits<{ 'update:modelValue': [Date | undefined] }>()
const open = ref(false)
const selected = ref<DateValue | undefined>(props.modelValue ? toCalendarDate(fromDate(props.modelValue, getLocalTimeZone())) as DateValue : undefined)

watch(() => props.modelValue, (value) => {
  selected.value = value ? toCalendarDate(fromDate(value, getLocalTimeZone())) as DateValue : undefined
})

const label = computed(() => props.modelValue
  ? props.modelValue.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  : props.placeholder)

function selectDate(value: DateValue | undefined): void {
  selected.value = value
  emit('update:modelValue', value ? toDate(value, getLocalTimeZone()) : undefined)
  if (value) open.value = false
}

</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :disabled="props.disabled"
        :class="cn('w-[240px] justify-start text-start font-normal', !props.modelValue && 'text-muted-foreground', props.class)"
        :aria-label="label"
      >
        <span class="truncate">{{ label }}</span>
        <CalendarDays data-icon="inline-end" class="ml-auto opacity-60" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        layout="month-and-year"
        :model-value="selected as never"
        @update:model-value="selectDate"
      />
    </PopoverContent>
  </Popover>
</template>
