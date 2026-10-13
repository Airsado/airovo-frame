// @vitest-environment happy-dom
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import StatusBadge from './StatusBadge.vue'
import StatusBadgeList from './StatusBadgeList.vue'

describe('StatusBadge', () => {
    it('keeps legacy status labels while using the new-api badge shape', () => {
        const wrapper = mount(StatusBadge, { props: { status: 'success', copyable: false } })
        const badge = wrapper.get('[data-slot="status-badge"]')

        expect(badge.classes()).toContain('rounded-4xl')
        expect(badge.text()).toContain('成功')
        expect(badge.find('svg').exists()).toBe(false)
    })

    it('supports text and underline variants, sizes, dots, and pulse', () => {
        const text = mount(StatusBadge, {
            props: { variant: 'danger', label: '失败', type: 'text', size: 'lg', showDot: true, pulse: true, copyable: false },
        })
        const badge = text.get('[data-slot="status-badge"]')

        expect(badge.classes()).toContain('text-destructive')
        expect(badge.classes()).toContain('gap-1.5')
        expect(badge.classes()).toContain('animate-pulse')
        expect(badge.find('span span').exists()).toBe(true)

        const underline = mount(StatusBadge, { props: { variant: 'info', type: 'underline', copyable: false } })
        expect(underline.get('[data-slot="status-badge"]').classes()).toContain('border-b')
    })

    it('copies through click and keyboard paths', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
        const wrapper = mount(StatusBadge, { props: { variant: 'blue', label: '渠道', copyable: true } })
        const badge = wrapper.get('[data-slot="status-badge"]')

        await badge.trigger('click')
        await badge.trigger('keydown', { key: 'Enter' })
        await badge.trigger('keydown', { key: ' ' })

        expect(writeText).toHaveBeenCalledWith('渠道')
        expect(writeText).toHaveBeenCalledTimes(3)
        expect(wrapper.emitted('copy')).toEqual([['渠道'], ['渠道'], ['渠道']])
    })

    it('derives a stable text color from autoColor', () => {
        const first = mount(StatusBadge, { props: { autoColor: 'tenant-a', label: '租户', copyable: false } })
        const second = mount(StatusBadge, { props: { autoColor: 'tenant-a', label: '租户', copyable: false } })

        expect(first.get('[data-slot="status-badge"]').classes().filter((value) => value.startsWith('text-')))
            .toEqual(second.get('[data-slot="status-badge"]').classes().filter((value) => value.startsWith('text-')))
    })
})

describe('StatusBadgeList', () => {
    it('renders item slots, max overflow, and empty content', () => {
        const wrapper = mount(StatusBadgeList, {
            props: { items: ['one', 'two', 'three'], max: 2 },
            slots: { item: ({ item }: { item: string }) => h('span', { 'data-item': item }, item) },
        })

        expect(wrapper.findAll('[data-item]')).toHaveLength(2)
        expect(wrapper.text()).toContain('+1')

        const empty = mount(StatusBadgeList, { props: { items: [] } })
        expect(empty.text()).toBe('-')
    })
})
