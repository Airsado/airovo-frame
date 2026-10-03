// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import DataTable from './DataTable.vue'

const columns = [
    { key: 'name', title: '名称', sortable: true },
    { key: 'kind', title: '类型', hidden: true },
]

const rows = [
    { id: 1, name: 'one', kind: 'a' },
    { id: 2, name: 'two', kind: 'b' },
]

function mountTable(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
    return mount(DataTable, {
        props: { columns, data: rows, ...props },
        slots,
        global: {
            plugins: [createI18n({
                legacy: false,
                locale: 'zh-CN',
                messages: { 'zh-CN': { common: { noData: '暂无数据' } } },
            })],
        },
    })
}

describe('DataTable', () => {
    it('supports controlled row selection and current-page select-all state', async () => {
        const wrapper = mountTable({ selectable: true }, {
                'cell-name': ({ value }: { value: unknown }) => `slot:${String(value)}`,
        })

        expect(wrapper.text()).toContain('slot:one')
        expect(wrapper.text()).not.toContain('a')

        const checkboxes = wrapper.findAll('input[type="checkbox"]')
        await checkboxes[1].setValue(true)
        expect(wrapper.emitted('selection-change')?.at(-1)).toEqual([[1]])
        expect((checkboxes[0].element as HTMLInputElement).indeterminate).toBe(true)

        await checkboxes[0].setValue(true)
        expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[1, 2]])
        expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    })

    it('clears stale controlled keys when the page-scoped rows change', async () => {
        const wrapper = mountTable({ selectable: true, selectedKeys: [1], page: 1 })

        await wrapper.setProps({ data: [{ id: 3, name: 'three', kind: 'c' }], page: 2 })
        expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[]])
    })
})
