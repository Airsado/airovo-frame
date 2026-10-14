// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import DatePicker from './DatePicker.vue'

const stubs = {
    Popover: { template: '<div><slot /></div>' },
    PopoverTrigger: { template: '<div><slot /></div>' },
    PopoverContent: { template: '<div><slot /></div>' },
    Calendar: {
        props: ['minValue', 'maxValue', 'locale'],
        template: '<div data-calendar :data-min="minValue?.toString()" :data-max="maxValue?.toString()" :data-locale="locale" />',
    },
}

describe('DatePicker boundaries', () => {
    it('passes optional min/max dates and locale to Calendar', () => {
        const wrapper = mount(DatePicker, {
            props: {
                minDate: new Date(2024, 0, 1, 12),
                maxDate: new Date(2024, 11, 31, 12),
                locale: 'zh-CN',
            },
            global: { stubs },
        })
        const calendar = wrapper.get('[data-calendar]')
        expect(calendar.attributes('data-min')).toContain('2024-01-01')
        expect(calendar.attributes('data-max')).toContain('2024-12-31')
        expect(calendar.attributes('data-locale')).toBe('zh-CN')
    })

    it('uses the stable new-api YYYY-MM-DD trigger format across locales', () => {
        const value = new Date(2024, 0, 2, 12)
        const wrapper = mount(DatePicker, {
            props: { modelValue: value, locale: 'en-US' },
            global: { stubs },
        })
        expect(wrapper.get('button').attributes('aria-label')).toBe('2024-01-02')
        const zh = mount(DatePicker, { props: { modelValue: value, locale: 'zh-CN' }, global: { stubs } })
        expect(zh.get('button').attributes('aria-label')).toBe('2024-01-02')
    })

    it('uses the global i18n locale when locale is omitted, while explicit locale wins', () => {
        const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': {} } })
        const wrapper = mount(DatePicker, { global: { stubs, plugins: [i18n] } })
        expect(wrapper.get('[data-calendar]').attributes('data-locale')).toBe('zh-CN')
        const explicit = mount(DatePicker, { props: { locale: 'fr' }, global: { stubs, plugins: [i18n] } })
        expect(explicit.get('[data-calendar]').attributes('data-locale')).toBe('fr')
    })

    it('keeps an invalid or reversed boundary configuration renderable', () => {
        expect(() => mount(DatePicker, {
            props: { minDate: new Date(2025, 0, 1), maxDate: new Date(2024, 0, 1) },
            global: { stubs },
        })).not.toThrow()
    })
})
