// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '@airovo/uikit-shadcnui'
import DataTableViewOptions from './DataTableViewOptions.vue'

describe('DataTableViewOptions', () => {
    it('exposes stable trigger accessibility attributes', () => {
        const wrapper = mount(DataTableViewOptions, {
            props: { columns: [{ key: 'name', title: '名称' }] },
        })
        const trigger = wrapper.get('[data-slot="data-table-view-options-trigger"]')
        expect(trigger.attributes('aria-label')).toBe('列显示')
    })

    it('uses a non-modal menu by default and emits open changes', async () => {
        const wrapper = mount(DataTableViewOptions, {
            props: { columns: [{ key: 'name', title: '名称' }], dropdownContentClass: 'w-72' },
        })
        const menu = wrapper.findComponent(DropdownMenu)
        expect(menu.props('modal')).toBe(false)
        await menu.vm.$emit('update:open', true)
        expect(wrapper.emitted('dropdown-open-change')).toEqual([[true]])
    })
})
