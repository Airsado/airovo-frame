// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '@airovo/uikit-shadcnui'
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

    it('forwards dropdown configuration and emits open changes', async () => {
        const wrapper = mount(DataTableRowActions, {
            props: {
                row: { id: 1 },
                dropdownModal: false,
                dropdownAriaLabel: '行操作',
                dropdownContentClass: 'w-72',
                dropdownActions: [{ key: 'copy', label: '复制', onSelect: vi.fn() }],
            },
        })
        const menu = wrapper.findComponent(DropdownMenu)
        expect(menu.props('modal')).toBe(false)
        expect(wrapper.get('[data-slot="dropdown-menu-trigger"]').attributes('aria-label')).toBe('行操作')
        await menu.vm.$emit('update:open', true)
        expect(wrapper.emitted('dropdown-open-change')).toEqual([[true]])
    })
})
