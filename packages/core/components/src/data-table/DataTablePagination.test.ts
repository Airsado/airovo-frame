// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import DataTablePagination from './DataTablePagination.vue'
import DataTable from './DataTable.vue'

describe('DataTablePagination', () => {
    it('clamps page navigation and emits page-size changes', async () => {
        const wrapper = mount(DataTablePagination, {
            props: { page: 2, pageSize: 10, total: 21 },
        })

        expect(wrapper.text()).toContain('第 2 / 3 页')
        expect(wrapper.get('[data-slot="pagination-link"][data-active]').attributes('aria-current')).toBe('page')
        await wrapper.get('[aria-label="Go to next page"]').trigger('click')
        expect(wrapper.emitted('update:page')?.at(-1)).toEqual([3])

        await wrapper.find('select').setValue('20')
        expect(wrapper.emitted('update:pageSize')?.at(-1)).toEqual([20])
    })

    it('supports a bounded table viewport without losing horizontal scrolling', () => {
        const wrapper = mount(DataTable, {
            props: {
                columns: [{ key: 'name', title: '名称' }],
                data: [{ id: 1, name: 'one' }],
                maxHeight: 320,
            },
            global: {
                plugins: [createI18n({
                    legacy: false,
                    locale: 'zh-CN',
                    messages: { 'zh-CN': { common: { noData: '暂无数据' } } },
                })],
            },
        })

        expect(wrapper.attributes('style')).toContain('max-height: 320px')
        expect(wrapper.classes()).toContain('overflow-y-auto')
        expect(wrapper.classes()).toContain('overflow-x-auto')
    })
})
