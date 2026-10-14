// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import DateTimePicker from './DateTimePicker.vue'

const DatePickerStub = {
    props: ['modelValue', 'disabled', 'placeholder', 'minDate', 'maxDate', 'locale', 'triggerIcon'],
    emits: ['update:modelValue'],
    template: '<button type="button" data-date-picker :data-trigger-icon="triggerIcon" :disabled="disabled" @click="$emit(\'update:modelValue\', new Date(2024, 0, 3))">{{ modelValue }}</button>',
}

const global = { stubs: { DatePicker: DatePickerStub, X: true }, plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { datePickerPlaceholder: '选择日期', dateTimePickerPlaceholder: '选择日期和时间' } } } })] }

describe('DateTimePicker time and controlled state', () => {
    it('keeps seconds and does not mutate the caller Date when changing time', async () => {
        const initial = new Date(2024, 0, 2, 3, 4, 5)
        const wrapper = mount(DateTimePicker, { props: { modelValue: initial }, global })
        const input = wrapper.get('input[type="time"]')
        expect((input.element as HTMLInputElement).value).toBe('03:04:05')
        expect(input.attributes('step')).toBe('1')

        await input.setValue('07:08:09')
        const emitted = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as Date
        expect(initial.getHours()).toBe(3)
        expect(initial.getSeconds()).toBe(5)
        expect(emitted.getHours()).toBe(7)
        expect(emitted.getMinutes()).toBe(8)
        expect(emitted.getSeconds()).toBe(9)
    })

    it('syncs controlled values and disables time/clear controls', async () => {
        const wrapper = mount(DateTimePicker, {
            props: { modelValue: new Date(2024, 0, 2, 3, 4, 5) },
            global,
        })
        await wrapper.setProps({ modelValue: new Date(2024, 0, 4, 11, 12, 13) })
        expect((wrapper.get('input[type="time"]').element as HTMLInputElement).value).toBe('11:12:13')

        await wrapper.setProps({ disabled: true })
        expect((wrapper.get('input[type="time"]').element as HTMLInputElement).disabled).toBe(true)
        expect(wrapper.get('button[aria-label="清除日期时间"]').attributes('disabled')).toBeDefined()
    })

    it('uses the new-api time and clear control visual contract', () => {
        const wrapper = mount(DateTimePicker, { props: { modelValue: new Date(2024, 0, 2, 3, 4, 5) }, global })
        const input = wrapper.get('input[type="time"]')
        expect(input.classes()).toContain('w-32')
        expect(input.classes()).toContain('shrink-0')
        expect(input.classes()).toContain('appearance-none')
        expect(wrapper.get('[data-date-picker]').attributes('data-trigger-icon')).toBe('chevron')
        expect(wrapper.get('button[aria-label="清除日期时间"]').attributes('data-variant')).toBe('outline')
        expect(wrapper.get('button[aria-label="清除日期时间"]').classes()).toContain('shrink-0')
    })

    it('combines a picked date with the current time without mutating the picked Date', async () => {
        const wrapper = mount(DateTimePicker, {
            props: { modelValue: new Date(2024, 0, 2, 6, 7, 8) },
            global,
        })
        const datePicker = wrapper.get('[data-date-picker]')
        await datePicker.trigger('click')
        const emitted = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as Date
        expect(emitted.getDate()).toBe(3)
        expect(emitted.getHours()).toBe(6)
        expect(emitted.getMinutes()).toBe(7)
        expect(emitted.getSeconds()).toBe(8)
    })
})
