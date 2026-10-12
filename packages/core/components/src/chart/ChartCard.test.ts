// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ChartCard from './ChartCard.vue'

describe('ChartCard', () => {
    it('renders a loading skeleton without mounting a chart', () => {
        const wrapper = mount(ChartCard, { props: { title: '调用趋势', loading: true } })
        expect(wrapper.attributes('aria-busy')).toBe('true')
        expect(wrapper.find('canvas').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('暂无图表数据')
    })

    it('renders retry and empty states without a misleading chart', async () => {
        const errorWrapper = mount(ChartCard, { props: { title: '调用趋势', error: new Error('failed') } })
        await errorWrapper.find('button').trigger('click')
        expect(errorWrapper.emitted('retry')).toHaveLength(1)
        expect(errorWrapper.find('canvas').exists()).toBe(false)

        const emptyWrapper = mount(ChartCard, { props: { title: '调用趋势', empty: true, data: { labels: [], datasets: [] } } })
        expect(emptyWrapper.text()).toContain('暂无图表数据')
        expect(emptyWrapper.find('canvas').exists()).toBe(false)
    })
})
