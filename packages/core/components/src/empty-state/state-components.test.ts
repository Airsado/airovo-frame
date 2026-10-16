// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import EmptyState from './EmptyState.vue'
import ErrorState from './ErrorState.vue'
import LoadingState from './LoadingState.vue'

const global = {
    plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: {
        'zh-CN': { common: { noData: '暂无数据', error: '操作失败', retry: '重试', loading: '加载中…' } },
        'en-US': { common: { noData: 'No data', error: 'Something went wrong', retry: 'Retry', loading: 'Loading…' } },
    } })],
}

describe('status state components', () => {
    it('matches the new-api default empty state density and content', () => {
        const wrapper = mount(EmptyState, { global })

        expect(wrapper.get('[data-slot="empty-title"]').text()).toBe('暂无数据')
        expect(wrapper.get('[data-slot="empty-icon"]').classes()).toContain('size-8')
        expect(wrapper.get('[data-slot="empty-title"]').classes()).toEqual(expect.arrayContaining(['text-sm', 'font-medium']))
        expect(wrapper.get('[data-slot="empty"]').classes()).toEqual(expect.arrayContaining(['w-full', 'gap-4', 'rounded-xl', 'p-6']))
        expect(wrapper.get('[data-slot="empty"]').classes()).toContain('border-dashed')
        expect(wrapper.get('[data-slot="empty"]').classes()).toContain('motion-safe:animate-in')
        expect(wrapper.classes()).toContain('min-h-[300px]')
    })

    it('keeps the new-api default title when the i18n key is unavailable', () => {
        const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: {} } } })
        const wrapper = mount(EmptyState, { global: { plugins: [i18n] } })

        expect(wrapper.get('[data-slot="empty-title"]').text()).toBe('暂无数据')
    })

    it('uses the active locale for defaults while explicit props remain authoritative', () => {
        const i18n = createI18n({ legacy: false, locale: 'en-US', messages: {
            'en-US': { common: { noData: 'No data', error: 'Something went wrong', retry: 'Retry', loading: 'Loading…' } },
        } })
        const empty = mount(EmptyState, { global: { plugins: [i18n] } })
        expect(empty.get('[data-slot="empty-title"]').text()).toBe('No data')
        const error = mount(ErrorState, { global: { plugins: [i18n] }, props: { title: 'Custom error', retryText: 'Try again' } })
        expect(error.get('[data-slot="empty-title"]').text()).toBe('Custom error')
        expect(error.text()).toContain('Try again')
        const loading = mount(LoadingState, { global: { plugins: [i18n] } })
        expect(loading.text()).toContain('Loading…')
    })

    it('keeps EmptyState action behavior and supports bordered/action slot', async () => {
        const wrapper = mount(EmptyState, {
            global,
            props: { title: '空', bordered: true, actionText: '新增' },
            slots: { action: '<button type="button">辅助动作</button>' },
        })
        expect(wrapper.classes()).toContain('border')
        expect(wrapper.get('[data-slot="empty"]').classes()).toContain('border-dashed')
        expect(wrapper.get('[data-slot="empty"]')).toBeTruthy()
        expect(wrapper.get('[data-slot="empty-title"]').text()).toBe('空')
        expect(wrapper.get('[data-slot="empty-content"]').classes()).toContain('gap-2.5')
        expect(wrapper.text()).toContain('辅助动作')
        const actionButton = wrapper.findAll('button').find((button) => button.text() === '新增')
        await actionButton?.trigger('click')
        expect(wrapper.emitted('action')).toHaveLength(1)
    })

    it.each([
        ['sm', 'size-8'],
        ['md', 'size-12'],
        ['lg', 'size-16'],
    ] as const)('renders icon, description and %s media size', (size, mediaSize) => {
        const wrapper = mount(EmptyState, {
            global,
            props: { icon: 'lucide:inbox', description: '暂无数据', size },
        })
        expect(wrapper.get('[data-slot="empty-icon"]')).toBeTruthy()
        expect(wrapper.get('[data-slot="empty-description"]').text()).toBe('暂无数据')
        expect(wrapper.get('[data-slot="empty-icon"]').classes()).toContain(mediaSize)
    })

    it('emits retry and action from ErrorState and exposes alert semantics', async () => {
        const wrapper = mount(ErrorState, { global, props: { description: '网络暂时不可用', showRetry: true, actionText: '返回' } })
        expect(wrapper.attributes('role')).toBe('alert')
        expect(wrapper.get('[data-slot="empty"]')).toBeTruthy()
        expect(wrapper.get('[data-slot="empty-icon"]').attributes('data-variant')).toBe('icon')
        expect(wrapper.get('[data-slot="empty"]').classes()).toEqual(expect.arrayContaining(['w-full', 'gap-4', 'rounded-xl', 'p-6']))
        expect(wrapper.get('[data-slot="empty"]').classes()).toContain('border-dashed')
        expect(wrapper.get('[data-slot="empty-icon"]').classes()).toContain('size-8')
        expect(wrapper.get('[data-slot="empty-title"]').classes()).toEqual(expect.arrayContaining(['text-sm', 'font-medium']))
        expect(wrapper.get('[data-slot="empty-content"]').classes()).toContain('gap-2.5')
        expect(wrapper.get('[data-slot="empty-description"]').text()).toContain('网络暂时不可用')
        expect(wrapper.get('[data-slot="empty"]').classes()).toContain('motion-safe:fade-in-0')
        const buttons = wrapper.findAll('button')
        await buttons[0]!.trigger('click')
        await buttons[1]!.trigger('click')
        expect(wrapper.emitted('retry')).toHaveLength(1)
        expect(wrapper.emitted('action')).toHaveLength(1)
        expect(wrapper.get('[data-slot="empty"]').classes()).toContain('min-h-[300px]')
    })

    it('does not render retry without an explicit retry capability', () => {
        const withoutRetry = mount(ErrorState, { global, props: { description: '网络暂时不可用' } })
        expect(withoutRetry.find('button').exists()).toBe(false)

        const withRetryText = mount(ErrorState, { global, props: { retryText: '再试一次' } })
        expect(withRetryText.get('button').text()).toBe('再试一次')
    })

    it('supports block and inline loading sizes', () => {
        const block = mount(LoadingState, { global, props: { size: 'lg' } })
        expect(block.attributes('aria-busy')).toBe('true')
        expect(block.attributes('role')).toBe('status')
        expect(block.attributes('aria-label')).toBe('加载中…')
        expect(block.findAll('[role="status"]')).toHaveLength(1)
        expect(block.classes()).toContain('min-h-[200px]')
        expect(block.find('.size-8').exists()).toBe(true)
        expect(block.find('.motion-reduce\\:animate-none').exists()).toBe(true)
        const inline = mount(LoadingState, { global, props: { inline: true, message: '保存中', size: 'sm' } })
        expect(inline.element.tagName).toBe('SPAN')
        expect(inline.attributes('role')).toBe('status')
        expect(inline.text()).toContain('保存中')
        expect(inline.find('.size-4').exists()).toBe(true)
    })

    it('keeps the new-api inline message optional', () => {
        const withoutMessage = mount(LoadingState, { global, props: { inline: true } })
        expect(withoutMessage.find('.text-sm.text-muted-foreground').exists()).toBe(false)
        expect(withoutMessage.find('.animate-spin').exists()).toBe(true)
        expect(withoutMessage.findAll('[role="status"]')).toHaveLength(1)

        const emptyMessage = mount(LoadingState, { global, props: { inline: true, message: '' } })
        expect(emptyMessage.find('.text-sm.text-muted-foreground').exists()).toBe(true)
        expect(emptyMessage.text()).not.toContain('加载中…')
    })
})
