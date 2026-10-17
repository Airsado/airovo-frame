// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { DropdownMenu } from '@airovo/uikit-shadcnui'
import { createI18n } from 'vue-i18n'
import DataTableViewOptions from './DataTableViewOptions.vue'

const global = { plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { view: '查看', toggleColumns: '切换列', restoreColumns: '恢复默认列' } } } })] }

describe('DataTableViewOptions', () => {
    it('uses locale defaults while explicit labels remain authoritative', () => {
        const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': { common: { view: 'View', toggleColumns: 'Toggle columns', restoreColumns: 'Restore columns' } } } })
        const wrapper = mount(DataTableViewOptions, { global: { plugins: [i18n] }, props: { columns: [{ key: 'name', title: 'Name' }] } })
        expect(wrapper.get('[data-slot="data-table-view-options-trigger"]').attributes('aria-label')).toBe('View')
        const explicit = mount(DataTableViewOptions, { global: { plugins: [i18n] }, props: { columns: [{ key: 'name', title: 'Name' }], label: 'Fields', resetLabel: 'Reset fields' } })
        expect(explicit.get('[data-slot="data-table-view-options-trigger"]').attributes('aria-label')).toBe('Fields')
    })
    it('exposes stable trigger accessibility attributes', () => {
        const wrapper = mount(DataTableViewOptions, {
            global,
            props: { columns: [{ key: 'name', title: '名称' }] },
        })
        const trigger = wrapper.get('[data-slot="data-table-view-options-trigger"]')
        expect(trigger.attributes('aria-label')).toBe('查看')
    })

    it('uses a non-modal menu by default and emits open changes', async () => {
        const wrapper = mount(DataTableViewOptions, {
            global,
            props: { columns: [{ key: 'name', title: '名称' }], dropdownContentClass: 'w-72' },
        })
        const menu = wrapper.findComponent(DropdownMenu)
        expect(menu.props('modal')).toBe(false)
        await menu.vm.$emit('update:open', true)
        expect(wrapper.emitted('dropdown-open-change')).toEqual([[true]])
    })

    it('matches the new-api menu density and keeps reset optional', async () => {
        const wrapper = mount(DataTableViewOptions, {
            global,
            props: {
                columns: [
                    { key: 'name', title: '名称' },
                    { key: 'secret', title: '内部值', hidden: true },
                    { key: 'selection', title: '选择' },
                ],
            },
            attachTo: document.body,
        })
        const trigger = wrapper.get('[data-slot="data-table-view-options-trigger"]')
        expect(trigger.classes()).toContain('shrink-0')
        await trigger.trigger('click')
        await nextTick()
        expect(document.body.querySelector('[data-slot="data-table-view-options-group"]')).not.toBeNull()
        expect(document.body.querySelector('[data-slot="data-table-view-options-reset"]')).toBeNull()
        wrapper.unmount()

        const withReset = mount(DataTableViewOptions, {
            global,
            props: { columns: [{ key: 'name', title: '名称' }], showReset: true },
            attachTo: document.body,
        })
        await withReset.get('[data-slot="data-table-view-options-trigger"]').trigger('click')
        await nextTick()
        expect(document.body.querySelector('[data-slot="data-table-view-options-reset"]')?.getAttribute('aria-label')).toBe('恢复默认列')
        withReset.unmount()
    })
})
