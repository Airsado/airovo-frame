import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DataTableMobileFilterPanel from './DataTableMobileFilterPanel.vue'
import DataTableToolbar from './DataTableToolbar.vue'

const global = { plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { search: '搜索…', clearSearch: '清除搜索', reset: '重置', refresh: '刷新', searchAction: '搜索', expand: '展开', collapse: '收起', collapseFilters: '收起筛选', expandFilters: '展开筛选', filterActions: '筛选操作', view: '查看', toggleColumns: '切换列' } } } })] }
const originalMatchMedia = window.matchMedia

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: originalMatchMedia,
  })
})

describe('DataTableMobileFilterPanel', () => {
  it('starts open and exposes an accessible collapse control', async () => {
    const wrapper = mount(DataTableMobileFilterPanel, {
      global,
      slots: { default: '<input data-filter />', actions: '<button data-action>重置</button>' },
    })
    expect(wrapper.find('[data-filter]').exists()).toBe(true)
    const trigger = wrapper.find('button[aria-label="收起筛选"]')
    expect(trigger.exists()).toBe(true)
    await trigger.trigger('click')
    expect(wrapper.find('button[aria-label="展开筛选"]').exists()).toBe(true)
  })
})

describe('DataTableToolbar', () => {
  it.each([false, true])('keeps faceted filters usable without text search (mobile: %s)', async (mobile) => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: mobile, addEventListener: () => {}, removeEventListener: () => {} }) })
    const wrapper = mount(DataTableToolbar, {
      global,
      props: {
        showSearch: false,
        collapsibleOnMobile: true,
        hideViewOptions: true,
        filters: [{ key: 'status', title: '状态', singleSelect: true, options: [{ label: '待处理', value: '0' }] }],
        filterValues: { status: '0' },
      },
    })
    await nextTick()
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.text()).toContain('状态')
    const reset = wrapper.findAll('button').find((button) => button.text() === '重置')
    expect(reset).toBeDefined()
    await reset!.trigger('click')
    expect(wrapper.emitted('update:filterValues')).toEqual([[{}]])
    wrapper.unmount()
  })

  it('does not add a refresh button unless explicitly enabled', async () => {
    const wrapper = mount(DataTableToolbar, { global })
    expect(wrapper.find('button[aria-label="刷新"]').exists()).toBe(false)

    const withRefresh = mount(DataTableToolbar, { global, props: { showRefresh: true } })
    expect(withRefresh.find('button[aria-label="刷新"]').exists()).toBe(true)
    await withRefresh.find('button[aria-label="刷新"]').trigger('click')
    expect(withRefresh.emitted('refresh')).toHaveLength(1)
  })

  it('supports explicit search mode, reset and custom slots', async () => {
    const onSearch = vi.fn()
    const wrapper = mount(DataTableToolbar, {
      global,
      props: { onSearch, modelValue: 'active', hasAdditionalFilters: true },
      slots: { 'additional-search': '<span data-additional>extra</span>', 'pre-actions': '<button data-pre>new</button>' },
    })
    expect(wrapper.find('[data-additional]').exists()).toBe(true)
    expect(wrapper.find('[data-pre]').exists()).toBe(true)
    const searchButton = wrapper.findAll('button').find((button) => button.text() === '搜索')
    expect(searchButton).toBeDefined()
    await searchButton!.trigger('click')
    expect(onSearch).toHaveBeenCalledOnce()
  })

  it('renders the mobile filter panel when requested', async () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }) })
    const wrapper = mount(DataTableToolbar, { global, props: { collapsibleOnMobile: true } })
    await nextTick()
    expect(wrapper.findComponent(DataTableMobileFilterPanel).exists()).toBe(true)
    expect(wrapper.find('[aria-label="收起筛选"]').exists()).toBe(true)
  })
})
