// @vitest-environment happy-dom
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import DataPanel from './DataPanel.vue'

const i18n = createI18n({
    legacy: false,
    locale: 'zh-CN',
    messages: {
        'zh-CN': {
            common: {
                noData: '暂无数据',
                noDataDescription: '当前没有数据',
                error: '操作失败',
                retry: '重试',
                loading: '加载中…',
            },
        },
    },
})

const global = { plugins: [i18n] }

describe('DataPanel', () => {
    it('keeps normal content, toolbar, footer and fixed-height behavior', () => {
        const wrapper = mount(DataPanel, {
            global,
            props: { fixedHeight: true },
            slots: {
                toolbar: '<button type="button">筛选</button>',
                default: '<p data-test="content">内容</p>',
                footer: '<button type="button">保存</button>',
            },
        })

        expect(wrapper.get('[data-test="content"]').text()).toBe('内容')
        expect(wrapper.get('section').attributes('aria-busy')).toBeUndefined()
        expect(wrapper.get('section').classes()).toContain('h-full')
        expect(wrapper.get('section > div:nth-of-type(2)').classes()).toContain('overflow-auto')
        expect(wrapper.text()).toContain('筛选')
        expect(wrapper.text()).toContain('保存')
    })

    it('uses LoadingState by default and lets callers provide a loading slot', () => {
        const loading = mount(DataPanel, { global, props: { loading: true } })

        expect(loading.get('section').attributes('aria-busy')).toBe('true')
        expect(loading.get('[data-slot="data-panel-loading"] [role="status"]').exists()).toBe(true)
        expect(loading.find('[data-slot="data-panel-empty"]').exists()).toBe(false)
        expect(loading.find('[data-test="content"]').exists()).toBe(false)

        const custom = mount(DataPanel, {
            global,
            props: { loading: true },
            slots: { loading: '<div data-test="skeleton">骨架屏</div>' },
        })
        expect(custom.get('[data-test="skeleton"]').text()).toBe('骨架屏')
        expect(custom.find('[role="status"]').exists()).toBe(false)
    })

    it('uses EmptyState defaults and keeps the legacy empty slot override', () => {
        const wrapper = mount(DataPanel, {
            global,
            props: { empty: true, emptyTitle: '暂无活动', emptyDescription: '调整筛选条件后重试', emptyIcon: 'lucide:inbox' },
        })

        expect(wrapper.get('[data-slot="data-panel-empty"] [data-slot="empty-title"]').text()).toBe('暂无活动')
        expect(wrapper.get('[data-slot="data-panel-empty"] [data-slot="empty-description"]').text()).toBe('调整筛选条件后重试')
        expect(wrapper.get('[data-slot="data-panel-empty"] [data-slot="empty-icon"]').exists()).toBe(true)

        const custom = mount(DataPanel, {
            global,
            props: { empty: true },
            slots: { empty: '<div data-test="empty-custom">自定义空态</div>' },
        })
        expect(custom.get('[data-test="empty-custom"]').text()).toBe('自定义空态')
        expect(custom.find('[data-slot="empty-title"]').exists()).toBe(false)
    })

    it('renders ErrorState, emits retry and exposes a scoped error slot callback', async () => {
        const wrapper = mount(DataPanel, {
            global,
            props: { error: new Error('network'), errorText: '网络暂时不可用', showRetry: true },
        })

        expect(wrapper.get('[data-slot="data-panel-error"] [role="alert"]').exists()).toBe(true)
        expect(wrapper.get('[data-slot="empty-description"]').text()).toBe('网络暂时不可用')
        await wrapper.get('button').trigger('click')
        expect(wrapper.emitted('retry')).toHaveLength(1)

        const custom = mount(DataPanel, {
            global,
            props: { error: 'failed' },
            slots: {
                error: ({ error, retry }: { error: unknown; retry: () => void }) => h('div', [
                    h('span', { 'data-test': 'error-value' }, String(error)),
                    h('button', { type: 'button', 'data-test': 'error-retry', onClick: retry }, '再试'),
                ]),
            },
        })
        expect(custom.get('[data-test="error-value"]').text()).toBe('failed')
        await custom.get('[data-test="error-retry"]').trigger('click')
        expect(custom.emitted('retry')).toHaveLength(1)
        expect(custom.find('[data-slot="empty-title"]').exists()).toBe(false)
    })

    it('prioritizes loading, then error, before empty and content', () => {
        const wrapper = mount(DataPanel, {
            global,
            props: { loading: true, error: new Error('failed'), empty: true },
            slots: { default: '<p data-test="content">内容</p>' },
        })
        expect(wrapper.find('[data-slot="data-panel-loading"]').exists()).toBe(true)
        expect(wrapper.find('[data-slot="data-panel-error"]').exists()).toBe(false)
        expect(wrapper.find('[data-slot="data-panel-empty"]').exists()).toBe(false)

        return wrapper.setProps({ loading: false }).then(() => {
            expect(wrapper.find('[data-slot="data-panel-error"]').exists()).toBe(true)
            expect(wrapper.find('[data-slot="data-panel-empty"]').exists()).toBe(false)
            return wrapper.setProps({ error: undefined })
        }).then(() => {
            expect(wrapper.find('[data-slot="data-panel-empty"]').exists()).toBe(true)
            expect(wrapper.find('[data-test="content"]').exists()).toBe(false)
        })
    })
})
