// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DataTableBulkActions from './DataTableBulkActions.vue'

describe('DataTableBulkActions', () => {
    it('does not render when there are no selected rows', () => {
        const wrapper = mount(DataTableBulkActions, { props: { selectedCount: 0 } })
        expect(wrapper.find('[data-slot="data-table-bulk-actions"]').exists()).toBe(false)
    })

    it('renders count and emits clear-selection from the button and Escape', async () => {
        const wrapper = mount(DataTableBulkActions, {
            props: { selectedCount: 3, entityName: '渠道', placement: 'inline' },
        })

        expect(wrapper.get('[role="toolbar"]').attributes('aria-describedby')).toBeTruthy()
        expect(wrapper.text()).toContain('3')
        expect(wrapper.text()).toContain('渠道')
        expect(wrapper.get('[role="toolbar"]').classes()).not.toContain('fixed')
        await wrapper.get('button[aria-label="清除选择"]').trigger('click')
        await wrapper.get('[role="toolbar"]').trigger('keydown', { key: 'Escape' })
        expect(wrapper.emitted('clear-selection')).toHaveLength(2)
    })

    it('matches the new-api floating toolbar transition and hover treatment', () => {
        const wrapper = mount(DataTableBulkActions, { props: { selectedCount: 2 } })
        const toolbar = wrapper.get('[role="toolbar"]')
        expect(toolbar.classes()).toContain('fixed')
        expect(toolbar.classes()).toContain('transition-all')
        expect(toolbar.classes()).toContain('hover:scale-105')
    })

    it('moves focus across enabled action buttons with Home, End and arrows', async () => {
        const wrapper = mount(DataTableBulkActions, {
            props: { selectedCount: 2 },
            slots: { actions: '<button type="button">一</button><button type="button">二</button>' },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button').filter((button) => ['一', '二'].includes(button.text()))
        const clearButton = wrapper.get('button[aria-label="清除选择"]')
        await buttons[1]!.element.focus()
        await wrapper.get('[role="toolbar"]').trigger('keydown', { key: 'Home' })
        expect(document.activeElement).toBe(clearButton.element)
        await wrapper.get('[role="toolbar"]').trigger('keydown', { key: 'ArrowRight' })
        expect(document.activeElement).toBe(buttons[0]!.element)
        await wrapper.get('[role="toolbar"]').trigger('keydown', { key: 'End' })
        expect(document.activeElement).toBe(buttons[1]!.element)
        wrapper.unmount()
    })
})
