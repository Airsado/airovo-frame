// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
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

    it('matches the new-api menu density and exposes grouped reset semantics', async () => {
        const wrapper = mount(DataTableViewOptions, {
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
        expect(document.body.querySelector('[data-slot="data-table-view-options-reset"]')?.getAttribute('aria-label')).toBe('恢复默认列')
        wrapper.unmount()
    })
})
