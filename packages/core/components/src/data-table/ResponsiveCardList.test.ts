// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import ResponsiveCardList from './ResponsiveCardList.vue'

const global = { plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { noData: '暂无数据', loading: '正在加载', selectCurrentPage: '全选当前页', selectRow: '选择第 {index} 行' } } } })] }

describe('ResponsiveCardList', () => {
    it('renders stable cards and exposes row slot context', () => {
        const wrapper = mount(ResponsiveCardList, {
            global,
            props: { rows: [{ id: 1, name: 'one' }], columns: [{ key: 'name', title: '名称' }] },
            slots: { card: '<div data-card>{{ row.name }} #{{ rowKey }}</div>' },
        })
        expect(wrapper.get('[data-card]').text()).toBe('one #1')
    })

    it('renders loading and empty slots instead of cards', () => {
        const loading = mount(ResponsiveCardList, { global, props: { loading: true, rows: [{ id: 1 }] } })
        expect(loading.findAll('article')).toHaveLength(0)
        expect(loading.findAll('.animate-pulse')).toHaveLength(3)
        const empty = mount(ResponsiveCardList, { global, props: { rows: [] } })
        expect(empty.text()).toContain('暂无数据')
    })

    it('supports current-page card selection and exposes slot state', async () => {
        const wrapper = mount(ResponsiveCardList, {
            global,
            props: { selectable: true, rows: [{ id: 1, name: 'one' }, { id: 2, name: 'two' }] },
            slots: { card: '<div data-card>{{ row.name }} {{ selected ? "selected" : "idle" }}</div>' },
        })
        const rows = wrapper.findAll('input[type="checkbox"]')
        expect(rows).toHaveLength(3)
        await rows[1]!.setValue(true)
        expect(wrapper.emitted('update:selectedKeys')).toEqual([[[1]]])
        expect(wrapper.get('[data-card]').text()).toContain('selected')
        await rows[0]!.setValue(true)
        expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[1, 2]])
    })

    it('preserves persistent selected keys when rows change', async () => {
        const wrapper = mount(ResponsiveCardList, {
            global,
            props: { selectable: true, selectionScope: 'persistent', selectedKeys: [1], rows: [{ id: 2, name: 'two' }] },
        })
        await wrapper.findAll('input[type="checkbox"]').at(-1)!.setValue(true)
        expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[1, 2]])
        await wrapper.setProps({ rows: [{ id: 3, name: 'three' }] })
        expect(wrapper.emitted('update:selectedKeys')).toHaveLength(1)
    })

    it('clears page-scoped selected keys when rows change', async () => {
        const wrapper = mount(ResponsiveCardList, {
            global,
            props: { selectable: true, selectedKeys: [1], rows: [{ id: 1, name: 'one' }] },
        })
        await wrapper.setProps({ rows: [{ id: 2, name: 'two' }] })
        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[]])
    })
})
