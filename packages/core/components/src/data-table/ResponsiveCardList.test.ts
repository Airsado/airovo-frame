// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ResponsiveCardList from './ResponsiveCardList.vue'

describe('ResponsiveCardList', () => {
    it('renders stable cards and exposes row slot context', () => {
        const wrapper = mount(ResponsiveCardList, {
            props: { rows: [{ id: 1, name: 'one' }], columns: [{ key: 'name', title: '名称' }] },
            slots: { card: '<div data-card>{{ row.name }} #{{ rowKey }}</div>' },
        })
        expect(wrapper.get('[data-card]').text()).toBe('one #1')
    })

    it('renders loading and empty slots instead of cards', () => {
        const loading = mount(ResponsiveCardList, { props: { loading: true, rows: [{ id: 1 }] } })
        expect(loading.findAll('article')).toHaveLength(0)
        expect(loading.findAll('.animate-pulse')).toHaveLength(3)
        const empty = mount(ResponsiveCardList, { props: { rows: [] } })
        expect(empty.text()).toContain('暂无数据')
    })
})
