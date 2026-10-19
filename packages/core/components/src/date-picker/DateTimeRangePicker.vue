<script setup lang="ts">
import DateRangePicker from "./DateRangePicker.vue";
import type { DateRangePickerProps, DateRangeValue } from "./date-range";

defineOptions({ name: "DateTimeRangePicker", inheritAttrs: false });
const props = withDefaults(
  defineProps<Omit<DateRangePickerProps, "showTime">>(),
  {
    clearable: true,
    numberOfMonths: 2,
  },
);
const emit = defineEmits<{
  "update:modelValue": [DateRangeValue | undefined];
}>();
</script>

<template>
  <DateRangePicker
    v-bind="{ ...$attrs, ...props }"
    show-time
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
