// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import DatePicker from './DatePicker.vue'

const stubs = {
    Popover: { template: '<div><slot /></div>' },
    PopoverTrigger: { template: '<div><slot /></div>' },
    PopoverContent: { template: '<div><slot /></div>' },
    Calendar: {
        props: ['minValue', 'maxValue', 'locale', 'showOutsideDays'],
        template: '<div data-calendar :data-min="minValue?.toString()" :data-max="maxValue?.toString()" :data-locale="locale" :data-show-outside-days="showOutsideDays" />',
    },
}
const global = { stubs, plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { datePickerPlaceholder: '选择日期', dateTimePickerPlaceholder: '选择日期和时间' } } } })] }

describe('DatePicker boundaries', () => {
    it('uses locale defaults for date placeholder while explicit values win', () => {
        const en = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': { common: { datePickerPlaceholder: 'Pick a date' } } } })
        const wrapper = mount(DatePicker, { global: { stubs, plugins: [en] } })
        expect(wrapper.get('button').attributes('aria-label')).toBe('Pick a date')
        const explicit = mount(DatePicker, { global: { stubs, plugins: [en] }, props: { placeholder: 'Custom date' } })
        expect(explicit.get('button').attributes('aria-label')).toBe('Custom date')
    })
    it('passes optional min/max dates and locale to Calendar', () => {
        const wrapper = mount(DatePicker, {
            props: {
                minDate: new Date(2024, 0, 1, 12),
                maxDate: new Date(2024, 11, 31, 12),
                locale: 'zh-CN',
            },
            global,
        })
        const calendar = wrapper.get('[data-calendar]')
        expect(calendar.attributes('data-min')).toContain('2024-01-01')
        expect(calendar.attributes('data-max')).toContain('2024-12-31')
        expect(calendar.attributes('data-locale')).toBe('zh-CN')
        expect(calendar.attributes('data-show-outside-days')).toBe('true')
    })

    it('uses the new-api default date boundaries when callers omit them', () => {
        const wrapper = mount(DatePicker, { global })
        const calendar = wrapper.get('[data-calendar]')
        const today = new Date()
        const expectedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        expect(calendar.attributes('data-min')).toBe('1900-01-01')
        expect(calendar.attributes('data-max')).toBe(expectedToday)
        expect(wrapper.get('[data-date-picker-trigger-icon="calendar"]').classes()).toContain('opacity-50')
    })

    it('uses the stable new-api YYYY-MM-DD trigger format across locales', () => {
        const value = new Date(2024, 0, 2, 12)
        const wrapper = mount(DatePicker, {
            props: { modelValue: value, locale: 'en-US' },
            global,
        })
        expect(wrapper.get('button').attributes('aria-label')).toBe('2024-01-02')
        const zh = mount(DatePicker, { props: { modelValue: value, locale: 'zh-CN' }, global })
        expect(zh.get('button').attributes('aria-label')).toBe('2024-01-02')
    })

    it('switches the trigger icon for DateTimePicker while keeping the calendar default', () => {
        const calendar = mount(DatePicker, { global, props: { modelValue: new Date(2024, 0, 2) } })
        expect(calendar.get('[data-date-picker-trigger-icon="calendar"]')).toBeTruthy()
        const chevron = mount(DatePicker, { global, props: { triggerIcon: 'chevron' } })
        expect(chevron.get('[data-date-picker-trigger-icon="chevron"]')).toBeTruthy()
    })

    it('uses the global i18n locale when locale is omitted, while explicit locale wins', () => {
        const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': {} } })
        const wrapper = mount(DatePicker, { global: { stubs, plugins: [i18n] } })
        expect(wrapper.get('[data-calendar]').attributes('data-locale')).toBe('zh-CN')
        const explicit = mount(DatePicker, { props: { locale: 'fr' }, global: { stubs, plugins: [i18n] } })
        expect(explicit.get('[data-calendar]').attributes('data-locale')).toBe('fr')
    })

    it('normalizes new-api locale aliases and falls back for unsupported locales', () => {
        const zh = mount(DatePicker, { props: { locale: 'zhCN' }, global })
        expect(zh.get('[data-calendar]').attributes('data-locale')).toBe('zh-CN')

        const unknown = mount(DatePicker, { props: { locale: 'not-a-locale' }, global })
        expect(unknown.get('[data-calendar]').attributes('data-locale')).toBe('en-US')
    })

    it('exposes the popover trigger state to keyboard and assistive technology', () => {
        const wrapper = mount(DatePicker, { global })
        const trigger = wrapper.get('button')
        expect(trigger.attributes('aria-haspopup')).toBe('dialog')
        expect(trigger.attributes('aria-expanded')).toBe('false')
        expect(trigger.attributes('data-state')).toBe('closed')
    })

    it('keeps an invalid or reversed boundary configuration renderable', () => {
        expect(() => mount(DatePicker, {
            props: { minDate: new Date(2025, 0, 1), maxDate: new Date(2024, 0, 1) },
            global,
        })).not.toThrow()
    })
})
