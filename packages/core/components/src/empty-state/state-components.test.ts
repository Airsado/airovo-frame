// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmptyState from './EmptyState.vue'
import ErrorState from './ErrorState.vue'
import LoadingState from './LoadingState.vue'

describe('status state components', () => {
    it('keeps EmptyState action behavior and supports bordered/action slot', async () => {
        const wrapper = mount(EmptyState, {
            props: { title: '空', bordered: true, actionText: '新增' },
            slots: { action: '<button type="button">辅助动作</button>' },
        })
        expect(wrapper.classes()).toContain('border')
        expect(wrapper.text()).toContain('辅助动作')
        const actionButton = wrapper.findAll('button').find((button) => button.text() === '新增')
        await actionButton?.trigger('click')
        expect(wrapper.emitted('action')).toHaveLength(1)
    })

    it('emits retry and action from ErrorState and exposes alert semantics', async () => {
        const wrapper = mount(ErrorState, { props: { description: '网络暂时不可用', actionText: '返回' } })
        expect(wrapper.attributes('role')).toBe('alert')
        const buttons = wrapper.findAll('button')
        await buttons[0]!.trigger('click')
        await buttons[1]!.trigger('click')
        expect(wrapper.emitted('retry')).toHaveLength(1)
        expect(wrapper.emitted('action')).toHaveLength(1)
    })

    it('supports block and inline loading sizes', () => {
        const block = mount(LoadingState, { props: { size: 'lg' } })
        expect(block.attributes('aria-busy')).toBe('true')
        expect(block.find('.size-8').exists()).toBe(true)
        const inline = mount(LoadingState, { props: { inline: true, message: '保存中', size: 'sm' } })
        expect(inline.element.tagName).toBe('SPAN')
        expect(inline.text()).toContain('保存中')
        expect(inline.find('.size-4').exists()).toBe(true)
    })
})
