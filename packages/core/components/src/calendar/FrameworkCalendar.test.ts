// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FrameworkCalendar from './FrameworkCalendar.vue'

const CalendarStub = {
    props: ['modelValue', 'minValue', 'maxValue', 'locale', 'layout', 'yearRange'],
    template: '<div v-bind="$attrs" data-stub="calendar"><slot name="calendar-heading" :date="modelValue" /></div>',
}

describe('FrameworkCalendar', () => {
    it('adds new-api surface tokens and forwards calendar props/slots', () => {
        const wrapper = mount(FrameworkCalendar, {
            props: {
                locale: 'zh-CN',
                layout: 'month-and-year',
                minValue: undefined,
                maxValue: undefined,
            },
            slots: {
                'calendar-heading': '<span data-test="heading">自定义月份</span>',
            },
            global: { stubs: { Calendar: CalendarStub } },
        })
        const calendar = wrapper.get('[data-slot="framework-calendar"]')
        expect(calendar.classes()).toEqual(expect.arrayContaining(['group/calendar', 'bg-background', 'p-2']))
        expect(wrapper.get('[data-test="heading"]').text()).toBe('自定义月份')
        expect(wrapper.getComponent(CalendarStub).props('layout')).toBe('month-and-year')
    })

    it('forwards model updates', async () => {
        const wrapper = mount(FrameworkCalendar, { global: { stubs: { Calendar: CalendarStub } } })
        await wrapper.findComponent(CalendarStub).vm.$emit('update:model-value', 'next-date')
        expect(wrapper.emitted('update:modelValue')).toEqual([['next-date']])
    })
})
