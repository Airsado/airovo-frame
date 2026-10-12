// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import DataTableRowActions from './DataTableRowActions.vue'

describe('DataTableRowActions', () => {
    it('shows a fallback spinner and blocks a loading action without an icon', async () => {
        const callback = vi.fn()
        const wrapper = mount(DataTableRowActions, {
            props: { row: { id: 1 }, actions: [{ key: 'save', label: '保存', loading: true, onSelect: callback }] },
        })
        const button = wrapper.get('[data-slot="data-table-row-action"]')
        expect(button.attributes('aria-busy')).toBe('true')
        expect((button.element as HTMLButtonElement).disabled).toBe(true)
        expect(button.find('svg').classes()).toContain('animate-spin')
        await button.trigger('click')
        expect(callback).not.toHaveBeenCalled()
    })

    it('keeps normal actions callable and exposes stable action keys', async () => {
        const callback = vi.fn()
        const wrapper = mount(DataTableRowActions, {
            props: { row: { id: 1 }, actions: [{ key: 'view', label: '查看', onSelect: callback }] },
        })
        const button = wrapper.get('[data-slot="data-table-row-action"]')
        expect(button.attributes('data-action-key')).toBe('view')
        await button.trigger('click')
        expect(callback).toHaveBeenCalledWith({ id: 1 })
    })
})
