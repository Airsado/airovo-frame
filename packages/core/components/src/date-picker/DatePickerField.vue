<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import DatePicker from './DatePicker.vue'
import DateTimePicker from './DateTimePicker.vue'

defineOptions({ name: 'DatePickerField' })

const props = withDefaults(defineProps<{
    modelValue?: Date
    type?: 'date' | 'datetime'
    placeholder?: string
    disabled?: boolean
    minDate?: Date
    maxDate?: Date
    locale?: string
    id?: string
    name?: string
    ariaDescribedby?: string
    ariaInvalid?: boolean | string
    class?: HTMLAttributes['class']
}>(), { type: 'date' })

const emit = defineEmits<{ 'update:modelValue': [Date | undefined] }>()
const component = computed(() => props.type === 'datetime' ? DateTimePicker : DatePicker)
const componentProps = computed(() => ({
    modelValue: props.modelValue,
    placeholder: props.placeholder,
    disabled: props.disabled,
    minDate: props.minDate,
    maxDate: props.maxDate,
    locale: props.locale,
    id: props.id,
    name: props.name,
    ariaDescribedby: props.ariaDescribedby,
    ariaInvalid: props.ariaInvalid,
    class: typeof props.class === 'string' ? props.class : undefined,
}))
</script>

<template>
    <component :is="component" v-bind="componentProps" @update:model-value="emit('update:modelValue', $event)" />
</template>
