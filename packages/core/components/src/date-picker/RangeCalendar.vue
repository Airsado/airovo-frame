<script setup lang="ts">
import {
  RangeCalendarRoot,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarPrev,
  RangeCalendarNext,
  RangeCalendarGrid,
  RangeCalendarGridHead,
  RangeCalendarGridBody,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  type DateRange,
  type DateValue,
} from "reka-ui";
import { ChevronLeft, ChevronRight } from "@lucide/vue";
import { getLocalTimeZone, today } from "@internationalized/date";
import { shallowRef } from "vue";
import { Button } from "../controls";

const props = defineProps<{
  modelValue: DateRange;
  placeholder?: DateValue;
  locale: string;
  minValue?: DateValue;
  maxValue?: DateValue;
  numberOfMonths: number;
  disabled?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [DateRange] }>();
const visibleMonth = shallowRef<DateValue>(
  props.placeholder ?? today(getLocalTimeZone()),
);
</script>

<template>
  <!-- Use Reka's range selection and keyboard semantics; keep CLI-managed ui-kit untouched. -->
  <RangeCalendarRoot
    v-slot="{ grid, weekDays }"
    :model-value="modelValue"
    :placeholder="visibleMonth"
    :locale="locale"
    :min-value="minValue"
    :max-value="maxValue"
    :number-of-months="numberOfMonths"
    :disabled="disabled"
    fixed-weeks
    weekday-format="short"
    prevent-deselect
    class="min-h-0 overflow-y-auto p-3"
    @update:model-value="emit('update:modelValue', $event)"
    @update:placeholder="visibleMonth = $event"
  >
    <RangeCalendarHeader class="flex items-center justify-between gap-2">
      <RangeCalendarPrev as-child>
        <Button variant="ghost" size="icon" class="size-8"
          ><ChevronLeft class="size-4"
        /></Button>
      </RangeCalendarPrev>
      <RangeCalendarHeading class="text-sm font-medium" />
      <RangeCalendarNext as-child>
        <Button variant="ghost" size="icon" class="size-8"
          ><ChevronRight class="size-4"
        /></Button>
      </RangeCalendarNext>
    </RangeCalendarHeader>
    <div class="mt-3 flex gap-4">
      <RangeCalendarGrid
        v-for="month in grid"
        :key="month.value.toString()"
        class="w-[252px] border-collapse"
      >
        <RangeCalendarGridHead>
          <RangeCalendarGridRow class="flex">
            <RangeCalendarHeadCell
              v-for="day in weekDays"
              :key="day"
              class="w-9 pb-2 text-center text-xs font-normal text-muted-foreground"
              >{{ day }}</RangeCalendarHeadCell
            >
          </RangeCalendarGridRow>
        </RangeCalendarGridHead>
        <RangeCalendarGridBody>
          <RangeCalendarGridRow
            v-for="(week, index) in month.rows"
            :key="index"
            class="flex"
          >
            <RangeCalendarCell
              v-for="day in week"
              :key="day.toString()"
              :date="day"
              class="p-0"
            >
              <RangeCalendarCellTrigger
                as="button"
                type="button"
                :day="day"
                :month="month.value"
                v-bind="day.month !== month.value.month ? { tabindex: -1 } : {}"
                class="size-9 rounded-md text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[disabled]:pointer-events-none data-[disabled]:opacity-35 data-[outside-view]:text-muted-foreground data-[highlighted]:rounded-none data-[highlighted]:bg-accent data-[selected]:rounded-none data-[selected]:bg-accent data-[selection-start]:rounded-l-md data-[selection-start]:bg-primary data-[selection-start]:text-primary-foreground data-[selection-end]:rounded-r-md data-[selection-end]:bg-primary data-[selection-end]:text-primary-foreground data-[today]:font-semibold"
              />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </div>
  </RangeCalendarRoot>
</template>
