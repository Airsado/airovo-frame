// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { FrameworkTabs, FrameworkTabsContent, FrameworkTabsList, FrameworkTabsTrigger } from './index'

describe('framework tabs composition', () => {
    it('uses the new-api density contract and keeps active state semantics', () => {
        const Host = defineComponent({
            setup: () => () => h(FrameworkTabs, { defaultValue: 'one' }, () => [
                h(FrameworkTabsList, null, () => [
                    h(FrameworkTabsTrigger, { value: 'one' }, () => 'One'),
                    h(FrameworkTabsTrigger, { value: 'two' }, () => 'Two'),
                ]),
                h(FrameworkTabsContent, { value: 'one' }, () => 'Content'),
            ]),
        })
        const wrapper = mount(Host)
        const list = wrapper.get('[data-slot="tabs-list"]')
        const trigger = wrapper.get('[data-slot="tabs-trigger"]')

        expect(wrapper.get('[data-slot="tabs"]').classes()).toContain('group/tabs')
        expect(list.attributes('data-variant')).toBe('default')
        expect(list.classes()).toEqual(expect.arrayContaining(['p-[3px]', 'group/tabs-list']))
        expect(trigger.classes()).toEqual(expect.arrayContaining(['px-1.5', 'py-0.5']))
        expect(wrapper.get('[data-slot="tabs-trigger"][data-state="active"]').text()).toBe('One')
        expect(wrapper.get('[data-slot="tabs"]').attributes('data-orientation')).toBe('horizontal')
        // Reka emits data-orientation, unlike Base UI's data-horizontal flag.
        expect(wrapper.get('[data-slot="tabs"]').classes()).toContain('data-[orientation=horizontal]:flex-col')
        wrapper.unmount()
    })

    it('keeps controlled vertical tabs and disabled choices in the primitive contract', async () => {
        const Host = defineComponent({
            setup: () => () => h(FrameworkTabs, { orientation: 'vertical', defaultValue: 'one' }, () => [
                h(FrameworkTabsList, { variant: 'line' }, () => [
                    h(FrameworkTabsTrigger, { value: 'one' }, () => 'One'),
                    h(FrameworkTabsTrigger, { value: 'two', disabled: true }, () => 'Two'),
                    h(FrameworkTabsTrigger, { value: 'three' }, () => 'Three'),
                ]),
            ]),
        })
        const wrapper = mount(Host)
        expect(wrapper.get('[data-slot="tabs"]').attributes('data-orientation')).toBe('vertical')
        const tabs = wrapper.findAll('[role="tab"]')
        expect(tabs[1]!.attributes('disabled')).toBeDefined()
        await tabs[2]!.trigger('mousedown', { button: 0 })
        expect(tabs[2]!.attributes('aria-selected')).toBe('true')
        wrapper.unmount()
    })
})
