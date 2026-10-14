import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import DataTableMobileFilterPanel from './DataTableMobileFilterPanel.vue'
import DataTableToolbar from './DataTableToolbar.vue'

describe('DataTableMobileFilterPanel', () => {
  it('starts open and exposes an accessible collapse control', async () => {
    const wrapper = mount(DataTableMobileFilterPanel, {
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
  it('supports explicit search mode, reset and custom slots', async () => {
    const onSearch = vi.fn()
    const wrapper = mount(DataTableToolbar, {
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
    const wrapper = mount(DataTableToolbar, { props: { collapsibleOnMobile: true } })
    await nextTick()
    expect(wrapper.findComponent(DataTableMobileFilterPanel).exists()).toBe(true)
    expect(wrapper.find('[aria-label="收起筛选"]').exists()).toBe(true)
  })
})
