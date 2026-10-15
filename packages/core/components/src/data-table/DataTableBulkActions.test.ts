// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import DataTableBulkActions from './DataTableBulkActions.vue'

const global = { plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { records: '条记录', selected: '已选择', clearSelection: '清除选择', clearSelectionWithEscape: '清除选择（Escape）', bulkActions: '批量操作：{count} 项已选择', bulkAnnouncement: '已选择 {count} {entity}，可执行批量操作' } } } })] }

describe('DataTableBulkActions', () => {
    it('uses the active locale for default toolbar labels while entityName remains explicit', () => {
        const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': { common: { records: 'records', selected: 'selected', clearSelection: 'Clear selection', clearSelectionWithEscape: 'Clear selection (Escape)', bulkActions: 'Bulk actions for {count} selected records', bulkAnnouncement: '{count} {entity} selected. Bulk actions are available.' } } } })
        const wrapper = mount(DataTableBulkActions, { global: { plugins: [i18n] }, props: { selectedCount: 2, entityName: 'users' } })
        expect(wrapper.get('[role="toolbar"]').attributes('aria-label')).toContain('2')
        expect(wrapper.get('button').attributes('aria-label')).toBe('Clear selection')
        expect(wrapper.text()).toContain('selected')
    })
    it('does not render when there are no selected rows', () => {
        const wrapper = mount(DataTableBulkActions, { global, props: { selectedCount: 0 } })
        expect(wrapper.find('[data-slot="data-table-bulk-actions"]').exists()).toBe(false)
    })

    it('renders count and emits clear-selection from the button and Escape', async () => {
        const wrapper = mount(DataTableBulkActions, {
            global, props: { selectedCount: 3, entityName: '渠道', placement: 'inline' },
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
        const wrapper = mount(DataTableBulkActions, { global, props: { selectedCount: 2 } })
        const toolbar = wrapper.get('[role="toolbar"]')
        expect(toolbar.classes()).toContain('fixed')
        expect(toolbar.classes()).toContain('transition-all')
        expect(toolbar.classes()).toContain('hover:scale-105')
    })

    it('matches the new-api inline surface and action sizing', () => {
        const wrapper = mount(DataTableBulkActions, { global, props: { selectedCount: 2, entityName: 'user', placement: 'inline' } })
        const toolbar = wrapper.get('[role="toolbar"]')
        const surface = toolbar.get('div > div')
        expect(toolbar.classes()).toContain('shrink-0')
        expect(toolbar.classes()).toContain('rounded-xl')
        expect(toolbar.classes()).not.toContain('w-full')
        expect(surface.classes()).toContain('supports-[backdrop-filter]:bg-background/60')
        expect(surface.classes()).not.toContain('supports-[backdrop-filter]:bg-background/70')
        expect(wrapper.text()).toContain('users')
        expect(wrapper.get('button[aria-label="清除选择"]').classes()).toContain('size-6')
    })

    it('moves focus across enabled action buttons with Home, End and arrows', async () => {
        const wrapper = mount(DataTableBulkActions, {
            global, props: { selectedCount: 2 },
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
