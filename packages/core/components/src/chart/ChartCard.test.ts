// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import ChartCard from './ChartCard.vue'

const global = { plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { chartLoading: '正在加载图表', chartError: '图表加载失败', chartEmpty: '暂无图表数据', retry: '重试' } } } })] }

describe('ChartCard', () => {
    it('renders a loading skeleton without mounting a chart', () => {
        const wrapper = mount(ChartCard, { global, props: { title: '调用趋势', loading: true } })
        expect(wrapper.attributes('aria-busy')).toBe('true')
        expect(wrapper.find('canvas').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('暂无图表数据')
    })

    it('renders the optional tooltip slot only in the chart state', () => {
        const wrapper = mount(ChartCard, {
            global,
            props: { title: '趋势', data: { labels: ['一'], datasets: [{ label: '请求', data: [1] }] }, tooltipLabel: '周一', tooltipItems: [{ color: '#111', name: '请求', value: 1 }] },
            slots: { tooltip: ({ label, items }: { label?: string; items: unknown[] }) => `${label}:${items.length}` },
        })
        expect(wrapper.text()).toContain('周一:1')
        const loading = mount(ChartCard, { global, props: { title: '趋势', loading: true, tooltipLabel: '隐藏' }, slots: { tooltip: '隐藏' } })
        expect(loading.text()).not.toContain('隐藏')
    })

    it('uses the shared new-api tooltip composition when no custom slot is supplied', () => {
        const wrapper = mount(ChartCard, {
            global,
            props: {
                title: '趋势',
                data: { labels: ['一'], datasets: [{ label: '请求', data: [1] }] },
                tooltipLabel: '周一',
                tooltipItems: [{ color: '#123456', name: '请求量', value: 2400 }],
            },
        })

        expect(wrapper.text()).toContain('周一')
        expect(wrapper.text()).toContain('请求量')
        expect(wrapper.find('.mt-3').classes()).toContain('shadow-xl')
    })

    it('renders retry and empty states without a misleading chart', async () => {
        const errorWrapper = mount(ChartCard, { global, props: { title: '调用趋势', error: new Error('failed') } })
        expect(errorWrapper.get('[role="alert"]').text()).toContain('图表加载失败')
        await errorWrapper.find('button').trigger('click')
        expect(errorWrapper.emitted('retry')).toHaveLength(1)
        expect(errorWrapper.find('canvas').exists()).toBe(false)

        const emptyWrapper = mount(ChartCard, { global, props: { title: '调用趋势', empty: true, data: { labels: [], datasets: [] } } })
        expect(emptyWrapper.text()).toContain('暂无图表数据')
        expect(emptyWrapper.get('[role="status"]').text()).toContain('暂无图表数据')
        expect(emptyWrapper.find('canvas').exists()).toBe(false)

        const emptyDatasetWrapper = mount(ChartCard, { global, props: { title: '调用趋势', data: { labels: ['一'], datasets: [{ label: '请求', data: [] }] } } })
        expect(emptyDatasetWrapper.text()).toContain('暂无图表数据')
        expect(emptyDatasetWrapper.find('canvas').exists()).toBe(false)
    })

    it('marks loading state as a live status', () => {
        const wrapper = mount(ChartCard, { global, props: { title: '调用趋势', loading: true } })
        expect(wrapper.get('[role="status"]').attributes('aria-live')).toBe('polite')
    })
})
