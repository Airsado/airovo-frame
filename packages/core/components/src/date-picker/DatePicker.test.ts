// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
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

    it('keeps an invalid or reversed boundary configuration renderable', () => {
        expect(() => mount(DatePicker, {
            props: { minDate: new Date(2025, 0, 1), maxDate: new Date(2024, 0, 1) },
            global: { stubs },
        })).not.toThrow()
    })
})
