import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, it } from 'vitest'
import DataTablePage from './DataTablePage.vue'

const global = {
  plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { viewMode: '视图模式', cardView: '卡片视图', tableView: '表格视图' } } } })],
  stubs: {
    FrameworkTooltip: { template: '<span><slot name="trigger" /></span>' },
    Icon: true,
  },
}

afterEach(() => localStorage.clear())

describe('DataTablePage view mode', () => {
  it('switches the shared table/card slots and persists an uncontrolled mode', async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: { enableViewModeToggle: true, viewModeStorageKey: 'view-mode-test' },
      slots: { toolbar: '<span data-toolbar>toolbar</span>', table: '<div data-table>table</div>', mobile: '<div data-card>card</div>' },
    })

    expect(wrapper.find('[data-table]').exists()).toBe(true)
    expect(wrapper.find('[data-card]').exists()).toBe(false)
    await wrapper.get('button[aria-label="卡片视图"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-table]').exists()).toBe(false)
    expect(wrapper.find('[data-card]').exists()).toBe(true)
    expect(localStorage.getItem('view-mode-test')).toBe('card')
    expect(wrapper.emitted('update:viewMode')?.at(-1)).toEqual(['card'])

    const restored = mount(DataTablePage, {
      global,
      props: { enableViewModeToggle: true, viewModeStorageKey: 'view-mode-test' },
      slots: { table: '<div data-table>table</div>', mobile: '<div data-card>card</div>' },
    })
    await nextTick()
    expect(restored.find('[data-table]').exists()).toBe(false)
    expect(restored.find('[data-card]').exists()).toBe(true)
  })

  it('supports a controlled mode without changing the parent value implicitly', async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: { enableViewModeToggle: true, viewMode: 'card' },
      slots: { table: '<div data-table>table</div>', mobile: '<div data-card>card</div>' },
    })

    expect(wrapper.find('[data-card]').exists()).toBe(true)
    await wrapper.get('button[aria-label="表格视图"]').trigger('click')
    expect(wrapper.emitted('update:viewMode')?.at(-1)).toEqual(['table'])
    expect(wrapper.find('[data-card]').exists()).toBe(true)
  })
})
