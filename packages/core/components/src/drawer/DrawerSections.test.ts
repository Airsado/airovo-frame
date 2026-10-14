// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DrawerSection from './DrawerSection.vue'
import DrawerSectionHeader from './DrawerSectionHeader.vue'
import DrawerSwitchItem from './DrawerSwitchItem.vue'

describe('Drawer section compositions', () => {
    it('matches the new-api section spacing and removes the final divider', () => {
        const wrapper = mount(DrawerSection, { slots: { default: '<span>内容</span>' } })
        expect(wrapper.get('section').classes()).toContain('border-b')
        expect(wrapper.get('section').classes()).toContain('last:border-b-0')
        expect(wrapper.text()).toContain('内容')
    })

    it('renders a semantic header with optional icon, description and actions', () => {
        const wrapper = mount(DrawerSectionHeader, {
            props: { title: '请求设置', description: '控制默认请求行为', icon: 'lucide:settings', iconTone: 'info' },
            slots: { actions: '<button>重置</button>' },
        })
        expect(wrapper.get('h3').text()).toBe('请求设置')
        expect(wrapper.text()).toContain('控制默认请求行为')
        expect(wrapper.text()).toContain('重置')
        expect(wrapper.find('.text-info').exists()).toBe(true)
    })

    it('keeps switch controls separate from the descriptive content', () => {
        const wrapper = mount(DrawerSwitchItem, {
            slots: { default: '<span>启用缓存</span>', control: '<button aria-label="切换">开关</button>' },
        })
        expect(wrapper.get('[aria-label="切换"]').exists()).toBe(true)
        expect(wrapper.get('div').classes()).toContain('min-h-16')
    })
})
