// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DatePickerField from './DatePickerField.vue'

const stubs = {
    DatePicker: { props: ['modelValue', 'id', 'name', 'ariaDescribedby', 'ariaInvalid'], emits: ['update:modelValue'], template: '<button data-date-field type="button" :id="id" :name="name" :aria-describedby="ariaDescribedby" :aria-invalid="ariaInvalid" @click="$emit(\'update:modelValue\', new Date(2025, 0, 2))" />' },
    DateTimePicker: { props: ['modelValue'], emits: ['update:modelValue'], template: '<button data-datetime-field type="button" @click="$emit(\'update:modelValue\', new Date(2025, 0, 2, 3, 4, 5))" />' },
}

describe('DatePickerField', () => {
    it('renders date mode with form attributes and forwards v-model', async () => {
        const wrapper = mount(DatePickerField, { props: { id: 'date', name: 'date', ariaDescribedby: 'date-help', ariaInvalid: true }, global: { stubs } })
        expect(wrapper.get('[data-date-field]').attributes('id')).toBe('date')
        expect(wrapper.get('[data-date-field]').attributes('aria-invalid')).toBe('true')
        await wrapper.get('[data-date-field]').trigger('click')
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBeInstanceOf(Date)
    })

    it('selects datetime mode', () => {
        const wrapper = mount(DatePickerField, { props: { type: 'datetime' }, global: { stubs } })
        expect(wrapper.get('[data-datetime-field]')).toBeTruthy()
    })
})
