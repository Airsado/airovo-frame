// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import FacetedFilter from './FacetedFilter.vue'

const global = { plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { filter: '筛选', noResults: '未找到结果。', clearFilters: '清除筛选', selected: '已选择' } } } })] }

describe('FacetedFilter', () => {
    it('uses locale defaults while explicit labels remain authoritative', () => {
        const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': { common: { filter: 'Filter', noResults: 'No results', clearFilters: 'Clear filters', selected: 'selected' } } } })
        const wrapper = mount(FacetedFilter, { global: { plugins: [i18n] }, props: { options: [{ label: 'Open', value: 'open' }] } })
        expect(wrapper.text()).toContain('Filter')
        const explicit = mount(FacetedFilter, { global, props: { title: '状态', emptyText: '没有状态', clearText: '清除状态', selectedText: '项', options: [{ label: '运行中', value: 'running' }] } })
        expect(explicit.text()).toContain('状态')
    })
})
