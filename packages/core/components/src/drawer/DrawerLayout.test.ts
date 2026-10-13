// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DrawerLayout from './DrawerLayout.vue'

const stubs = {
    DrawerContent: { props: ['side', 'showHandle'], template: '<div data-slot="drawer-content" :data-side="side" :data-show-handle="showHandle"><slot /></div>' },
    DrawerHeader: { template: '<header data-slot="drawer-header"><slot /></header>' },
    DrawerTitle: { template: '<h2 data-slot="drawer-title"><slot /></h2>' },
    DrawerDescription: { template: '<p data-slot="drawer-description"><slot /></p>' },
    DrawerBody: { template: '<main data-slot="drawer-body"><slot /></main>' },
    DrawerFooter: { template: '<footer data-slot="drawer-footer"><slot /></footer>' },
}

describe('DrawerLayout', () => {
    it('composes right-side header, body, actions and footer slots', () => {
        const wrapper = mount(DrawerLayout, {
            props: { title: '详情', description: '编辑内容', side: 'right', showHandle: false },
            slots: { default: '主体', actions: '操作', footer: '底部' },
            global: { stubs },
        })
        expect(wrapper.get('[data-slot="drawer-content"]').attributes('data-side')).toBe('right')
        expect(wrapper.get('[data-slot="drawer-content"]').attributes('data-show-handle')).toBe('false')
        expect(wrapper.text()).toContain('详情')
        expect(wrapper.text()).toContain('主体')
        expect(wrapper.text()).toContain('操作')
        expect(wrapper.text()).toContain('底部')
        expect(wrapper.get('[data-slot="drawer-content"]').classes()).toContain('h-dvh')
        expect(wrapper.get('[data-slot="drawer-header"]').classes()).toContain('backdrop-blur')
        expect(wrapper.get('[data-slot="drawer-body"]').classes()).toContain('overscroll-contain')
        expect(wrapper.get('[data-slot="drawer-footer"]').classes()).toContain('border-t')
    })
})
